const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { auditLog } = require('../utils/audit');
const { PERMISSIONS, ROLES } = require('../config/rbac');

const router = express.Router();
router.use(requireAuth);
router.use(requireRole(PERMISSIONS.PATIENT_READ));

// GET /api/patients?q=search
router.get('/', async (req, res) => {
  const { q } = req.query;
  try {
    let sql = 'SELECT * FROM patients';
    const params = [];
    if (q) {
      sql += ' WHERE full_name LIKE ? OR nic_passport LIKE ? OR hospital_no LIKE ?';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    sql += ' ORDER BY patient_id DESC';
    const [rows] = await pool.query(sql, params);
    
    // Anonymize personally identifiable fields for Research Officers.
    if (req.user.role_id === ROLES.RESEARCH_OFFICER) {
      const anonymizedRows = rows.map(r => ({
        ...r,
        full_name: 'Anonymized Patient',
        nic_passport: '********',
        address: 'Anonymized Address',
        contact_no: '********',
        hospital_no: '********'
      }));
      return res.json(anonymizedRows);
    }
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch patients.' });
  }
});

// GET /api/patients/:id (with linked cases)
router.get('/:id', async (req, res) => {
  try {
    const [patientRows] = await pool.query('SELECT * FROM patients WHERE patient_id = ?', [req.params.id]);
    if (patientRows.length === 0) return res.status(404).json({ error: 'Patient not found.' });

    const [cases] = await pool.query(
      'SELECT * FROM cases WHERE patient_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );

    let patient = patientRows[0];
    if (req.user.role_id === ROLES.RESEARCH_OFFICER) {
      patient = {
        ...patient,
        full_name: 'Anonymized Patient',
        nic_passport: '********',
        address: 'Anonymized Address',
        contact_no: '********',
        hospital_no: '********'
      };
    }

    res.json({ ...patient, cases });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch patient.' });
  }
});

// POST /api/patients
router.post('/', requireRole(PERMISSIONS.PATIENT_CREATE), async (req, res) => {
  const {
    full_name, nic_passport, age, date_of_birth, gender,
    address, contact_no, hospital_no, patient_type,
  } = req.body;

  if (!full_name) return res.status(400).json({ error: 'Full name is required.' });

  try {
    const [result] = await pool.query(
      `INSERT INTO patients (full_name, nic_passport, age, date_of_birth, gender, address, contact_no, hospital_no, patient_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name, nic_passport || null, age || null, date_of_birth || null,
        gender || 'Unknown', address || null, contact_no || null,
        hospital_no || null, patient_type || 'Clinical',
      ]
    );
    await auditLog(req.user.user_id, 'CREATE', 'patients', result.insertId, `Registered patient: ${full_name}`, req.ip);
    res.status(201).json({ patient_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create patient.' });
  }
});

// PUT /api/patients/:id
router.put('/:id', requireRole(PERMISSIONS.PATIENT_UPDATE), async (req, res) => {
  const {
    full_name, nic_passport, age, date_of_birth, gender,
    address, contact_no, hospital_no, patient_type,
  } = req.body;

  if (!full_name) return res.status(400).json({ error: 'Full name is required.' });

  try {
    await pool.query(
      `UPDATE patients SET full_name=?, nic_passport=?, age=?, date_of_birth=?, gender=?,
       address=?, contact_no=?, hospital_no=?, patient_type=? WHERE patient_id=?`,
      [
        full_name, nic_passport || null, age || null, date_of_birth || null,
        gender || 'Unknown', address || null, contact_no || null,
        hospital_no || null, patient_type || 'Clinical', req.params.id,
      ]
    );
    await auditLog(req.user.user_id, 'UPDATE', 'patients', req.params.id, `Updated patient: ${full_name}`, req.ip);
    res.json({ message: 'Patient updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update patient.' });
  }
});

module.exports = router;
