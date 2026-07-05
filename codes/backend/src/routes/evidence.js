const express = require('express');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
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

// --- File attachment upload ---

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    const allowedExt = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (!allowedExt.includes(safeExt)) {
      return cb(new Error('Unsupported file type. Allowed: PDF, JPG, JPEG, PNG.'));
    }
    cb(null, `${crypto.randomUUID()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /api/evidence/case/:caseId/attachments
router.post(
  '/case/:caseId/attachments',
  requireRole(PERMISSIONS.EVIDENCE_WRITE),
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const fileTypeMap = { '.pdf': 'Document', '.jpg': 'Photo', '.jpeg': 'Photo', '.png': 'Photo' };
    const ext = path.extname(req.file.originalname).toLowerCase();
    const file_type = fileTypeMap[ext] || 'Other';

    try {
      const [result] = await pool.query(
        `INSERT INTO attachments (case_id, file_name, file_path, file_type, uploaded_by)
         VALUES (?, ?, ?, ?, ?)`,
        [req.params.caseId, req.file.originalname, req.file.filename, file_type, req.user.user_id]
      );
      await auditLog(
        req.user.user_id, 'CREATE', 'attachments', result.insertId,
        `Uploaded file ${req.file.originalname} for case ID ${req.params.caseId}`, req.ip
      );
      res.status(201).json({ attachment_id: result.insertId, message: 'File uploaded successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save attachment record.' });
    }
  }
);

module.exports = router;