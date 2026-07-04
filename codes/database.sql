-- ============================================================
-- FORENSIC MEDICINE DEPARTMENT MANAGEMENT SYSTEM (FMDMS)
-- Database: MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS fmdms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fmdms;

-- ============================================================
-- USERS & AUTH
-- ============================================================
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role_id INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME,
    failed_attempts INT DEFAULT 0,
    lockout_until DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE login_history (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    status ENUM('success','failed') DEFAULT 'success',
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================================
-- STAFF / DOCTORS
-- ============================================================
CREATE TABLE staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    designation VARCHAR(100),
    specialization VARCHAR(100),
    slmc_reg_no VARCHAR(50),
    contact_no VARCHAR(20),
    email VARCHAR(100),
    is_active TINYINT(1) DEFAULT 1,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================================
-- POLICE
-- ============================================================
CREATE TABLE police_stations (
    station_id INT AUTO_INCREMENT PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    district VARCHAR(50),
    contact_no VARCHAR(20)
);

CREATE TABLE police_officers (
    officer_id INT AUTO_INCREMENT PRIMARY KEY,
    officer_name VARCHAR(100) NOT NULL,
    rank_designation VARCHAR(50),
    badge_no VARCHAR(30),
    station_id INT,
    contact_no VARCHAR(20),
    FOREIGN KEY (station_id) REFERENCES police_stations(station_id)
);

-- ============================================================
-- PATIENTS / DECEASED
-- ============================================================
CREATE TABLE patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    nic_passport VARCHAR(30),
    age INT,
    date_of_birth DATE,
    gender ENUM('Male','Female','Unknown') DEFAULT 'Unknown',
    address TEXT,
    contact_no VARCHAR(20),
    hospital_no VARCHAR(30),
    patient_type ENUM('Clinical','Deceased') DEFAULT 'Clinical',
    registered_date DATE DEFAULT (CURDATE()),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nic (nic_passport),
    INDEX idx_name (full_name)
);

-- ============================================================
-- COURTS
-- ============================================================
CREATE TABLE courts (
    court_id INT AUTO_INCREMENT PRIMARY KEY,
    court_name VARCHAR(100) NOT NULL,
    court_type ENUM('Magistrate','District','High','Other') DEFAULT 'Magistrate',
    location VARCHAR(100)
);

