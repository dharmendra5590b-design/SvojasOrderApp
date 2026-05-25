import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [form, setForm] = useState({ mobileNumber: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!/^[0-9]{10}$/.test(form.mobileNumber)) e.mobileNumber = 'Enter valid 10-digit mobile number';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form.mobileNumber, form.password);
      toast.success('Login successful!');
      if (user.isFirstLogin) { navigate('/change-password'); return; }
      const routes = { admin: '/admin/dashboard', admin_user: '/adminuser/dashboard', customer: '/customer/orders', designer: '/designer/orders', data_entry: '/admin/ledger' };
      navigate(routes[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="text-center mb-4">
          <div style={{ fontSize: 48, color: '#7c3aed' }}>💎</div>
          <h4 className="fw-bold mt-2 mb-0">Jewellery Orders</h4>
          <small className="text-muted">Sign in to your account</small>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label fw-semibold">Mobile Number</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-phone"></i></span>
              <input
                type="tel" maxLength={10}
                className={`form-control ${errors.mobileNumber ? 'is-invalid' : ''}`}
                placeholder="10-digit mobile number"
                value={form.mobileNumber}
                onChange={e => setForm({ ...form, mobileNumber: e.target.value })}
              />
              {errors.mobileNumber && <div className="invalid-feedback">{errors.mobileNumber}</div>}
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock"></i></span>
              <input
                type={showPass ? 'text' : 'password'}
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPass(!showPass)}>
                <i className={`bi bi-eye${showPass ? '-slash' : ''}`}></i>
              </button>
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2" />Signing in...</> : 'Sign In'}
          </button>

          <div className="text-center mt-3">
            <Link to="/forgot-password" className="text-decoration-none small" style={{ color: '#7c3aed' }}>
              Forgot Password?
            </Link>
          </div>
        </form>

        <div className="mt-4 p-3 rounded" style={{ background: '#f5f4fb', fontSize: '0.8rem' }}>
          <strong>Demo Credentials:</strong><br />
          Admin: <code>9999999999</code> / <code>999999</code><br />
          Default password = last 6 digits of mobile
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
