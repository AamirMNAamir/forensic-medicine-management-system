const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { auditLog } = require('../utils/audit');
const { PERMISSIONS } = require('../config/rbac');

const router = express.Router();
router.use(requireAuth);
router.use(requireRole(PERMISSIONS.EVIDENCE_READ));

// GET /api/evidence
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, c.case_ref_no FROM evidence e JOIN cases c ON e.case_id = c.case_id ORDER BY e.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch evidence.' });
  }
});

// POST /api/evidence
router.post('/', requireRole(PERMISSIONS.EVIDENCE_WRITE), async (req, res) => {
  const {
    case_id, evidence_type, description, storage_location,
    collected_date, collected_by, chain_of_custody,
  } = req.body;

  if (!case_id || !description) {
    return res.status(400).json({ error: 'Case and description are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO evidence (case_id, evidence_type, description, storage_location, collected_date, collected_by, chain_of_custody)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        case_id, evidence_type || 'Other', description, storage_location || null,
        collected_date || null, collected_by || null, chain_of_custody || null,
      ]
    );
    await auditLog(req.user.user_id, 'CREATE', 'evidence', result.insertId, `Added evidence to case ID ${case_id}`, req.ip);
    res.status(201).json({ evidence_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add evidence.' });
  }
});

module.exports = router;
