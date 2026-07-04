const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/rbac');
const { auditLog } = require('../utils/audit');

const router = express.Router();
router.use(requireAuth);
router.use(requireRole(PERMISSIONS.POLICE_READ));

// GET /api/police/stations
router.get('/stations', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM police_stations ORDER BY station_name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch police stations.' });
  }
});

// POST /api/police/stations
router.post('/stations', requireRole(PERMISSIONS.POLICE_WRITE), async (req, res) => {
  const { station_name, district, contact_no } = req.body;
  if (!station_name) return res.status(400).json({ error: 'Station name is required.' });

  try {
    const [result] = await pool.query(
      'INSERT INTO police_stations (station_name, district, contact_no) VALUES (?, ?, ?)',
      [station_name, district || null, contact_no || null]
    );
    await auditLog(req.user.user_id, 'CREATE', 'police_stations', result.insertId, `Added police station: ${station_name}`, req.ip);
    res.status(201).json({ station_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add police station.' });
  }
});

// GET /api/police/cases — cases linked to a police station
router.get('/cases', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.case_id, c.case_ref_no, c.police_ref_no, c.case_status, ps.station_name, p.full_name AS patient_name
       FROM cases c
       LEFT JOIN police_stations ps ON c.station_id = ps.station_id
       JOIN patients p ON c.patient_id = p.patient_id
       WHERE c.station_id IS NOT NULL
       ORDER BY c.created_at DESC LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cases.' });
  }
});

// GET /api/police/courts
router.get('/courts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM courts ORDER BY court_name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courts.' });
  }
});

module.exports = router;
