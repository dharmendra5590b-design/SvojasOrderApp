import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ChangePasswordPage = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Current password required';
    if (form.newPassword.length < 6) e.newPassword = 'Minimum 6 characters';
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
     const {data}= await api.post('http://localhost:8081/api/Login/changepassword', {
        password: form.currentPassword,
        newPassword: form.newPassword,
        userID:user.entity_ID
      });
      if(data.statusCode==1)
      {
      toast.success('Password changed successfully!');
      updateUser({ isFirstLogin: false });
      const routes = { ADMIN: '/admin/dashboard', ADMINUSER: '/adminuser/dashboard', CUSTOMER: '/customer/orders', DESGINER: '/designer/orders', OPERATOR: '/admin/ledger' };
      navigate(routes[user?.user_Type] || '/');
      }
      else
      {
         toast.error(data?.message || 'Failed to change password');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="text-center mb-4">
          <div style={{ fontSize: 48 }}>🔐</div>
          <h4 className="fw-bold">Change Password</h4>
          {user?.isFirstLogin && (
            <div className="alert alert-warning py-2 small">Please change your default password to continue</div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
            <div className="mb-3" key={field}>
              <label className="form-label fw-semibold">
                {['Current Password', 'New Password', 'Confirm New Password'][i]}
              </label>
              <input
                type="password"
                className={`form-control ${errors[field] ? 'is-invalid' : ''}`}
                value={form[field]}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
              />
              {errors[field] && <div className="invalid-feedback">{errors[field]}</div>}
            </div>
          ))}

          <button className="btn btn-primary w-100 py-2" disabled={loading}>
            {loading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
