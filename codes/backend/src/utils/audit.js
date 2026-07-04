const pool = require('../config/db');

async function auditLog(userId, action, tableName, recordId, description, ip = '') {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, description, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, tableName, recordId, description, ip]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

async function addNotification(userId, caseId, message, type = 'System') {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, case_id, message, notif_type) VALUES (?, ?, ?, ?)`,
      [userId, caseId, message, type]
    );
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}

module.exports = { auditLog, addNotification };
