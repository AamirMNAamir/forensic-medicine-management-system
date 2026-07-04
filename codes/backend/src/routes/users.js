const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { auditLog } = require('../utils/audit');
const { PERMISSIONS } = require('../config/rbac');

const router = express.Router();
router.use(requireAuth);
router.use(requireRole(PERMISSIONS.USER_MANAGE));

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.username, u.full_name, u.email, u.role_id, u.is_active, u.last_login, u.created_at, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       ORDER BY u.user_id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  const { username, password, full_name, email, role_id, slmc_reg_no, specialization, contact_no } = req.body;
  if (!username || !password || !full_name || !role_id) {
    return res.status(400).json({ error: 'Username, password, full name, and role are required.' });
  }

  try {
    // Check if username already exists
    const [existingUser] = await pool.query('SELECT user_id FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [userResult] = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, role_id, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [username, password_hash, full_name, email || null, role_id]
    );

    const userId = userResult.insertId;

    // Auto-create staff record for all roles
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

    await auditLog(req.user.user_id, 'CREATE', 'users', userId, `Created user: ${username}`, req.ip);

    res.status(201).json({ message: 'User created successfully.', user_id: userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const { full_name, email, role_id, is_active } = req.body;
  if (!full_name || !role_id) {
    return res.status(400).json({ error: 'Full name and role are required.' });
  }

  try {
    await pool.query(
      `UPDATE users SET full_name = ?, email = ?, role_id = ?, is_active = ? WHERE user_id = ?`,
      [full_name, email || null, role_id, is_active, req.params.id]
    );

    await auditLog(req.user.user_id, 'UPDATE', 'users', req.params.id, `Updated user ID ${req.params.id}`, req.ip);

    res.json({ message: 'User updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// POST /api/users/:id/reset-password
router.post('/:id/reset-password', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password is required and must be at least 6 characters.' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = ?, failed_attempts = 0, lockout_until = NULL WHERE user_id = ?', [password_hash, req.params.id]);

    await auditLog(req.user.user_id, 'UPDATE', 'users', req.params.id, `Reset password for user ID ${req.params.id}`, req.ip);

    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.user_id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' });
    }

    await pool.query('UPDATE staff SET user_id = NULL WHERE user_id = ?', [req.params.id]);
    await pool.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);

    await auditLog(req.user.user_id, 'DELETE', 'users', req.params.id, `Deleted user ID ${req.params.id}`, req.ip);

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

module.exports = router;
