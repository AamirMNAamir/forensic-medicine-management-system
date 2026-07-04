const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { auditLog } = require('../utils/audit');
const { PERMISSIONS } = require('../config/rbac');

const router = express.Router();
router.use(requireAuth);
router.use(requireRole(PERMISSIONS.STAFF_READ));

// GET /api/staff
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM staff ORDER BY full_name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch staff.' });
  }
});

// POST /api/staff
router.post('/', requireRole(PERMISSIONS.STAFF_WRITE), async (req, res) => {
  const { full_name, designation, specialization, slmc_reg_no, contact_no, email } = req.body;
  if (!full_name) return res.status(400).json({ error: 'Name is required.' });

  try {
    const [result] = await pool.query(
      `INSERT INTO staff (full_name, designation, specialization, slmc_reg_no, contact_no, email)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [full_name, designation || null, specialization || null, slmc_reg_no || null, contact_no || null, email || null]
    );
    await auditLog(req.user.user_id, 'CREATE', 'staff', result.insertId, `Added staff member: ${full_name}`, req.ip);
    res.status(201).json({ staff_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add staff member.' });
  }
});

module.exports = router;
