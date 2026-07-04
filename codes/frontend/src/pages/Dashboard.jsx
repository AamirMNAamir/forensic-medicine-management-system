import './Dashboard.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { Loading, StatusBadge, TypeBadge, fmtDate } from '../components/UI';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Failed to load dashboard data.'));
  }, []);

  if (error) {
    return (
      <Layout title="Dashboard">
        <div className="alert alert-danger">{error}</div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout title="Dashboard">
        <Loading />
      </Layout>
    );
  }

  const roleId = stats.role_id;

  return (
    <Layout title={`${stats.role_name || 'User'} Dashboard`}>
      {/* --------------------------------------------------------
          ROLE 1: System Administrator
          -------------------------------------------------------- */}
      {roleId === 1 && (
        <>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">&#128100;</div>
              <div className="stat-value">{stats.stats.totalPatients}</div>
              <div className="stat-label">Total Patients</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">&#128193;</div>
              <div className="stat-value">{stats.stats.totalCases}</div>
              <div className="stat-label">Total Cases</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-icon">&#9203;</div>
              <div className="stat-value">{stats.stats.pendingReports}</div>
              <div className="stat-label">Pending Reports</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon">&#9877;</div>
              <div className="stat-value">{stats.stats.totalPM}</div>
              <div className="stat-label">Postmortems</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon">&#128101;</div>
              <div className="stat-value">{stats.stats.totalUsers}</div>
              <div className="stat-label">System Users</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <h3>Recent Cases</h3>
                <Link to="/cases" className="btn btn-outline btn-sm">View All</Link>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Case Ref</th><th>Patient</th><th>Type</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {stats.recentCases.length === 0 && (
                      <tr><td colSpan={4} className="text-muted text-center">No cases recorded.</td></tr>
                    )}
                    {stats.recentCases.map((c) => (
                      <tr key={c.case_id}>
                        <td><Link to={`/cases/${c.case_id}`}>{c.case_ref_no}</Link></td>
                        <td>{c.patient_name}</td>
                        <td><TypeBadge type={c.case_type} /></td>
                        <td><StatusBadge status={c.case_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Recent Audit Logs</h3>
                <Link to="/audit-log" className="btn btn-outline btn-sm">View Logs</Link>
              </div>
              <div className="card-body">
                {stats.recentAuditLogs.length === 0 && (
                  <p className="text-muted text-sm">No activity logged.</p>
                )}
                {stats.recentAuditLogs.map((log) => (
                  <div key={log.log_id} className="mb-1 pb-1" style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <div className="flex justify-between text-sm">
                      <strong>{log.username}</strong>
                      <span className="text-muted">{fmtDate(log.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 13, margin: '2px 0 0' }}>
                      <span className="badge badge-open" style={{ marginRight: '6px', padding: '1px 5px' }}>{log.action}</span>
                      {log.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* --------------------------------------------------------
          ROLE 2: Consultant JMO
          -------------------------------------------------------- */}
      {roleId === 2 && (
        <>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">&#128193;</div>
              <div className="stat-value">{stats.stats.assignedCasesCount}</div>
              <div className="stat-label">Assigned Cases</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon">&#9877;</div>
              <div className="stat-value">{stats.stats.pendingPostmortemsCount}</div>
              <div className="stat-label">Pending PM Reports</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-icon">&#128196;</div>
              <div className="stat-value">{stats.stats.pendingApprovalsCount}</div>
              <div className="stat-label">Draft Reports (Approvals)</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">&#128100;</div>
              <div className="stat-value">{stats.stats.upcomingHearingsCount}</div>
              <div className="stat-label">Court Hearings</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <h3>My Assigned Cases</h3>
                <Link to="/cases" className="btn btn-outline btn-sm">View All</Link>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Case Ref</th><th>Patient</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {stats.recentCases.length === 0 && (
                      <tr><td colSpan={3} className="text-muted text-center">No cases assigned to you.</td></tr>
                    )}
                    {stats.recentCases.map((c) => (
                      <tr key={c.case_id}>
                        <td><Link to={`/cases/${c.case_id}`}>{c.case_ref_no}</Link></td>
                        <td>{c.patient_name}</td>
                        <td><StatusBadge status={c.case_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Upcoming Court Schedule</h3></div>
              <div className="card-body">
                {stats.upcomingTrials.length === 0 && (
                  <p className="text-muted text-sm">No upcoming trials scheduled.</p>
                )}
                {stats.upcomingTrials.map((t) => (
                  <div key={t.case_id} className="flex justify-between items-center mb-1 pb-1" style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                      <Link to={`/cases/${t.case_id}`} style={{ fontWeight: 700 }}>{t.case_ref_no}</Link><br />
                      <span className="text-sm text-muted">Trial Date: {fmtDate(t.trial_date)}</span>
                    </div>
                    <span className="badge badge-pending">Summoned</span>
                  </div>
                ))}

                <div className="mt-3">
                  <h4 style={{ fontSize: 13, color: 'var(--primary)', marginBottom: '.6rem' }}>JMO Actions</h4>
                  <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                    <Link to="/patients/new" className="btn btn-sm btn-primary">+ Register Patient</Link>
                    <Link to="/cases/new" className="btn btn-sm btn-secondary">+ New Case</Link>
                    <Link to="/postmortems/new" className="btn btn-sm btn-outline">+ Conduct Postmortem</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --------------------------------------------------------
          ROLE 3: Medical Officer
          -------------------------------------------------------- */}
      {roleId === 3 && (
        <>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">&#128193;</div>
              <div className="stat-value">{stats.stats.assignedExaminationsCount}</div>
              <div className="stat-label">Assigned Examinations</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon">&#9203;</div>
              <div className="stat-value">{stats.stats.pendingLabRequestsCount}</div>
              <div className="stat-label">Pending Lab Requests</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-icon">&#128196;</div>
              <div className="stat-value">{stats.stats.draftReportsCount}</div>
              <div className="stat-label">Draft Reports</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <h3>Assigned Cases</h3>
                <Link to="/cases" className="btn btn-outline btn-sm">View All</Link>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Case Ref</th><th>Patient</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {stats.recentCases.length === 0 && (
                      <tr><td colSpan={3} className="text-muted text-center">No cases assigned.</td></tr>
                    )}
                    {stats.recentCases.map((c) => (
                      <tr key={c.case_id}>
                        <td><Link to={`/cases/${c.case_id}`}>{c.case_ref_no}</Link></td>
                        <td>{c.patient_name}</td>
                        <td><StatusBadge status={c.case_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Pending Investigations</h3></div>
              <div className="card-body">
                {stats.pendingLabRequests.length === 0 && (
                  <p className="text-muted text-sm">No pending laboratory requests.</p>
                )}
                {stats.pendingLabRequests.map((req) => (
                  <div key={req.inv_id} className="mb-1 pb-1" style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <div className="flex justify-between">
                      <Link to={`/cases/${req.case_id}`} style={{ fontWeight: 700 }}>{req.case_ref_no}</Link>
                      <span className="badge badge-pending">{req.inv_type}</span>
                    </div>
                    <p className="text-sm text-muted" style={{ margin: '2px 0 0' }}>{req.description}</p>
                  </div>
                ))}

                <div className="mt-3">
                  <h4 style={{ fontSize: 13, color: 'var(--primary)', marginBottom: '.6rem' }}>Quick Actions</h4>
                  <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                    <Link to="/patients/new" className="btn btn-sm btn-primary">+ Register Patient</Link>
                    <Link to="/cases/new" className="btn btn-sm btn-secondary">+ New Case</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --------------------------------------------------------
          ROLE 4: Laboratory Officer
          -------------------------------------------------------- */}
      {roleId === 4 && (
        <>
          <div className="stats-grid">
            <div className="stat-card red">
              <div className="stat-icon">&#9203;</div>
              <div className="stat-value">{stats.stats.pendingTestsCount}</div>
              <div className="stat-label">Pending Lab Tests</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">&#10003;</div>
              <div className="stat-value">{stats.stats.completedTestsCount}</div>
              <div className="stat-label">Completed Tests</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header"><h3>Pending Lab Requests</h3></div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Case Ref</th><th>Patient</th><th>Test Type</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    {stats.recentLabRequests.length === 0 && (
                      <tr><td colSpan={4} className="text-muted text-center">No pending tests.</td></tr>
                    )}
                    {stats.recentLabRequests.map((req) => (
                      <tr key={req.inv_id}>
                        <td><Link to={`/cases/${req.case_id}`}>{req.case_ref_no}</Link></td>
                        <td>{req.patient_name}</td>
                        <td><span className="badge badge-pending">{req.inv_type}</span></td>
                        <td>{req.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Recently Completed Tests</h3></div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Case Ref</th><th>Patient</th><th>Test Type</th><th>Result</th></tr>
                  </thead>
                  <tbody>
                    {stats.completedLabTests.length === 0 && (
                      <tr><td colSpan={4} className="text-muted text-center">No tests completed yet.</td></tr>
                    )}
                    {stats.completedLabTests.map((req) => (
                      <tr key={req.inv_id}>
                        <td><Link to={`/cases/${req.case_id}`}>{req.case_ref_no}</Link></td>
                        <td>{req.patient_name}</td>
                        <td><span className="badge badge-issued">{req.inv_type}</span></td>
                        <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --------------------------------------------------------
          ROLE 5: Clerical Officer
          -------------------------------------------------------- */}
      {roleId === 5 && (
        <>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">&#128100;</div>
              <div className="stat-value">{stats.stats.registrationsToday}</div>
              <div className="stat-label">Registered Today</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">&#128737;</div>
              <div className="stat-value">{stats.stats.policeRequestsCount}</div>
              <div className="stat-label">Linked Police Requests</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-icon">&#128197;</div>
              <div className="stat-value">{stats.stats.totalAppointments}</div>
              <div className="stat-label">Scheduled Admissions</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <h3>Recent Patient Registrations</h3>
                <Link to="/patients" className="btn btn-outline btn-sm">View All</Link>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Name</th><th>NIC/Passport</th><th>Gender</th><th>Registered Date</th></tr>
                  </thead>
                  <tbody>
                    {stats.recentPatients.length === 0 && (
                      <tr><td colSpan={4} className="text-muted text-center">No patients registered today.</td></tr>
                    )}
                    {stats.recentPatients.map((p) => (
                      <tr key={p.patient_id}>
                        <td><Link to={`/patients/${p.patient_id}`}>{p.full_name}</Link></td>
                        <td>{p.nic_passport || 'N/A'}</td>
                        <td>{p.gender}</td>
                        <td>{fmtDate(p.registered_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Clerical Actions</h3></div>
              <div className="card-body">
                <p className="text-muted text-sm mb-2">Register patients, manage bookings, and upload forms.</p>
                <div className="flex gap-1" style={{ flexDirection: 'column' }}>
                  <Link to="/patients/new" className="btn btn-primary" style={{ justifyContent: 'center' }}>+ Register New Patient</Link>
                  <Link to="/cases/new" className="btn btn-secondary" style={{ justifyContent: 'center' }}>+ Open New Case File</Link>
                  <Link to="/police" className="btn btn-outline" style={{ justifyContent: 'center' }}>View Police Linkings</Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --------------------------------------------------------
          ROLE 6: Court Liaison Officer
          -------------------------------------------------------- */}
      {roleId === 6 && (
        <>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">&#128203;</div>
              <div className="stat-value">{stats.stats.totalHearings}</div>
              <div className="stat-label">Total Court Cases</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-icon">&#128276;</div>
              <div className="stat-value">{stats.stats.upcomingSummons}</div>
              <div className="stat-label">Upcoming Hearings</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">&#10003;</div>
              <div className="stat-value">{stats.stats.courtSubmissions}</div>
              <div className="stat-label">Reports Submitted</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header"><h3>Upcoming Court Schedule</h3></div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Case Ref</th><th>Patient (Deceased)</th><th>Court</th><th>Trial Date</th></tr>
                  </thead>
                  <tbody>
                    {stats.upcomingHearings.length === 0 && (
                      <tr><td colSpan={4} className="text-muted text-center">No trials scheduled.</td></tr>
                    )}
                    {stats.upcomingHearings.map((h) => (
                      <tr key={h.case_id}>
                        <td><Link to={`/cases/${h.case_id}`}>{h.case_ref_no}</Link></td>
                        <td>{h.patient_name}</td>
                        <td>{h.court_name || 'N/A'}</td>
                        <td><span className="badge badge-pending">{fmtDate(h.trial_date)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Liaison Actions</h3></div>
              <div className="card-body">
                <p className="text-muted text-sm mb-2">Manage court summons, report submittals, and schedule hearing calendar dates.</p>
                <div className="flex gap-1" style={{ flexDirection: 'column' }}>
                  <Link to="/police" className="btn btn-primary" style={{ justifyContent: 'center' }}>Manage Summons & Courts</Link>
                  <Link to="/cases" className="btn btn-secondary" style={{ justifyContent: 'center' }}>Track Case Trial Dates</Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --------------------------------------------------------
          ROLE 7: Research Officer (Anonymised Analytics)
          -------------------------------------------------------- */}
      {roleId === 7 && (
        <>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">&#128100;</div>
              <div className="stat-value">{stats.stats.totalPatients}</div>
              <div className="stat-label">Anonymized Patients</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">&#128193;</div>
              <div className="stat-value">{stats.stats.totalCases}</div>
              <div className="stat-label">Anonymized Cases</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon">&#9877;</div>
              <div className="stat-value">{stats.stats.totalPM}</div>
              <div className="stat-label">Postmortem Statistics</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header"><h3>Cases by Type & Status</h3></div>
              <div className="card-body">
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Case Types</h4>
                {stats.anonymousStats.casesByType.map((c) => (
                  <div key={c.case_type} className="mb-2">
                    <div className="flex justify-between mb-1">
                      <span>{c.case_type} Cases</span>
                      <strong>{c.count}</strong>
                    </div>
                    <div style={{ background: '#e9ecef', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                      <div style={{
                        background: c.case_type === 'Clinical' ? 'var(--secondary)' : 'var(--danger)',
                        height: '100%',
                        width: `${(c.count / (stats.stats.totalCases || 1)) * 100}%`
                      }}></div>
                    </div>
                  </div>
                ))}
                
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '1.5rem 0 .5rem' }}>Cases by Status</h4>
                {stats.anonymousStats.casesByStatus.map((c) => (
                  <div key={c.case_status} className="flex justify-between items-center mb-1" style={{ borderBottom: '1px solid #f9f9f9', paddingBottom: '3px' }}>
                    <span>{c.case_status}</span>
                    <span className="badge badge-open" style={{ minWidth: '35px', textAlign: 'center', justifyContent: 'center' }}>{c.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Demographics (Gender & Age)</h3></div>
              <div className="card-body">
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Patient Gender Distribution</h4>
                <div className="flex gap-2 mt-1 mb-2">
                  {stats.anonymousStats.patientsByGender.map((g) => (
                    <div key={g.gender} style={{ flex: 1, textAlign: 'center', background: '#f8fafc', padding: '.5rem', borderRadius: '6px' }}>
                      <span className="text-muted text-sm">{g.gender}</span><br />
                      <strong style={{ fontSize: 16 }}>{g.count}</strong>
                    </div>
                  ))}
                </div>

                <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '1.25rem' }}>Patient Age Groups</h4>
                <div className="mt-1">
                  {stats.anonymousStats.patientsByAgeGroup.map((a) => (
                    <div key={a.age_group} className="flex justify-between mb-1" style={{ fontSize: 13, borderBottom: '1px solid #f9f9f9', paddingBottom: '3px' }}>
                      <span>Age Group {a.age_group}</span>
                      <strong>{a.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --------------------------------------------------------
          ROLE 8: Data Entry Operator
          -------------------------------------------------------- */}
      {roleId === 8 && (
        <>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">&#128100;</div>
              <div className="stat-value">{stats.stats.registrationsToday}</div>
              <div className="stat-label">Registrations Today</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-icon">&#128193;</div>
              <div className="stat-value">{stats.stats.incompleteCases}</div>
              <div className="stat-label">Incomplete Cases (Missing Refs)</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <h3>Recently Registered Patients</h3>
                <Link to="/patients" className="btn btn-outline btn-sm">View All</Link>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Name</th><th>NIC/Passport</th><th>Gender</th><th>Registered Date</th></tr>
                  </thead>
                  <tbody>
                    {stats.recentRegistrations.length === 0 && (
                      <tr><td colSpan={4} className="text-muted text-center">No patients registered today.</td></tr>
                    )}
                    {stats.recentRegistrations.map((p) => (
                      <tr key={p.patient_id}>
                        <td><Link to={`/patients/${p.patient_id}`}>{p.full_name}</Link></td>
                        <td>{p.nic_passport || 'N/A'}</td>
                        <td>{p.gender}</td>
                        <td>{fmtDate(p.registered_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Digitization Actions</h3></div>
              <div className="card-body">
                <p className="text-muted text-sm mb-2">Register patients, key in case files, and scan administrative documents.</p>
                <div className="flex gap-1" style={{ flexDirection: 'column' }}>
                  <Link to="/patients/new" className="btn btn-primary" style={{ justifyContent: 'center' }}>+ Register New Patient</Link>
                  <Link to="/cases/new" className="btn btn-secondary" style={{ justifyContent: 'center' }}>+ Digitise New Case File</Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
