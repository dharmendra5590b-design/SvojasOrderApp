import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const ForgotPasswordPage = () => {
  const [mobile, setMobile] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(mobile)) { setError('Enter valid 10-digit mobile number'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { mobileNumber: mobile });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="text-center mb-4">
          <div style={{ fontSize: 48 }}>🔑</div>
          <h4 className="fw-bold">Forgot Password</h4>
        </div>

        {done ? (
          <div className="text-center">
            <div className="alert alert-success">
              Password has been reset to your last 6 digits of mobile number.
            </div>
            <Link to="/login" className="btn btn-primary">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label fw-semibold">Mobile Number</label>
              <input
                type="tel" maxLength={10}
                className={`form-control ${error ? 'is-invalid' : ''}`}
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={e => { setMobile(e.target.value); setError(''); }}
              />
              {error && <div className="invalid-feedback">{error}</div>}
            </div>

            <button className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center mt-3">
              <Link to="/login" className="small text-decoration-none">Back to Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
