import React, { useState,useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DesignerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isMobile;
};
const isMobile = useIsMobile();

  return (
    <div>
      <nav className="sidebar">
       <div className="brand">
  <div className="d-flex align-items-center gap-2">
    <img
      src="/assets/logo.jpg"
      alt="Logo"
      style={{
        width: isMobile ? 36 : 80,
        height: isMobile ? 36 : 80,
        objectFit: 'contain',
        flexShrink: 0,
        borderRadius: 4,
        transition: 'width 0.2s, height 0.2s', // smooth resize
      }}
    />
    <div className="overflow-hidden">
      <div className="fw-bold text-white text-truncate" style={{ fontSize: '0.95rem' }}>
        Jewel Quote
      </div>
      <div style={{ fontSize: '0.7rem', color: '#a78bfa' }}>
        Designer Portal
      </div>
    </div>
  </div>
</div>

        <div className="flex-grow-1 py-2">
          <NavLink to="/designer/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-palette"></i><span>My Design Tasks</span>
          </NavLink>
          <NavLink to="/designer/task-report" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-file-earmark-text"></i><span>My Task Report</span>
          </NavLink>
        </div>
        <div className="p-2 border-top" style={{ borderColor: 'rgba(255,255,255,0.08)!important' }}>
          <NavLink to="/change-password" className="nav-link"><i className="bi bi-key"></i><span>Change Password</span></NavLink>
          <button className="nav-link w-100 text-start border-0 bg-transparent" onClick={() => { logout(); navigate('/login'); }}>
            <i className="bi bi-box-arrow-left"></i><span>Logout</span>
          </button>
        </div>
      </nav>
      <div className="main-content">
        <div className="topbar">
          <h6 className="mb-0 fw-bold text-muted">Welcome, {user?.entity_Name}</h6>
          <div className="d-flex gap-2 align-items-center">
            <span className="badge bg-primary">{user?.user_Type?.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>
        <div className="page-content"><Outlet /></div>
      </div>
    </div>
  );
};

export default DesignerLayout;