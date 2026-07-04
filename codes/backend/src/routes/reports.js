const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { auditLog } = require('../utils/audit');
const { PERMISSIONS, ROLES } = require('../config/rbac');

const router = express.Router();
router.use(requireAuth);

// GET /api/reports
router.get('/', requireRole(PERMISSIONS.REPORT_READ), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, c.case_ref_no, p.full_name AS patient_name, s.full_name AS prepared_by_name
       FROM reports r
       JOIN cases c ON r.case_id = c.case_id
       JOIN patients p ON c.patient_id = p.patient_id
       LEFT JOIN staff s ON r.prepared_by = s.staff_id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

// GET /api/reports/:id
router.get('/:id', requireRole(PERMISSIONS.REPORT_READ), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, c.case_ref_no, c.case_id, p.full_name AS patient_name, p.age, p.gender,
              s.full_name AS prepared_by_name, ct.court_name
       FROM reports r
       JOIN cases c ON r.case_id = c.case_id
       JOIN patients p ON c.patient_id = p.patient_id
       LEFT JOIN staff s ON r.prepared_by = s.staff_id
       LEFT JOIN courts ct ON r.court_id = ct.court_id
       WHERE r.report_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Report not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch report.' });
  }
});

// POST /api/reports
router.post('/', requireRole(PERMISSIONS.REPORT_CREATE), async (req, res) => {
  const {
    case_id, report_type, serial_no, report_date, prepared_by,
    findings, opinion, recommendations, court_id,
  } = req.body;

  if (!case_id || !report_type) {
    return res.status(400).json({ error: 'Case and report type are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO reports (case_id, report_type, serial_no, report_date, prepared_by, findings, opinion, recommendations, court_id, report_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft')`,
      [
        case_id, report_type, serial_no || null, report_date || null,
        prepared_by || null, findings || null, opinion || null,
        recommendations || null, court_id || null,
      ]
    );
    await auditLog(req.user.user_id, 'CREATE', 'reports', result.insertId, `Created ${report_type} report for case ID ${case_id}`, req.ip);
    res.status(201).json({ report_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create report.' });
  }
});

// PUT /api/reports/:id. Finalized reports require administrator approval.
router.put('/:id', requireRole(PERMISSIONS.REPORT_CREATE), async (req, res) => {
  const { findings, opinion, recommendations, court_id, report_type, serial_no, report_date } = req.body;

  try {
    const [rows] = await pool.query('SELECT report_status, report_type, case_id FROM reports WHERE report_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Report not found.' });

    const report = rows[0];

    if (report.report_status !== 'Draft' && req.user.role_id !== ROLES.ADMIN) {
      return res.status(403).json({
        error: 'Finalized forensic reports cannot be edited unless explicitly reopened with administrator approval.'
      });
    }

    await pool.query(
      `UPDATE reports SET findings = ?, opinion = ?, recommendations = ?, court_id = ?, report_type = ?, serial_no = ?, report_date = ?
       WHERE report_id = ?`,
      [
        findings || null, opinion || null, recommendations || null, court_id || null,
        report_type || report.report_type, serial_no || null, report_date || null,
        req.params.id
      ]
    );

    await auditLog(
      req.user.user_id,
      'UPDATE',
      'reports',
      req.params.id,
      `Updated report (Status: ${report.report_status}) for case ID ${report.case_id}`,
      req.ip
    );

    res.json({ message: 'Report updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update report.' });
  }
});

// PATCH /api/reports/:id/status
router.patch('/:id/status', requireRole(PERMISSIONS.REPORT_APPROVE), async (req, res) => {
  const { report_status } = req.body;
  const validStatuses = ['Draft', 'Issued', 'Dispatched'];
  if (!validStatuses.includes(report_status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  try {
    const [reportRows] = await pool.query('SELECT case_id, report_status FROM reports WHERE report_id = ?', [req.params.id]);
    if (reportRows.length === 0) return res.status(404).json({ error: 'Report not found.' });

    const currentStatus = reportRows[0].report_status;

    // Finalized reports cannot be reopened (set back to Draft) without Administrator approval.
    if (report_status === 'Draft' && currentStatus !== 'Draft' && req.user.role_id !== ROLES.ADMIN) {
      return res.status(403).json({
        error: 'Finalized forensic reports cannot be reopened without administrator approval.'
      });
    }

    const extraSet = report_status === 'Dispatched' ? ', dispatch_date = CURDATE()' : '';
    await pool.query(`UPDATE reports SET report_status = ?${extraSet} WHERE report_id = ?`, [report_status, req.params.id]);

    if (report_status === 'Issued' || report_status === 'Dispatched') {
      await pool.query("UPDATE cases SET case_status = 'Report Issued' WHERE case_id = ?", [reportRows[0].case_id]);
    }

    await auditLog(req.user.user_id, 'UPDATE', 'reports', req.params.id, `Report status changed to ${report_status}`, req.ip);
    res.json({ message: 'Status updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

module.exports = router;
