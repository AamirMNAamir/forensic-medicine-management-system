import './PatientAdd.css';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PatientForm from '../components/PatientForm';
import api from '../api/client';

export default function PatientAdd() {
  const navigate = useNavigate();

  async function handleSubmit(form) {
    const res = await api.post('/patients', form);
    navigate(`/patients/${res.data.patient_id}?created=1`);
  }

  return (
    <Layout title="Register Patient" breadcrumb="Patients / New">
      <div className="card" style={{ maxWidth: 900 }}>
        <div className="card-header"><h3>Register New Patient / Deceased</h3></div>
        <div className="card-body">
          <PatientForm onSubmit={handleSubmit} submitLabel="Save Patient" />
        </div>
      </div>
    </Layout>
  );
}
