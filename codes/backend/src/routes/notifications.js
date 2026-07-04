const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const [notifications] = await pool.query(
      `SELECT n.*, c.case_ref_no FROM notifications n LEFT JOIN cases c ON n.case_id = c.case_id
       WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 50`,
      [req.user.user_id]
    );

    const [pendingPM] = await pool.query(
      `SELECT case_id, case_ref_no FROM cases WHERE case_status='Pending Report' AND case_type='Postmortem' LIMIT 10`
    );

    const [upcomingTrials] = await pool.query(
      `SELECT case_id, case_ref_no, trial_date FROM cases
       WHERE trial_date IS NOT NULL AND trial_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 14 DAY)
       ORDER BY trial_date ASC`
    );

    const [[{ unreadCount }]] = await pool.query(
      'SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.user_id]
    );

    res.json({ notifications, pendingPM, upcomingTrials, unreadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// PATCH /api/notifications/mark-all-read
router.patch('/mark-all-read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.user_id]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

module.exports = router;
