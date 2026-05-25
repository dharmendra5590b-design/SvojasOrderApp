import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DesignerLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <nav className="sidebar">
        <div className="brand">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 24 }}>💎</span>
            <div>
              <div className="fw-bold text-white" style={{ fontSize: '0.95rem' }}>JewelOrder</div>
              <div style={{ fontSize: '0.7rem', color: '#a78bfa' }}>Designer Portal</div>
            </div>
          </div>
        </div>
        <div className="flex-grow-1 py-2">
          <NavLink to="/designer/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-palette"></i><span>My Design Tasks</span>
          </NavLink>
        </div>
        <div className="p-2">
          <NavLink to="/change-password" className="nav-link"><i className="bi bi-key"></i><span>Change Password</span></NavLink>
          <button className="nav-link w-100 text-start border-0 bg-transparent" onClick={() => { logout(); navigate('/login'); }}>
            <i className="bi bi-box-arrow-left"></i><span>Logout</span>
          </button>
        </div>
      </nav>
      <div className="main-content">
        <div className="topbar">
          <h6 className="mb-0 fw-bold text-muted">Designer Portal</h6>
          <span className="badge bg-info">DESIGNER</span>
        </div>
        <div className="page-content"><Outlet /></div>
      </div>
    </div>
  );
};

export default DesignerLayout;
