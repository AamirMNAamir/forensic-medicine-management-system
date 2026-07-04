import './PatientView.css';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { Loading, StatusBadge, TypeBadge, fmtDate } from '../components/UI';

export default function PatientView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/patients/${id}`)
      .then((res) => setPatient(res.data))
      .catch(() => setError('Patient not found.'));
  }, [id]);

  if (error) {
    return (
      <Layout title="Patient Profile">
        <div className="alert alert-danger">{error}</div>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout title="Patient Profile">
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout title="Patient Profile" breadcrumb="Patients / View">
      {searchParams.get('created') && <div className="alert alert-success">Patient registered successfully.</div>}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>{patient.full_name}</h3>
            <Link to={`/patients/${id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
          </div>
          <div className="card-body">
            <table>
              <tbody>
                <tr><td className="text-muted">Patient ID</td><td>#{patient.patient_id}</td></tr>
                <tr><td className="text-muted">NIC / Passport</td><td>{patient.nic_passport || '—'}</td></tr>
                <tr><td className="text-muted">Age</td><td>{patient.age || '—'}</td></tr>
                <tr><td className="text-muted">Gender</td><td>{patient.gender}</td></tr>
                <tr><td className="text-muted">Contact</td><td>{patient.contact_no || '—'}</td></tr>
                <tr><td className="text-muted">Address</td><td>{patient.address || '—'}</td></tr>
                <tr><td className="text-muted">Hospital No</td><td>{patient.hospital_no || '—'}</td></tr>
                <tr><td className="text-muted">Type</td><td><TypeBadge type={patient.patient_type === 'Deceased' ? 'Postmortem' : 'Clinical'} /></td></tr>
                <tr><td className="text-muted">Registered</td><td>{fmtDate(patient.registered_date)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Associated Cases ({patient.cases.length})</h3>
            <Link to={`/cases/new?patient_id=${id}`} className="btn btn-sm btn-primary">+ New Case</Link>
          </div>
          <div className="card-body">
            {patient.cases.length === 0 && <p className="text-muted text-sm">No cases linked to this patient yet.</p>}
            {patient.cases.length > 0 && (
              <table>
                <thead><tr><th>Case Ref</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  {patient.cases.map((c) => (
                    <tr key={c.case_id}>
                      <td><Link to={`/cases/${c.case_id}`}>{c.case_ref_no}</Link></td>
                      <td>{c.case_type}</td>
                      <td><StatusBadge status={c.case_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <Link to="/patients" className="btn btn-outline">&larr; Back to Patients</Link>
      </div>
    </Layout>
  );
}
