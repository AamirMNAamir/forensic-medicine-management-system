require('dotenv').config();

// Fail fast if JWT secret is missing or too weak
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error(
    'FATAL: JWT_SECRET is missing or too short (must be at least 32 characters). Set it in .env before starting the server.'
  );
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

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

// Trust reverse proxy (needed when deployed behind nginx, Railway, Render, etc.)
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));

app.use(express.json());

// Rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please try again later.'
  }
});

// Rate limiter for registration
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many registration attempts. Please try again later.'
  }
});

// Apply rate limiting before auth routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FMDMS API'
  });
});

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
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found.'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    error: 'Internal server error.'
  });
});

app.listen(PORT, () => {
  console.log(`FMDMS API running on http://localhost:${PORT}`);
});