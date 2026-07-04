const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { auditLog } = require('../utils/audit');
const { PERMISSIONS } = require('../config/rbac');

const router = express.Router();
router.use(requireAuth);
router.use(requireRole(PERMISSIONS.POSTMORTEM_READ));

// GET /api/postmortems
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pm.*, c.case_ref_no, p.full_name AS patient_name, s.full_name AS doctor_name
       FROM postmortems pm
       JOIN cases c ON pm.case_id = c.case_id
       JOIN patients p ON c.patient_id = p.patient_id
       LEFT JOIN staff s ON pm.examining_doctor_id = s.staff_id
       ORDER BY pm.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch postmortem records.' });
  }
});

// GET /api/postmortems/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pm.*, c.case_ref_no, c.case_id, p.full_name AS patient_name, p.age, p.gender, s.full_name AS doctor_name
       FROM postmortems pm
       JOIN cases c ON pm.case_id = c.case_id
       JOIN patients p ON c.patient_id = p.patient_id
       LEFT JOIN staff s ON pm.examining_doctor_id = s.staff_id
       WHERE pm.pm_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Postmortem record not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch record.' });
  }
});

// POST /api/postmortems
router.post('/', requireRole(PERMISSIONS.POSTMORTEM_WRITE), async (req, res) => {
  const {
    case_id, pm_serial_no, inquest_no, inquest_date, pm_ordered_by, place_of_pm,
    pm_date, pm_time, examining_doctor_id, place_of_death, date_of_death, bht_no,
    history_from_police, history_from_family, external_examination, internal_examination,
    cause_of_death_ia, cause_of_death_ib, cause_of_death_ii, manner_of_death, comments,
  } = req.body;

  if (!case_id) return res.status(400).json({ error: 'Case is required.' });

  try {
    const [result] = await pool.query(
      `INSERT INTO postmortems (case_id, pm_serial_no, inquest_no, inquest_date, pm_ordered_by, place_of_pm,
        pm_date, pm_time, examining_doctor_id, place_of_death, date_of_death, bht_no,
        history_from_police, history_from_family, external_examination, internal_examination,
        cause_of_death_ia, cause_of_death_ib, cause_of_death_ii, manner_of_death, comments)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        case_id, pm_serial_no || null, inquest_no || null, inquest_date || null,
        pm_ordered_by || null, place_of_pm || null, pm_date || null, pm_time || null,
        examining_doctor_id || null, place_of_death || 'Unknown', date_of_death || null,
        bht_no || null, history_from_police || null, history_from_family || null,
        external_examination || null, internal_examination || null,
        cause_of_death_ia || null, cause_of_death_ib || null, cause_of_death_ii || null,
        manner_of_death || 'Undetermined', comments || null,
      ]
    );

    await pool.query("UPDATE cases SET case_status='Pending Report' WHERE case_id = ?", [case_id]);
    await auditLog(req.user.user_id, 'CREATE', 'postmortems', result.insertId, `Created postmortem record for case ID ${case_id}`, req.ip);

    res.status(201).json({ pm_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create postmortem record.' });
  }
});

// PATCH /api/postmortems/:id/issue (Only JMO and Admin can approve/issue report)
router.patch('/:id/issue', requireRole(PERMISSIONS.POSTMORTEM_ISSUE), async (req, res) => {
  try {
    const [pmRows] = await pool.query('SELECT case_id FROM postmortems WHERE pm_id = ?', [req.params.id]);
    if (pmRows.length === 0) return res.status(404).json({ error: 'Record not found.' });

    await pool.query(
      'UPDATE postmortems SET pm_report_issued = 1, pm_report_date = CURDATE() WHERE pm_id = ?',
      [req.params.id]
    );
    await pool.query("UPDATE cases SET case_status = 'Report Issued' WHERE case_id = ?", [pmRows[0].case_id]);
    await auditLog(req.user.user_id, 'UPDATE', 'postmortems', req.params.id, 'Marked PM report as issued', req.ip);

    res.json({ message: 'Report marked as issued.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update record.' });
  }
});

module.exports = router;
