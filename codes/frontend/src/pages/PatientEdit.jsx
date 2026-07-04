import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import PatientForm from '../components/PatientForm';
import api from '../api/client';
import { Loading } from '../components/UI';

export default function PatientEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/patients/${id}`)
      .then((res) => setPatient(res.data))
      .catch(() => setError('Patient not found.'));
  }, [id]);

  async function handleSubmit(form) {
    await api.put(`/patients/${id}`, form);
    navigate(`/patients/${id}`);
  }

  if (error) {
    return (
      <Layout title="Edit Patient">
        <div className="alert alert-danger">{error}</div>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout title="Edit Patient">
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout title="Edit Patient" breadcrumb="Patients / Edit">
      <div className="card" style={{ maxWidth: 900 }}>
        <div className="card-header"><h3>Edit Patient — {patient.full_name}</h3></div>
        <div className="card-body">
          <PatientForm initial={patient} onSubmit={handleSubmit} submitLabel="Save Changes" />
        </div>
      </div>
    </Layout>
  );
}
