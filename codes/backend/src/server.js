require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const patientsRoutes = require('./routes/patients');
const casesRoutes = require('./routes/cases');
const postmortemsRoutes = require('./routes/postmortems');
const evidenceRoutes = require('./routes/evidence');
const reportsRoutes = require('./routes/reports');
const staffRoutes = require('./routes/staff');
const policeRoutes = require('./routes/police');
const dashboardRoutes = require('./routes/dashboard');
const notificationsRoutes = require('./routes/notifications');
const auditRoutes = require('./routes/audit');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'FMDMS API' }));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/postmortems', postmortemsRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/police', policeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/users', usersRoutes);

// 404 handler
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`FMDMS API running on http://localhost:${PORT}`);
});
