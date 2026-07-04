import './PatientsList.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { Loading, Empty, TypeBadge, fmtDate } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../config/rbac';

export default function PatientsList() {
  const { hasPermission } = useAuth();
  const [patients, setPatients] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  function load(q) {
    api
      .get('/patients', { params: q ? { q } : {} })
      .then((res) => setPatients(res.data))
      .catch(() => setError('Failed to load patients.'));
  }

  useEffect(() => { load(''); }, []);

  function handleSearch(e) {
    e.preventDefault();
    load(search);
  }

  return (
    <Layout title="Patients">
      <div className="card">
        <div className="card-header">
          <h3>Patient / Deceased Records {patients ? `(${patients.length})` : ''}</h3>
          {hasPermission(PERMISSIONS.PATIENT_CREATE) && (
            <Link to="/patients/new" className="btn btn-primary btn-sm">+ Register Patient</Link>
          )}
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSearch} className="search-bar">
            <input
              type="text"
              placeholder="Search by name, NIC, or hospital no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-outline btn-sm" type="submit">Search</button>
            {search && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => { setSearch(''); load(''); }}
              >
                Clear
              </button>
            )}
          </form>

          {!patients && !error && <Loading />}
          {patients && patients.length === 0 && <Empty label="No patient records found." />}

          {patients && patients.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>NIC / Passport</th><th>Age</th><th>Gender</th>
                    <th>Type</th><th>Hospital No</th><th>Registered</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.patient_id}>
                      <td>#{p.patient_id}</td>
                      <td><Link to={`/patients/${p.patient_id}`}>{p.full_name}</Link></td>
                      <td>{p.nic_passport || '—'}</td>
                      <td>{p.age || '—'}</td>
                      <td>{p.gender}</td>
                      <td><TypeBadge type={p.patient_type === 'Deceased' ? 'Postmortem' : 'Clinical'} /></td>
                      <td>{p.hospital_no || '—'}</td>
                      <td>{fmtDate(p.registered_date)}</td>
                      <td>
                        <Link to={`/patients/${p.patient_id}`} className="btn btn-sm btn-outline">View</Link>{' '}
                        {hasPermission(PERMISSIONS.PATIENT_UPDATE) && (
                          <Link to={`/patients/${p.patient_id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
