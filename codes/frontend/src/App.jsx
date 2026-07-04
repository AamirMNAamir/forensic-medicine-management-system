import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { PERMISSIONS } from './config/rbac';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import PatientsList from './pages/PatientsList';
import PatientAdd from './pages/PatientAdd';
import PatientView from './pages/PatientView';
import PatientEdit from './pages/PatientEdit';

import CasesList from './pages/CasesList';
import CaseAdd from './pages/CaseAdd';
import CaseView from './pages/CaseView';

import PostmortemList from './pages/PostmortemList';
import PostmortemAdd from './pages/PostmortemAdd';
import PostmortemView from './pages/PostmortemView';

import EvidenceList from './pages/EvidenceList';
import EvidenceAdd from './pages/EvidenceAdd';

import ReportsList from './pages/ReportsList';
import ReportAdd from './pages/ReportAdd';
import ReportView from './pages/ReportView';

import StaffList from './pages/StaffList';
import PolicePage from './pages/PolicePage';
import Notifications from './pages/Notifications';
import AuditLog from './pages/AuditLog';
import Profile from './pages/Profile';
import UsersList from './pages/UsersList';
import Register from './pages/Register';

function Protected({ children, roles }) {
  return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />

          <Route path="/patients" element={<Protected roles={PERMISSIONS.PATIENT_READ}><PatientsList /></Protected>} />
          <Route path="/patients/new" element={<Protected roles={PERMISSIONS.PATIENT_CREATE}><PatientAdd /></Protected>} />
          <Route path="/patients/:id" element={<Protected roles={PERMISSIONS.PATIENT_READ}><PatientView /></Protected>} />
          <Route path="/patients/:id/edit" element={<Protected roles={PERMISSIONS.PATIENT_UPDATE}><PatientEdit /></Protected>} />

          <Route path="/cases" element={<Protected roles={PERMISSIONS.CASE_READ}><CasesList /></Protected>} />
          <Route path="/cases/new" element={<Protected roles={PERMISSIONS.CASE_CREATE}><CaseAdd /></Protected>} />
          <Route path="/cases/:id" element={<Protected roles={PERMISSIONS.CASE_READ}><CaseView /></Protected>} />

          <Route path="/postmortems" element={<Protected roles={PERMISSIONS.POSTMORTEM_READ}><PostmortemList /></Protected>} />
          <Route path="/postmortems/new" element={<Protected roles={PERMISSIONS.POSTMORTEM_WRITE}><PostmortemAdd /></Protected>} />
          <Route path="/postmortems/:id" element={<Protected roles={PERMISSIONS.POSTMORTEM_READ}><PostmortemView /></Protected>} />

          <Route path="/evidence" element={<Protected roles={PERMISSIONS.EVIDENCE_READ}><EvidenceList /></Protected>} />
          <Route path="/evidence/new" element={<Protected roles={PERMISSIONS.EVIDENCE_WRITE}><EvidenceAdd /></Protected>} />

          <Route path="/reports" element={<Protected roles={PERMISSIONS.REPORT_READ}><ReportsList /></Protected>} />
          <Route path="/reports/new" element={<Protected roles={PERMISSIONS.REPORT_CREATE}><ReportAdd /></Protected>} />
          <Route path="/reports/:id" element={<Protected roles={PERMISSIONS.REPORT_READ}><ReportView /></Protected>} />

          <Route path="/staff" element={<Protected roles={PERMISSIONS.STAFF_READ}><StaffList /></Protected>} />
          <Route path="/police" element={<Protected roles={PERMISSIONS.POLICE_READ}><PolicePage /></Protected>} />
          <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
          <Route path="/audit-log" element={<Protected roles={PERMISSIONS.AUDIT_READ}><AuditLog /></Protected>} />
          <Route path="/users" element={<Protected roles={PERMISSIONS.USER_MANAGE}><UsersList /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
