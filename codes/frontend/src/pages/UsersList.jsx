import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../api/client';
import { Loading, StatusBadge, fmtDate } from '../components/UI';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [editMode, setEditMode] = useState(false); // false = list/create, true = edit
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role_id: '',
    is_active: 1
  });

  const [resetPwForm, setResetPwForm] = useState({
    user_id: null,
    username: '',
    newPassword: '',
    show: false
  });

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState(null); // { user_id, username } | null
  const [deleting, setDeleting] = useState(false);

  function loadUsers() {
    setLoading(true);
    api.get('/users')
      .then((res) => setUsers(res.data))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
    // Load roles for dropdowns
    api.get('/auth/roles')
      .then((res) => {
        setRoles(res.data);
        if (res.data.length > 0) {
          setFormData((f) => ({ ...f, role_id: res.data[0].role_id.toString() }));
        }
      })
      .catch(() => setError('Failed to load system roles.'));
  }, []);

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((f) => ({
      ...f,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editMode) {
        // Edit User
        await api.put(`/users/${selectedUser.user_id}`, {
          full_name: formData.full_name,
          email: formData.email,
          role_id: parseInt(formData.role_id),
          is_active: formData.is_active
        });
        setSuccess('User updated successfully.');
        setEditMode(false);
        setSelectedUser(null);
      } else {
        // Create User
        await api.post('/users', {
          username: formData.username,
          password: formData.password,
          full_name: formData.full_name,
          email: formData.email,
          role_id: parseInt(formData.role_id)
        });
        setSuccess('User created successfully.');
      }

      // Reset form
      setFormData({
        username: '',
        password: '',
        full_name: '',
        email: '',
        role_id: roles.length > 0 ? roles[0].role_id.toString() : '',
        is_active: 1
      });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed.');
    }
  }

  function handleEditClick(user) {
    setError('');
    setSuccess('');
    setEditMode(true);
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '', // Password cannot be edited here
      full_name: user.full_name,
      email: user.email || '',
      role_id: user.role_id.toString(),
      is_active: user.is_active
    });
  }

  function handleCancelEdit() {
    setEditMode(false);
    setSelectedUser(null);
    setFormData({
      username: '',
      password: '',
      full_name: '',
      email: '',
      role_id: roles.length > 0 ? roles[0].role_id.toString() : '',
      is_active: 1
    });
  }

  // Opens the confirm dialog instead of window.confirm
  function handleDeleteClick(userId, username) {
    setError('');
    setSuccess('');
    setDeleteTarget({ user_id: userId, username });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { user_id, username } = deleteTarget;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/users/${user_id}`);
      setSuccess(`User "${username}" deleted.`);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  function cancelDelete() {
    setDeleteTarget(null);
  }

  function handlePasswordResetClick(user) {
    setResetPwForm({
      user_id: user.user_id,
      username: user.username,
      newPassword: '',
      show: true
    });
  }

  async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (resetPwForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      await api.post(`/users/${resetPwForm.user_id}/reset-password`, {
        password: resetPwForm.newPassword
      });
      setSuccess(`Password for "${resetPwForm.username}" has been reset.`);
      setResetPwForm({ user_id: null, username: '', newPassword: '', show: false });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    }
  }

  return (
    <Layout title="User Management" breadcrumb="System / Users">
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message={
          deleteTarget
            ? `Are you sure you want to delete user "${deleteTarget.username}"? This action cannot be undone.`
            : ''
        }
        confirmLabel={deleting ? 'Deleting...' : 'Delete User'}
        danger
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid-2">
        {/* Left Side: Users List */}
        <div className="card">
          <div className="card-header">
            <h3>System Accounts</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <Loading />
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>User Info</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.user_id}>
                        <td>
                          <strong>{u.full_name}</strong><br />
                          <span className="text-sm text-muted">@{u.username}</span><br />
                          <span className="text-sm text-muted">{u.email || 'No Email'}</span>
                        </td>
                        <td>
                          <span className="badge badge-clinical" style={{ fontSize: 11 }}>
                            {u.role_name}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.is_active ? 'badge-issued' : 'badge-closed'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleEditClick(u)}
                              className="btn btn-sm btn-outline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handlePasswordResetClick(u)}
                              className="btn btn-sm btn-secondary"
                              style={{ padding: '0.2rem 0.5rem', fontSize: 11 }}
                            >
                              Reset PW
                            </button>
                            <button
                              onClick={() => handleDeleteClick(u.user_id, u.username)}
                              className="btn btn-sm btn-outline"
                              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Create/Edit Form and Reset Password Modal */}
        <div>
          {resetPwForm.show ? (
            <div className="card mb-2" style={{ border: '2px solid var(--secondary)' }}>
              <div className="card-header" style={{ background: '#e3f0fb' }}>
                <h3>Reset Password for @{resetPwForm.username}</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleResetPasswordSubmit}>
                  <div className="form-group mb-2">
                    <label htmlFor="new_password">New Password *</label>
                    <input
                      id="new_password"
                      type="password"
                      required
                      minLength={6}
                      value={resetPwForm.newPassword}
                      onChange={(e) => setResetPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-1">
                    <button type="submit" className="btn btn-secondary">
                      Reset Password
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setResetPwForm({ user_id: null, username: '', newPassword: '', show: false })}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}

          <div className="card">
            <div className="card-header">
              <h3>{editMode ? `Edit User: @${formData.username}` : 'Create New Account'}</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-1">
                  <label htmlFor="full_name">Full Name *</label>
                  <input
                    id="full_name"
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group mb-1">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                {!editMode && (
                  <>
                    <div className="form-group mb-1">
                      <label htmlFor="username">Username *</label>
                      <input
                        id="username"
                        type="text"
                        name="username"
                        required
                        value={formData.username}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group mb-1">
                      <label htmlFor="password">Password *</label>
                      <input
                        id="password"
                        type="password"
                        name="password"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                    </div>
                  </>
                )}

                <div className="form-group mb-2">
                  <label htmlFor="role_id">Role / Assignment *</label>
                  <select
                    id="role_id"
                    name="role_id"
                    required
                    value={formData.role_id}
                    onChange={handleInputChange}
                  >
                    {roles.map((r) => (
                      <option key={r.role_id} value={r.role_id}>
                        {r.role_name}
                      </option>
                    ))}
                  </select>
                </div>

                {editMode && (
                  <div className="form-group mb-2" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active === 1}
                      onChange={(e) => setFormData((f) => ({ ...f, is_active: e.target.checked ? 1 : 0 }))}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                    <label htmlFor="is_active" style={{ textTransform: 'none', cursor: 'pointer', margin: 0 }}>
                      Account Active
                    </label>
                  </div>
                )}

                <div className="flex gap-1 mt-2">
                  <button type="submit" className="btn btn-primary">
                    {editMode ? 'Save Changes' : 'Register User'}
                  </button>
                  {editMode && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
