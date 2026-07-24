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
      if(user.statusCode!==1)
      {
        toast.error(user?.message || 'Login failed');
        return;
      }
      toast.success('Login successful!');
      if (user.isFirstLogin) { navigate('/change-password'); return; }
      const routes = { ADMIN: '/admin/dashboard', ADMINUSER: '/adminuser/dashboard', CUSTOMER: '/customer/orders', DESIGNER: '/designer/orders', OPERATOR: '/admin/ledger' };
      if(user.data.is_Order_Available_For_Confirm===true && user.data.user_Type==="CUSTOMER")
      {
        if(user.data.is_Order_Available_For_Confirm===true)
        {
          navigate('/customer/confirm-order');
        }
        else
        {
          navigate('/customer/orders');
        }
      }
      else
      {
      navigate(routes[user.data.user_Type] || '/');
      }
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
          <img
  src="/assets/logo.jpg"
  alt="Logo"
  style={{ width: 80, height: 80, objectFit: 'contain' }}
/>
          <h4 className="fw-bold mt-2 mb-0">Jewel Quote</h4>
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

        </form>

        
      </div>
    </div>
  );
};

export default LoginPage;
