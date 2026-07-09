import React, { useState,useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menuConfig = {
  ADMIN: [
    { to: '/admin/dashboard', icon: 'bi-grid-1x2', label: 'Dashboard' },
    { to: '/admin/customers', icon: 'bi-people', label: 'Customer Master' },
    { to: '/admin/employees', icon: 'bi-person-badge', label: 'Employee Master' },
    { to: '/admin/mapping', icon: 'bi-diagram-3', label: 'Customer Mapping' },
    { to: '/admin/ledger', icon: 'bi-journal-text', label: 'Ledger Entry' },
    { to: '/admin/order-report', icon: 'bi-file-earmark-bar-graph', label: 'Order Report' },
    { to: '/admin/ledger-report', icon: 'bi-file-earmark-spreadsheet', label: 'Ledger Report' },
  ],
  ADMINUSER: [
    { to: '/adminuser/dashboard', icon: 'bi-grid-1x2', label: 'Dashboard' },
    { to: '/adminuser/orders/pending', icon: 'bi-inbox', label: 'Customer Orders' },
    { to: '/adminuser/orders/design_pending', icon: 'bi-hourglass-split', label: 'Design Pending' },
    { to: '/adminuser/orders/design_uploaded', icon: 'bi-check-circle', label: 'Confirm Design' },
    { to: '/adminuser/orders/customer_pending', icon: 'bi-person-check', label: 'Cust. Confirmation' },
    { to: '/adminuser/orders/customer_confirmed', icon: 'bi-tools', label: 'Order Confirmed' },
    { to: '/adminuser/orders/under_processing', icon: 'bi-gear-wide-connected', label: 'Order Under Production' },
    { to: '/adminuser/order-report', icon: 'bi-file-earmark-bar-graph', label: 'Order Report' },
  ]
};

const AdminLayout = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menu = menuConfig[user?.user_Type] || menuConfig.ADMIN;
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

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div>
      {/* Sidebar */}
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
        transition: 'width 0.2s, height 0.2s',
      }}
    />
    <div className="overflow-hidden">
      <div className="fw-bold text-white text-truncate" style={{ fontSize: '0.95rem' }}>
        Jewel Quote
      </div>
      <div style={{ fontSize: '0.7rem', color: '#a78bfa' }}>
        {user?.user_Type === 'ADMIN' ? 'Super Admin' : 'Admin User'}
      </div>
    </div>
  </div>
</div>

        <div className="flex-grow-1 py-2 overflow-auto">
          {menu.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="p-2 border-top" style={{ borderColor: 'rgba(255,255,255,0.08)!important' }}>
          <NavLink to="/change-password" className="nav-link">
            <i className="bi bi-key"></i><span>Change Password</span>
          </NavLink>
          <button className="nav-link w-100 text-start border-0 bg-transparent" onClick={handleLogout}>
            <i className="bi bi-box-arrow-left"></i><span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main */}
      <div className="main-content">
        <div className="topbar">
          <h6 className="mb-0 fw-bold text-muted">Welcome, {user?.entity_Name}</h6>
          <div className="d-flex gap-2 align-items-center">
            <span className="badge bg-primary">{user?.user_Type?.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
