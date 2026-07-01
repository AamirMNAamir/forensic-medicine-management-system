import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Signup from './pages/Signup';
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

function Protected({ children, roles }) {
  return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />

          <Route path="/patients" element={<Protected><PatientsList /></Protected>} />
          <Route path="/patients/new" element={<Protected><PatientAdd /></Protected>} />
          <Route path="/patients/:id" element={<Protected><PatientView /></Protected>} />
          <Route path="/patients/:id/edit" element={<Protected><PatientEdit /></Protected>} />

          <Route path="/cases" element={<Protected><CasesList /></Protected>} />
          <Route path="/cases/new" element={<Protected><CaseAdd /></Protected>} />
          <Route path="/cases/:id" element={<Protected><CaseView /></Protected>} />

          <Route path="/postmortems" element={<Protected><PostmortemList /></Protected>} />
          <Route path="/postmortems/new" element={<Protected><PostmortemAdd /></Protected>} />
          <Route path="/postmortems/:id" element={<Protected><PostmortemView /></Protected>} />

          <Route path="/evidence" element={<Protected><EvidenceList /></Protected>} />
          <Route path="/evidence/new" element={<Protected><EvidenceAdd /></Protected>} />

          <Route path="/reports" element={<Protected><ReportsList /></Protected>} />
          <Route path="/reports/new" element={<Protected><ReportAdd /></Protected>} />
          <Route path="/reports/:id" element={<Protected><ReportView /></Protected>} />

          <Route path="/staff" element={<Protected><StaffList /></Protected>} />
          <Route path="/police" element={<Protected><PolicePage /></Protected>} />
          <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
          <Route path="/audit-log" element={<Protected roles={[1, 2]}><AuditLog /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