-- ============================================================
-- CASES (Medico-Legal Cases)
-- ============================================================
CREATE TABLE cases (
    case_id INT AUTO_INCREMENT PRIMARY KEY,
    case_ref_no VARCHAR(30) NOT NULL UNIQUE,
    case_type ENUM('Clinical','Postmortem') NOT NULL,
    incident_type VARCHAR(100),
    patient_id INT NOT NULL,
    mlef_no VARCHAR(30),
    police_ref_no VARCHAR(30),
    court_ref_no VARCHAR(30),
    court_id INT,
    station_id INT,
    officer_id INT,
    assigned_doctor_id INT,
    admission_date DATE,
    examination_date DATE,
    report_submission_date DATE,
    trial_date DATE,
    case_status ENUM('Open','Pending Report','Report Issued','Closed') DEFAULT 'Open',
    reason_for_referral TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (court_id) REFERENCES courts(court_id),
    FOREIGN KEY (station_id) REFERENCES police_stations(station_id),
    FOREIGN KEY (officer_id) REFERENCES police_officers(officer_id),
    FOREIGN KEY (assigned_doctor_id) REFERENCES staff(staff_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    INDEX idx_case_ref (case_ref_no),
    INDEX idx_status (case_status)
);

-- ============================================================
-- CLINICAL EXAMINATIONS (MLEF)
-- ============================================================
CREATE TABLE clinical_examinations (
    exam_id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    examining_doctor_id INT,
    examination_date DATE,
    examination_time TIME,
    place_of_examination VARCHAR(100),
    consent_obtained TINYINT(1) DEFAULT 0,
    nature_of_body_harm TEXT,
    causative_weapon VARCHAR(100),
    category_of_hurt ENUM('Non-grievous','Grievous','Fatal') DEFAULT 'Non-grievous',
    general_condition TEXT,
    injuries_description TEXT,
    alcohol_examination ENUM('Positive','Negative','Not Done') DEFAULT 'Not Done',
    drug_examination ENUM('Positive','Negative','Not Done') DEFAULT 'Not Done',
    sexual_assault_exam TINYINT(1) DEFAULT 0,
    hymen_findings TEXT,
    opinion_remarks TEXT,
    mlef_issued TINYINT(1) DEFAULT 0,
    mlef_issued_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(case_id),
    FOREIGN KEY (examining_doctor_id) REFERENCES staff(staff_id)
);

-- ============================================================
-- POSTMORTEM (Autopsy)
-- ============================================================
CREATE TABLE postmortems (
    pm_id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    pm_serial_no VARCHAR(30),
    inquest_no VARCHAR(30),
    inquest_date DATE,
    pm_ordered_by VARCHAR(100),
    place_of_pm VARCHAR(100),
    pm_date DATE,
    pm_time TIME,
    examining_doctor_id INT,
    place_of_death ENUM('At Scene','At Hospital on Admission','At Hospital During Admission','Unknown'),
    date_of_death DATE,
    time_of_death TIME,
    bht_no VARCHAR(30),
    ward_no VARCHAR(20),
    history_from_police TEXT,
    history_from_family TEXT,
    crime_scene_description TEXT,
    external_examination TEXT,
    internal_examination TEXT,
    cause_of_death_ia TEXT,
    cause_of_death_ib TEXT,
    cause_of_death_ic TEXT,
    cause_of_death_ii TEXT,
    manner_of_death ENUM('Natural','Accidental','Suicidal','Homicidal','Undetermined') DEFAULT 'Undetermined',
    specimens_retained TEXT,
    histology_sent TINYINT(1) DEFAULT 0,
    toxicology_sent TINYINT(1) DEFAULT 0,
    xray_ct_done TINYINT(1) DEFAULT 0,
    govt_analyst_report TINYINT(1) DEFAULT 0,
    pm_report_issued TINYINT(1) DEFAULT 0,
    pm_report_date DATE,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(case_id),
    FOREIGN KEY (examining_doctor_id) REFERENCES staff(staff_id)
);

-- ============================================================
-- INVESTIGATIONS / REFERRALS
-- ============================================================
CREATE TABLE investigations (
    inv_id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    inv_type ENUM('X-Ray','CT Scan','Blood Test','Urine Test','Toxicology','Histology','Swab','Other'),
    description TEXT,
    result TEXT,
    done_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

CREATE TABLE referrals (
    ref_id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    referred_to VARCHAR(100),
    ref_type ENUM('Psychiatry','Paediatrics','Gynaecology','Other'),
    referral_date DATE,
    outcome TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- ============================================================
-- EVIDENCE
-- ============================================================
CREATE TABLE evidence (
    evidence_id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    evidence_type ENUM('Photograph','Document','X-Ray','Lab Sample','Swab','Clothing','Other'),
    description TEXT,
    storage_location VARCHAR(100),
    collected_date DATE,
    collected_by VARCHAR(100),
    chain_of_custody TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- ============================================================
-- REPORTS (MLR / PMR)
-- ============================================================
CREATE TABLE reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    report_type ENUM('MLR','PMR','Court Report') NOT NULL,
    serial_no VARCHAR(30),
    report_date DATE,
    prepared_by INT,
    findings TEXT,
    opinion TEXT,
    recommendations TEXT,
    court_id INT,
    report_status ENUM('Draft','Issued','Dispatched') DEFAULT 'Draft',
    dispatch_date DATE,
    receipt_acknowledged TINYINT(1) DEFAULT 0,
    receipt_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(case_id),
    FOREIGN KEY (prepared_by) REFERENCES staff(staff_id),
    FOREIGN KEY (court_id) REFERENCES courts(court_id)
);

-- ============================================================
-- ATTACHMENTS
-- ============================================================
CREATE TABLE attachments (
    attachment_id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_type ENUM('Photo','Document','X-Ray','Lab Report','Other'),
    uploaded_by INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(case_id),
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    notif_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    case_id INT,
    message TEXT,
    notif_type ENUM('Pending Report','Court Date','MLEF Pending','System') DEFAULT 'System',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50),
    table_name VARCHAR(50),
    record_id INT,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'System Administrator', 'Full system control, user management, audit logs, and security settings'),
(2, 'Consultant JMO', 'Forensic examinations, postmortems, and approving forensic reports'),
(3, 'Medical Officer', 'Assist with examinations, draft postmortem records, and request lab tests'),
(4, 'Laboratory Officer', 'Manage lab test requests, record test results, and upload reports'),
(5, 'Clerical Officer', 'Patient registration, police requests, scheduling, and administrative documents'),
(6, 'Court Liaison Officer', 'Create court records, upload summons, and track hearing schedules'),
(7, 'Research Officer', 'Access anonymized forensic data for statistical analysis and academic research'),
(8, 'Data Entry Operator', 'Digitize paper records, patient registration, and document uploads');

-- Default password for all seeded users below is: admin123
-- (hash generated with bcrypt, 10 rounds)
INSERT INTO users (user_id, username, password_hash, full_name, email, role_id) VALUES
(1, 'admin', '$2a$10$wPqshF/qkLY6bJYKGYZzl.qVe54zBuFp2NDWXmetZ5S6MxdtET/A.', 'System Administrator', 'admin@fmdms.lk', 1),
(2, 'jmo1', '$2a$10$wPqshF/qkLY6bJYKGYZzl.qVe54zBuFp2NDWXmetZ5S6MxdtET/A.', 'Dr. Chathula Wickramasinghe', 'jmo1@fmdms.lk', 2),
(3, 'doctor1', '$2a$10$wPqshF/qkLY6bJYKGYZzl.qVe54zBuFp2NDWXmetZ5S6MxdtET/A.', 'Dr. Amal Silva', 'doctor1@fmdms.lk', 3),
(4, 'lab1', '$2a$10$wPqshF/qkLY6bJYKGYZzl.qVe54zBuFp2NDWXmetZ5S6MxdtET/A.', 'Mr. Samantha Perera', 'lab1@fmdms.lk', 4),
(5, 'clerk1', '$2a$10$wPqshF/qkLY6bJYKGYZzl.qVe54zBuFp2NDWXmetZ5S6MxdtET/A.', 'Mrs. Priyanthi Fernando', 'clerk1@fmdms.lk', 5),
(6, 'court1', '$2a$10$wPqshF/qkLY6bJYKGYZzl.qVe54zBuFp2NDWXmetZ5S6MxdtET/A.', 'Mr. Nihal Ranasinghe', 'court1@fmdms.lk', 6),
(7, 'research1', '$2a$10$wPqshF/qkLY6bJYKGYZzl.qVe54zBuFp2NDWXmetZ5S6MxdtET/A.', 'Prof. Rohan Senanayake', 'research1@fmdms.lk', 7),
(8, 'operator1', '$2a$10$wPqshF/qkLY6bJYKGYZzl.qVe54zBuFp2NDWXmetZ5S6MxdtET/A.', 'Ms. Dilini Cooray', 'operator1@fmdms.lk', 8),
(9, 'dataentry1', '$2a$10$wPqshF/qkLY6bJYKGYZzl.qVe54zBuFp2NDWXmetZ5S6MxdtET/A.', 'Ms. Nadeesha Jayawardena', 'dataentry1@fmdms.lk', 8);

INSERT INTO staff (full_name, designation, specialization, slmc_reg_no, contact_no, email, user_id) VALUES
('Dr. Chathula Wickramasinghe', 'Consultant JMO', 'Forensic Pathology', 'SLMC-12345', '0711234567', 'jmo1@fmdms.lk', 2),
('Dr. Amal Silva', 'Medical Officer', 'Forensic Medicine', 'SLMC-67890', '0777654321', 'doctor1@fmdms.lk', 3),
('Mr. Samantha Perera', 'Laboratory Officer', 'Toxicology & DNA', 'LAB-10022', '0751234567', 'lab1@fmdms.lk', 4),
('Mrs. Priyanthi Fernando', 'Clerical Officer', 'Administration', 'CLERK-5544', '0722345678', 'clerk1@fmdms.lk', 5);

INSERT INTO police_stations (station_name, district, contact_no) VALUES
('Kandy Police Station', 'Kandy', '0812234567'),
('Peradeniya Police Station', 'Kandy', '0812345678'),
('Mahiyangana Police Station', 'Badulla', '0552234567');

INSERT INTO courts (court_name, court_type, location) VALUES
('Kandy Magistrate Court', 'Magistrate', 'Kandy'),
('Kandy District Court', 'District', 'Kandy'),
('Kandy High Court', 'High', 'Kandy');

INSERT INTO patients (full_name, nic_passport, age, gender, address, contact_no, hospital_no, patient_type) VALUES
('John Perera', '198512345678', 40, 'Male', 'No. 5, Kandy Road, Peradeniya', '0712345678', 'THK/2024/001', 'Clinical'),
('Mary Silva', '199023456789', 35, 'Female', 'No. 12, Hospital Road, Kandy', '0723456789', 'THK/2024/002', 'Clinical'),
('Unknown Deceased', NULL, 65, 'Male', 'Found at: Kandy-Colombo Road', NULL, NULL, 'Deceased');
