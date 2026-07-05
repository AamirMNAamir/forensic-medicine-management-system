const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { PERMISSIONS, ROLE_RECORDS } = require('../config/rbac');
const { auditLog } = require('../utils/audit');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT u.*, r.role_name FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.username = ? AND u.is_active = 1`,
      [username]
    );

    const ip = req.ip;

    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO login_history (user_id, ip_address, status) VALUES (NULL, ?, 'failed')`,
        [ip]
      );
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = rows[0];

    // Check if account is currently locked out
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const lockTimeRemaining = Math.ceil((new Date(user.lockout_until) - new Date()) / 1000 / 60);
      return res.status(401).json({
        error: `Account is temporarily locked due to multiple failed attempts. Please try again in ${lockTimeRemaining} minute(s).`
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      const attempts = (user.failed_attempts || 0) + 1;
      let lockout_until = null;
      let errorMsg = 'Invalid username or password.';

      if (attempts >= 5) {
        lockout_until = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
        errorMsg = 'Account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.';
        await pool.query(
          `UPDATE users SET failed_attempts = ?, lockout_until = ? WHERE user_id = ?`,
          [attempts, lockout_until, user.user_id]
        );
      } else {
        const remaining = 5 - attempts;
        errorMsg = `Invalid username or password. ${remaining} attempt(s) remaining before account lockout.`;
        await pool.query(
          `UPDATE users SET failed_attempts = ? WHERE user_id = ?`,
          [attempts, user.user_id]
        );
      }

      await pool.query(
        `INSERT INTO login_history (user_id, ip_address, status) VALUES (?, ?, 'failed')`,
        [user.user_id, ip]
      );

      return res.status(401).json({ error: errorMsg });
    }

    // Reset failed attempts on successful login
    await pool.query(
      `UPDATE users SET failed_attempts = 0, lockout_until = NULL, last_login = NOW() WHERE user_id = ?`,
      [user.user_id]
    );

    await pool.query(
      `INSERT INTO login_history (user_id, ip_address, status) VALUES (?, ?, 'success')`,
      [user.user_id, ip]
    );

    const payload = {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role_id: user.role_id,
      role_name: user.role_name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

async function syncRbacRoles() {
  await pool.query(
    `INSERT INTO roles (role_id, role_name, description)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       role_name = VALUES(role_name),
       description = VALUES(description)`,
    [ROLE_RECORDS.map((role) => [role.role_id, role.role_name, role.description])]
  );
}

// GET /api/auth/roles (Public)
router.get('/roles', async (req, res) => {
  try {
    await syncRbacRoles();
    const [rows] = await pool.query('SELECT role_id, role_name, description FROM roles ORDER BY role_id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch roles.' });
  }
});

// POST /api/auth/register (Public account creation / Sign Up)
router.post('/register', async (req, res) => {
  const { username, password, full_name, email, role_id, slmc_reg_no, specialization, contact_no } = req.body;
  if (!username || !password || !full_name || !role_id) {
    return res.status(400).json({ error: 'Username, password, full name, and role are required.' });
  }

  // Public self-registration must never grant privileged roles.
  // Only an authenticated Admin (using requireAuth+requireRole on a separate
  // /api/users route) should be able to assign role_id 1 (Admin).
  const RESTRICTED_ROLE_IDS = [1]; // System Administrator
  const isAdminRequest = req.user && req.user.role_id === 1;
  if (RESTRICTED_ROLE_IDS.includes(parseInt(role_id)) && !isAdminRequest) {
    return res.status(403).json({ error: 'This role cannot be self-assigned during registration.' });
  }

  try {
    // Check if role exists
    const [roles] = await pool.query('SELECT role_id FROM roles WHERE role_id = ?', [role_id]);
    if (roles.length === 0) {
      return res.status(400).json({ error: 'Invalid role selected.' });
    }

    // Check if username already exists
    const [existingUser] = await pool.query('SELECT user_id FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Check if email already exists
    if (email) {
      const [existingEmail] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ error: 'Email is already registered.' });
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const [userResult] = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, role_id, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [username, password_hash, full_name, email || null, role_id]
    );

    const userId = userResult.insertId;

    // Insert into staff table for all roles
    let designation = 'Staff';
    if (parseInt(role_id) === 1) designation = 'System Admin';
    else if (parseInt(role_id) === 2) designation = 'Consultant JMO';
    else if (parseInt(role_id) === 3) designation = 'Medical Officer';
    else if (parseInt(role_id) === 4) designation = 'Laboratory Officer';
    else if (parseInt(role_id) === 5) designation = 'Clerical Officer';
    else if (parseInt(role_id) === 6) designation = 'Court Liaison Officer';
    else if (parseInt(role_id) === 7) designation = 'Research Officer';
    else if (parseInt(role_id) === 8) designation = 'Data Entry Operator';

    await pool.query(
      `INSERT INTO staff (full_name, designation, email, slmc_reg_no, specialization, contact_no, user_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        full_name,
        designation,
        email || null,
        slmc_reg_no || null,
        specialization || null,
        contact_no || null,
        userId
      ]
    );

    const logUserId = req.user ? req.user.user_id : userId;
    const logDescription = req.user ? `Created user: ${username}` : `User self-registered: ${username}`;
    await auditLog(logUserId, 'CREATE', 'users', userId, logDescription, req.ip);

    res.status(201).json({ message: 'User registered successfully.', user_id: userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.username, u.full_name, u.email, u.last_login, u.created_at, r.role_name, u.role_id
       FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?`,
      [req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Current password and a new password (min 6 chars) are required.' });
  }

  try {
    const [rows] = await pool.query(`SELECT password_hash FROM users WHERE user_id = ?`, [req.user.user_id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect.' });

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query(`UPDATE users SET password_hash = ? WHERE user_id = ?`, [newHash, req.user.user_id]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
