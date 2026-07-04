const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { auditLog } = require('../utils/audit');
const { PERMISSIONS, ROLES } = require('../config/rbac');

const router = express.Router();
router.use(requireAuth);
router.use(requireRole(PERMISSIONS.CASE_READ));

// GET /api/cases?q=&status=
router.get('/', async (req, res) => {
  const { q, status } = req.query;
  try {
    let sql = `
      SELECT c.*, p.full_name AS patient_name, s.full_name AS doctor_name
      FROM cases c
      JOIN patients p ON c.patient_id = p.patient_id
      LEFT JOIN staff s ON c.assigned_doctor_id = s.staff_id
      WHERE 1=1`;
    const params = [];

    if (q) {
      sql += ' AND (c.case_ref_no LIKE ? OR p.full_name LIKE ? OR c.mlef_no LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (status) {
      sql += ' AND c.case_status = ?';
      params.push(status);
    }
    sql += ' ORDER BY c.created_at DESC';

    const [rows] = await pool.query(sql, params);
    
    // Anonymize patient details for Research Officers.
    if (req.user.role_id === ROLES.RESEARCH_OFFICER) {
      const anonymizedRows = rows.map(r => ({
        ...r,
        patient_name: 'Anonymized Patient'
      }));
      return res.json(anonymizedRows);
    }
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cases.' });
  }
});

// GET /api/cases/:id (full detail incl. postmortem, evidence, reports, investigations)
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [caseRows] = await pool.query(
      `SELECT c.*, p.full_name AS patient_name, p.nic_passport, p.age, p.gender,
              s.full_name AS doctor_name, ps.station_name, ct.court_name
       FROM cases c
       JOIN patients p ON c.patient_id = p.patient_id
       LEFT JOIN staff s ON c.assigned_doctor_id = s.staff_id
       LEFT JOIN police_stations ps ON c.station_id = ps.station_id
       LEFT JOIN courts ct ON c.court_id = ct.court_id
       WHERE c.case_id = ?`,
      [id]
    );
    if (caseRows.length === 0) return res.status(404).json({ error: 'Case not found.' });

    // Retrieve related lists
    const [postmortem] = await pool.query('SELECT * FROM postmortems WHERE case_id = ?', [id]);
    const [evidence] = await pool.query('SELECT * FROM evidence WHERE case_id = ? ORDER BY created_at DESC', [id]);
    const [reports] = await pool.query(
      `SELECT r.*, s.full_name AS prepared_by_name FROM reports r
       LEFT JOIN staff s ON r.prepared_by = s.staff_id
       WHERE r.case_id = ? ORDER BY r.created_at DESC`,
      [id]
    );
    const [investigations] = await pool.query('SELECT * FROM investigations WHERE case_id = ? ORDER BY created_at DESC', [id]);

    let caseData = caseRows[0];
    let postmortemData = postmortem[0] || null;
    let reportsData = reports;

    // Apply Research Officer limits.
    if (req.user.role_id === ROLES.RESEARCH_OFFICER) {
      // Mask patient details
      caseData = {
        ...caseData,
        patient_name: 'Anonymized Patient',
        nic_passport: '********'
      };
      // Suppress confidential postmortem and reports
      postmortemData = null;
      reportsData = [];
    }

    res.json({
      ...caseData,
      postmortem: postmortemData,
      evidence,
      reports: reportsData,
      investigations,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch case.' });
  }
});

// POST /api/cases
router.post('/', requireRole(PERMISSIONS.CASE_CREATE), async (req, res) => {
  const {
    case_ref_no, case_type, incident_type, patient_id, mlef_no, police_ref_no,
    station_id, assigned_doctor_id, court_id, admission_date, examination_date,
    reason_for_referral,
  } = req.body;

  if (!case_ref_no || !patient_id) {
    return res.status(400).json({ error: 'Case reference number and patient are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO cases (case_ref_no, case_type, incident_type, patient_id, mlef_no, police_ref_no,
        station_id, assigned_doctor_id, court_id, admission_date, examination_date, reason_for_referral, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        case_ref_no, case_type || 'Clinical', incident_type || null, patient_id,
        mlef_no || null, police_ref_no || null, station_id || null,
        assigned_doctor_id || null, court_id || null, admission_date || null,
        examination_date || null, reason_for_referral || null, req.user.user_id,
      ]
    );
    await auditLog(req.user.user_id, 'CREATE', 'cases', result.insertId, `Created case: ${case_ref_no}`, req.ip);
    res.status(201).json({ case_id: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A case with this reference number already exists.' });
    }
    res.status(500).json({ error: 'Failed to create case.' });
  }
});

// PATCH /api/cases/:id/status
router.patch('/:id/status', requireRole(PERMISSIONS.CASE_STATUS_UPDATE), async (req, res) => {
  const { case_status } = req.body;
  const validStatuses = ['Open', 'Pending Report', 'Report Issued', 'Closed'];
  if (!validStatuses.includes(case_status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }
  try {
    await pool.query('UPDATE cases SET case_status = ? WHERE case_id = ?', [case_status, req.params.id]);
    await auditLog(req.user.user_id, 'UPDATE', 'cases', req.params.id, `Status changed to ${case_status}`, req.ip);
    res.json({ message: 'Status updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

module.exports = router;
