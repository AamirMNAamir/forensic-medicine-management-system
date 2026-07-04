const ROLES = Object.freeze({
  ADMIN: 1,
  CONSULTANT_JMO: 2,
  MEDICAL_OFFICER: 3,
  LABORATORY_OFFICER: 4,
  CLERICAL_OFFICER: 5,
  COURT_LIAISON_OFFICER: 6,
  RESEARCH_OFFICER: 7,
  DATA_ENTRY_OPERATOR: 8,
});

const ROLE_RECORDS = Object.freeze([
  {
    role_id: ROLES.ADMIN,
    role_name: 'System Administrator',
    description: 'Full system control, user management, audit logs, and security settings',
  },
  {
    role_id: ROLES.CONSULTANT_JMO,
    role_name: 'Consultant JMO',
    description: 'Forensic examinations, postmortems, and approving forensic reports',
  },
  {
    role_id: ROLES.MEDICAL_OFFICER,
    role_name: 'Medical Officer',
    description: 'Assist with examinations, draft postmortem records, and request lab tests',
  },
  {
    role_id: ROLES.LABORATORY_OFFICER,
    role_name: 'Laboratory Officer',
    description: 'Manage lab test requests, record test results, and upload reports',
  },
  {
    role_id: ROLES.CLERICAL_OFFICER,
    role_name: 'Clerical Officer',
    description: 'Patient registration, police requests, scheduling, and administrative documents',
  },
  {
    role_id: ROLES.COURT_LIAISON_OFFICER,
    role_name: 'Court Liaison Officer',
    description: 'Create court records, upload summons, and track hearing schedules',
  },
  {
    role_id: ROLES.RESEARCH_OFFICER,
    role_name: 'Research Officer',
    description: 'Access anonymized forensic data for statistical analysis and academic research',
  },
  {
    role_id: ROLES.DATA_ENTRY_OPERATOR,
    role_name: 'Data Entry Operator',
    description: 'Digitize paper records, patient registration, and document uploads',
  },
]);

const PERMISSIONS = Object.freeze({
  DASHBOARD: Object.values(ROLES),
  PATIENT_READ: [
    ROLES.ADMIN,
    ROLES.CONSULTANT_JMO,
    ROLES.MEDICAL_OFFICER,
    ROLES.CLERICAL_OFFICER,
    ROLES.RESEARCH_OFFICER,
    ROLES.DATA_ENTRY_OPERATOR,
  ],
  PATIENT_CREATE: [
    ROLES.ADMIN,
    ROLES.CONSULTANT_JMO,
    ROLES.MEDICAL_OFFICER,
    ROLES.CLERICAL_OFFICER,
    ROLES.DATA_ENTRY_OPERATOR,
  ],
  PATIENT_UPDATE: [
    ROLES.ADMIN,
    ROLES.CONSULTANT_JMO,
    ROLES.CLERICAL_OFFICER,
    ROLES.DATA_ENTRY_OPERATOR,
  ],
  CASE_READ: Object.values(ROLES),
  CASE_CREATE: [
    ROLES.ADMIN,
    ROLES.CONSULTANT_JMO,
    ROLES.MEDICAL_OFFICER,
    ROLES.DATA_ENTRY_OPERATOR,
  ],
  CASE_STATUS_UPDATE: [ROLES.ADMIN, ROLES.CONSULTANT_JMO],
  POSTMORTEM_READ: [ROLES.ADMIN, ROLES.CONSULTANT_JMO, ROLES.MEDICAL_OFFICER],
  POSTMORTEM_WRITE: [ROLES.ADMIN, ROLES.CONSULTANT_JMO, ROLES.MEDICAL_OFFICER],
  POSTMORTEM_ISSUE: [ROLES.ADMIN, ROLES.CONSULTANT_JMO],
  EVIDENCE_READ: [
    ROLES.ADMIN,
    ROLES.CONSULTANT_JMO,
    ROLES.MEDICAL_OFFICER,
    ROLES.LABORATORY_OFFICER,
  ],
  EVIDENCE_WRITE: [ROLES.ADMIN, ROLES.CONSULTANT_JMO, ROLES.MEDICAL_OFFICER],
  REPORT_READ: [
    ROLES.ADMIN,
    ROLES.CONSULTANT_JMO,
    ROLES.MEDICAL_OFFICER,
    ROLES.CLERICAL_OFFICER,
  ],
  REPORT_CREATE: [ROLES.ADMIN, ROLES.CONSULTANT_JMO, ROLES.MEDICAL_OFFICER],
  REPORT_APPROVE: [ROLES.ADMIN, ROLES.CONSULTANT_JMO],
  STAFF_READ: [ROLES.ADMIN, ROLES.CONSULTANT_JMO, ROLES.MEDICAL_OFFICER],
  STAFF_WRITE: [ROLES.ADMIN],
  POLICE_READ: [
    ROLES.ADMIN,
    ROLES.CONSULTANT_JMO,
    ROLES.MEDICAL_OFFICER,
    ROLES.CLERICAL_OFFICER,
    ROLES.COURT_LIAISON_OFFICER,
  ],
  POLICE_WRITE: [ROLES.ADMIN, ROLES.CLERICAL_OFFICER, ROLES.COURT_LIAISON_OFFICER],
  AUDIT_READ: [ROLES.ADMIN],
  USER_MANAGE: [ROLES.ADMIN],
});

module.exports = { ROLES, ROLE_RECORDS, PERMISSIONS };
