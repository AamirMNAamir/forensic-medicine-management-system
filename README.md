# 🧬 Forensic Medicine Department Management System (FMDMS)

A full-stack web application for digitizing and managing the operations of a forensic medicine department — patient intake, case tracking, postmortem records, evidence handling, forensic reports, police liaison, and role-based staff access, all backed by an audit trail.

---

## 📖 Overview

FMDMS replaces paper-based forensic case files with a centralized system that lets clerical staff, medical officers, consultants, laboratory officers, and court liaison officers collaborate on the same case record — from initial patient registration through to a signed-off forensic report — while every sensitive action is tracked in an audit log.

## ✨ Key Features

- **Case Management** — create and track forensic cases from intake to closure, linked to patients, police stations, and courts.
- **Patient Records** — register and search patient records used across cases and examinations.
- **Postmortem & Clinical Examinations** — record clinical examination findings and postmortem details tied to a case.
- **Evidence Tracking** — log evidence items and lab investigation requests/results.
- **Forensic Reports** — draft, review, and approve reports with a sign-off workflow.
- **Police & Court Liaison** — manage police station/officer records and court references tied to a case.
- **Role-Based Access Control (RBAC)** — 8 distinct staff roles, each scoped to specific permissions (see below).
- **Authentication & Security** — JWT-based sessions, bcrypt password hashing, login history, and automatic account lockout after repeated failed logins.
- **Notifications** — in-app notifications for staff.
- **Audit Log** — administrator-only visibility into system-wide activity.
- **File Uploads** — attachment support for case-related documents.

## 🧑‍⚕️ Roles & Permissions

| Role | Responsibilities |
|---|---|
| **System Administrator** | Full system control, user management, audit logs, and security settings |
| **Consultant JMO** | Forensic examinations, postmortems, and approving forensic reports |
| **Medical Officer** | Assists with examinations, drafts postmortem records, requests lab tests |
| **Laboratory Officer** | Manages lab test requests, records results, uploads reports |
| **Clerical Officer** | Patient registration, police requests, scheduling, administrative documents |
| **Court Liaison Officer** | Creates court records, uploads summons, tracks hearing schedules |
| **Research Officer** | Accesses anonymized forensic data for statistical/academic research |
| **Data Entry Operator** | Digitizes paper records, patient registration, document uploads |

Access to every route and API endpoint is enforced against this role matrix on both the frontend (route guards) and backend (middleware).

## 🚀 Tech Stack

**Frontend**
- React 18 (Vite)
- React Router v6
- Axios

**Backend**
- Node.js + Express
- MySQL (via `mysql2`)
- JWT authentication (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- File uploads (`multer`)

**Database**
- MySQL — schema defined in [`codes/database.sql`](codes/database.sql)

## 📂 Project Structure

```
forensic-medicine-management-system/
├── codes/
│   ├── frontend/                # React + Vite SPA
│   │   ├── src/
│   │   │   ├── api/             # Axios client
│   │   │   ├── components/      # Shared UI, layout, protected routes
│   │   │   ├── config/          # Frontend RBAC config
│   │   │   ├── context/         # Auth context/provider
│   │   │   └── pages/           # Route-level pages (patients, cases, reports, etc.)
│   │   ├── vite.config.js
│   │   └── package.json
│   ├── backend/                 # Express REST API
│   │   ├── src/
│   │   │   ├── config/          # DB connection, RBAC roles/permissions
│   │   │   ├── middleware/      # Auth (JWT) & role-guard middleware
│   │   │   ├── routes/          # auth, patients, cases, postmortems, evidence,
│   │   │   │                    # reports, staff, police, dashboard,
│   │   │   │                    # notifications, audit, users
│   │   │   ├── utils/           # Audit logging helper
│   │   │   └── server.js        # App entry point
│   │   ├── uploads/             # Uploaded file storage
│   │   ├── .env.example
│   │   └── package.json
│   └── database.sql             # Full MySQL schema
└── README.md
```

## 🗄️ Database Schema

The schema (`codes/database.sql`) defines the following tables:

`roles`, `users`, `login_history`, `staff`, `police_stations`, `police_officers`, `patients`, `courts`, `cases`, `clinical_examinations`, `postmortems`, `investigations`, `referrals`, `evidence`, `reports`, `attachments`, `notifications`, `audit_logs`

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- [MySQL](https://www.mysql.com/) 8+

### 1. Clone the repository

```bash
git clone https://github.com/AamirMNAamir/forensic-medicine-management-system.git
cd forensic-medicine-management-system
```

### 2. Set up the database

```bash
mysql -u root -p -e "CREATE DATABASE fmdms;"
mysql -u root -p fmdms < codes/database.sql
```

### 3. Configure and run the backend

```bash
cd codes/backend
cp .env.example .env   # then edit values as needed
npm install
npm run dev             # starts with nodemon on http://localhost:5000
```

`.env` variables:

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `5000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | *(empty)* |
| `DB_NAME` | MySQL database name | `fmdms` |
| `JWT_SECRET` | Secret used to sign JWTs — **must be changed in production** | — |
| `JWT_EXPIRES_IN` | JWT token lifetime | `8h` |
| `CORS_ORIGIN` | Allowed origin for CORS | `http://localhost:5173` |

### 4. Run the frontend

```bash
cd codes/frontend
npm install
npm run dev              # starts Vite dev server on http://localhost:5173
```

The frontend expects the API to be reachable at the URL configured in `src/api/client.js` (defaults to the backend's `http://localhost:5000`).

### 5. Log in

Use credentials seeded via `database.sql`, or register a new account through the `/register` page, then verify the account has an appropriate `role_id` assigned in the `users` table.

## 🔐 Security Notes

- Passwords are hashed with bcrypt before storage.
- JWTs carry the user's `role_id`, verified on every protected request via the `requireAuth` / `requireRole` middleware.
- Accounts are automatically locked for 15 minutes after 5 consecutive failed login attempts, with all login attempts recorded in `login_history`.
- All sensitive administrative actions are written to `audit_logs`, visible only to System Administrators.

> ⚠️ Before deploying to production, replace `JWT_SECRET` with a long, random value, restrict `CORS_ORIGIN` to your real frontend domain, and put the API behind HTTPS.

## 📌 Status

Actively developed. Core modules — authentication, patients, cases, postmortems, evidence, reports, police liaison, staff, notifications, and audit logging — are implemented end-to-end across frontend and backend.

## 👨‍💻 Authors

M.N. Aamir (E/22/036), M.K.H. Hafees (E/22/036), M.A.M. Assadh (E/22/034), M.A.A. Ayyash (E/22/035)
