const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  const { role_id, user_id } = req.user;

  try {
    // --------------------------------------------------------
    // ROLE 1: System Administrator
    // --------------------------------------------------------
    if (role_id === 1) {
      const [[{ totalPatients }]] = await pool.query('SELECT COUNT(*) AS totalPatients FROM patients');
      const [[{ totalCases }]] = await pool.query('SELECT COUNT(*) AS totalCases FROM cases');
      const [[{ openCases }]] = await pool.query("SELECT COUNT(*) AS openCases FROM cases WHERE case_status='Open'");
      const [[{ pendingReports }]] = await pool.query("SELECT COUNT(*) AS pendingReports FROM cases WHERE case_status='Pending Report'");
      const [[{ totalPM }]] = await pool.query('SELECT COUNT(*) AS totalPM FROM postmortems');
      const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
      const [[{ totalAuditLogs }]] = await pool.query('SELECT COUNT(*) AS totalAuditLogs FROM audit_logs');

      const [recentCases] = await pool.query(
        `SELECT c.case_id, c.case_ref_no, c.case_type, c.incident_type, c.case_status, c.created_at, p.full_name AS patient_name
         FROM cases c JOIN patients p ON c.patient_id = p.patient_id
         ORDER BY c.created_at DESC LIMIT 6`
      );

      const [recentAuditLogs] = await pool.query(
        `SELECT a.*, u.username FROM audit_logs a
         LEFT JOIN users u ON a.user_id = u.user_id
         ORDER BY a.created_at DESC LIMIT 6`
      );

      return res.json({
        role_id,
        stats: { totalPatients, totalCases, openCases, pendingReports, totalPM, totalUsers, totalAuditLogs },
        recentCases,
        recentAuditLogs
      });
    }

    // Find staff_id for doctor/JMO/lab/clerical roles
    let staffId = null;
    const [staffRows] = await pool.query('SELECT staff_id FROM staff WHERE user_id = ?', [user_id]);
    if (staffRows.length > 0) {
      staffId = staffRows[0].staff_id;
    }

    // --------------------------------------------------------
    // ROLE 2: Consultant JMO
    // --------------------------------------------------------
    if (role_id === 2) {
      const [[{ assignedCasesCount }]] = await pool.query(
        'SELECT COUNT(*) AS assignedCasesCount FROM cases WHERE assigned_doctor_id = ?',
        [staffId || 0]
      );
      const [[{ pendingPostmortemsCount }]] = await pool.query(
        `SELECT COUNT(*) AS pendingPostmortemsCount FROM postmortems pm
         JOIN cases c ON pm.case_id = c.case_id
         WHERE c.assigned_doctor_id = ? AND c.case_status = 'Pending Report'`,
        [staffId || 0]
      );
      const [[{ pendingApprovalsCount }]] = await pool.query(
        "SELECT COUNT(*) AS pendingApprovalsCount FROM reports WHERE prepared_by = ? AND report_status = 'Draft'",
        [staffId || 0]
      );
      const [[{ upcomingHearingsCount }]] = await pool.query(
        'SELECT COUNT(*) AS upcomingHearingsCount FROM cases WHERE assigned_doctor_id = ? AND trial_date >= CURDATE()',
        [staffId || 0]
      );

      const [recentCases] = await pool.query(
        `SELECT c.case_id, c.case_ref_no, c.case_type, c.case_status, c.created_at, p.full_name AS patient_name
         FROM cases c JOIN patients p ON c.patient_id = p.patient_id
         WHERE c.assigned_doctor_id = ?
         ORDER BY c.created_at DESC LIMIT 6`,
        [staffId || 0]
      );

      const [upcomingTrials] = await pool.query(
        `SELECT case_id, case_ref_no, trial_date FROM cases
         WHERE assigned_doctor_id = ? AND trial_date >= CURDATE()
         ORDER BY trial_date ASC LIMIT 6`,
        [staffId || 0]
      );

      return res.json({
        role_id,
        stats: { assignedCasesCount, pendingPostmortemsCount, pendingApprovalsCount, upcomingHearingsCount },
        recentCases,
        upcomingTrials
      });
    }

    // --------------------------------------------------------
    // ROLE 3: Medical Officer
    // --------------------------------------------------------
    if (role_id === 3) {
      const [[{ assignedExaminationsCount }]] = await pool.query(
        'SELECT COUNT(*) AS assignedExaminationsCount FROM cases WHERE assigned_doctor_id = ?',
        [staffId || 0]
      );
      const [[{ pendingLabRequestsCount }]] = await pool.query(
        `SELECT COUNT(*) AS pendingLabRequestsCount FROM investigations inv
         JOIN cases c ON inv.case_id = c.case_id
         WHERE c.assigned_doctor_id = ? AND inv.result IS NULL`,
        [staffId || 0]
      );
      const [[{ draftReportsCount }]] = await pool.query(
        "SELECT COUNT(*) AS draftReportsCount FROM reports WHERE prepared_by = ? AND report_status = 'Draft'",
        [staffId || 0]
      );

      const [recentCases] = await pool.query(
        `SELECT c.case_id, c.case_ref_no, c.case_type, c.case_status, c.created_at, p.full_name AS patient_name
         FROM cases c JOIN patients p ON c.patient_id = p.patient_id
         WHERE c.assigned_doctor_id = ?
         ORDER BY c.created_at DESC LIMIT 6`,
        [staffId || 0]
      );

      const [pendingLabRequests] = await pool.query(
        `SELECT inv.*, c.case_ref_no FROM investigations inv
         JOIN cases c ON inv.case_id = c.case_id
         WHERE c.assigned_doctor_id = ? AND inv.result IS NULL
         ORDER BY inv.created_at DESC LIMIT 6`,
        [staffId || 0]
      );

      return res.json({
        role_id,
        stats: { assignedExaminationsCount, pendingLabRequestsCount, draftReportsCount },
        recentCases,
        pendingLabRequests
      });
    }

    // --------------------------------------------------------
    // ROLE 4: Laboratory Officer
    // --------------------------------------------------------
    if (role_id === 4) {
      const [[{ pendingTestsCount }]] = await pool.query('SELECT COUNT(*) AS pendingTestsCount FROM investigations WHERE result IS NULL');
      const [[{ completedTestsCount }]] = await pool.query('SELECT COUNT(*) AS completedTestsCount FROM investigations WHERE result IS NOT NULL');

      const [recentLabRequests] = await pool.query(
        `SELECT inv.*, c.case_ref_no, p.full_name AS patient_name FROM investigations inv
         JOIN cases c ON inv.case_id = c.case_id
         JOIN patients p ON c.patient_id = p.patient_id
         WHERE inv.result IS NULL
         ORDER BY inv.created_at DESC LIMIT 6`
      );

      const [completedLabTests] = await pool.query(
        `SELECT inv.*, c.case_ref_no, p.full_name AS patient_name FROM investigations inv
         JOIN cases c ON inv.case_id = c.case_id
         JOIN patients p ON c.patient_id = p.patient_id
         WHERE inv.result IS NOT NULL
         ORDER BY inv.done_date DESC LIMIT 6`
      );

      return res.json({
        role_id,
        stats: { pendingTestsCount, completedTestsCount },
        recentLabRequests,
        completedLabTests
      });
    }

    // --------------------------------------------------------
    // ROLE 5: Clerical Officer
    // --------------------------------------------------------
    if (role_id === 5) {
      const [[{ registrationsToday }]] = await pool.query('SELECT COUNT(*) AS registrationsToday FROM patients WHERE DATE(created_at) = CURDATE()');
      const [[{ policeRequestsCount }]] = await pool.query('SELECT COUNT(*) AS policeRequestsCount FROM cases WHERE police_ref_no IS NOT NULL AND police_ref_no != ""');
      const [[{ totalAppointments }]] = await pool.query('SELECT COUNT(*) AS totalAppointments FROM cases WHERE admission_date >= CURDATE()');

      const [recentPatients] = await pool.query(
        `SELECT * FROM patients ORDER BY created_at DESC LIMIT 6`
      );

      return res.json({
        role_id,
        stats: { registrationsToday, policeRequestsCount, totalAppointments },
        recentPatients
      });
    }

    // --------------------------------------------------------
    // ROLE 6: Court Liaison Officer
    // --------------------------------------------------------
    if (role_id === 6) {
      const [[{ totalHearings }]] = await pool.query('SELECT COUNT(*) AS totalHearings FROM cases WHERE trial_date IS NOT NULL');
      const [[{ upcomingSummons }]] = await pool.query('SELECT COUNT(*) AS upcomingSummons FROM cases WHERE trial_date >= CURDATE()');
      const [[{ courtSubmissions }]] = await pool.query('SELECT COUNT(*) AS courtSubmissions FROM cases WHERE report_submission_date IS NOT NULL');

      const [upcomingHearings] = await pool.query(
        `SELECT c.case_id, c.case_ref_no, c.trial_date, ct.court_name, p.full_name AS patient_name
         FROM cases c
         JOIN patients p ON c.patient_id = p.patient_id
         LEFT JOIN courts ct ON c.court_id = ct.court_id
         WHERE c.trial_date >= CURDATE()
         ORDER BY c.trial_date ASC LIMIT 6`
      );

      return res.json({
        role_id,
        stats: { totalHearings, upcomingSummons, courtSubmissions },
        upcomingHearings
      });
    }

    // --------------------------------------------------------
    // ROLE 7: Research Officer (Anonymized Data)
    // --------------------------------------------------------
    if (role_id === 7) {
      const [[{ totalPatients }]] = await pool.query('SELECT COUNT(*) AS totalPatients FROM patients');
      const [[{ totalCases }]] = await pool.query('SELECT COUNT(*) AS totalCases FROM cases');
      const [[{ totalPM }]] = await pool.query('SELECT COUNT(*) AS totalPM FROM postmortems');

      const [casesByType] = await pool.query(
        'SELECT case_type, COUNT(*) AS count FROM cases GROUP BY case_type'
      );

      const [patientsByGender] = await pool.query(
        'SELECT gender, COUNT(*) AS count FROM patients GROUP BY gender'
      );

      const [patientsByAgeGroup] = await pool.query(
        `SELECT 
          CASE 
            WHEN age <= 18 THEN '0-18'
            WHEN age <= 35 THEN '19-35'
            WHEN age <= 50 THEN '36-50'
            WHEN age <= 65 THEN '51-65'
            ELSE '66+'
          END AS age_group,
          COUNT(*) AS count 
         FROM patients GROUP BY age_group`
      );

      const [casesByStatus] = await pool.query(
        'SELECT case_status, COUNT(*) AS count FROM cases GROUP BY case_status'
      );

      return res.json({
        role_id,
        stats: { totalPatients, totalCases, totalPM },
        anonymousStats: {
          casesByType,
          patientsByGender,
          patientsByAgeGroup,
          casesByStatus
        }
      });
    }

    // --------------------------------------------------------
    // ROLE 8: Data Entry Operator
    // --------------------------------------------------------
    if (role_id === 8) {
      const [[{ registrationsToday }]] = await pool.query('SELECT COUNT(*) AS registrationsToday FROM patients WHERE DATE(created_at) = CURDATE()');
      const [[{ incompleteCases }]] = await pool.query(
        "SELECT COUNT(*) AS incompleteCases FROM cases WHERE case_status = 'Open' AND (police_ref_no IS NULL OR court_id IS NULL)"
      );

      const [recentRegistrations] = await pool.query(
        `SELECT * FROM patients ORDER BY created_at DESC LIMIT 6`
      );

      return res.json({
        role_id,
        stats: { registrationsToday, incompleteCases },
        recentRegistrations
      });
    }

    // Default return empty stats
    res.json({ role_id, stats: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
});

module.exports = router;
