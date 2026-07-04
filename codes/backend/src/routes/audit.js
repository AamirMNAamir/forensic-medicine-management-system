const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/rbac');

const router = express.Router();
router.use(requireAuth);
router.use(requireRole(PERMISSIONS.AUDIT_READ));

// GET /api/audit
router.get('/', async (req, res) => {
  try {
    const [logs] = await pool.query(
      `SELECT al.*, u.full_name, u.username FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.user_id
       ORDER BY al.created_at DESC LIMIT 200`
    );
    const [loginHistory] = await pool.query(
      `SELECT lh.*, u.username FROM login_history lh
       LEFT JOIN users u ON lh.user_id = u.user_id
       ORDER BY lh.login_time DESC LIMIT 50`
    );
    res.json({ logs, loginHistory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit log.' });
  }
});

module.exports = router;
