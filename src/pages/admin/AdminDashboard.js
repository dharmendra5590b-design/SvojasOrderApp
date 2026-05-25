import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const StatCard = ({ label, value, icon, color, to }) => (
  <Link to={to || '#'} className="text-decoration-none col">
    <div className={`stat-card ${color}`}>
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="text-muted small mb-1">{label}</div>
          <div className="fs-2 fw-bold">{value ?? <span className="spinner-border spinner-border-sm" />}</div>
        </div>
        <span style={{ fontSize: 32 }}>{icon}</span>
      </div>
    </div>
  </Link>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [customers, employees, orders] = await Promise.all([
          api.get('/customers'),
          api.get('/employees'),
          api.get('/orders')
        ]);
        const o = orders.data;
        setStats({
          customers: customers.data.length,
          employees: employees.data.length,
          totalOrders: o.length,
          pending: o.filter(x => x.status === 'pending').length,
          completed: o.filter(x => x.status === 'completed').length,
          cancelled: o.filter(x => x.status === 'cancelled').length,
        });
      } catch {}
    };
    load();
  }, []);

  return (
    <div>
      <h5 className="fw-bold mb-4">Admin Dashboard</h5>
      <div className="row row-cols-2 row-cols-md-3 g-3 mb-4">
        <StatCard label="Total Customers" value={stats.customers} icon="👥" color="blue" to="/admin/customers" />
        <StatCard label="Total Employees" value={stats.employees} icon="👤" color="" to="/admin/employees" />
        <StatCard label="Total Orders" value={stats.totalOrders} icon="📦" color="orange" to="/admin/order-report" />
        <StatCard label="Pending Orders" value={stats.pending} icon="⏳" color="teal" />
        <StatCard label="Completed Orders" value={stats.completed} icon="✅" color="green" />
        <StatCard label="Cancelled Orders" value={stats.cancelled} icon="❌" color="red" />
      </div>

      <div className="row g-3">
        {[
          { to: '/admin/customers', icon: '👥', label: 'Customer Master', desc: 'Add/edit customers' },
          { to: '/admin/employees', icon: '👤', label: 'Employee Master', desc: 'Manage staff' },
          { to: '/admin/mapping', icon: '🔗', label: 'Customer Mapping', desc: 'Assign employees' },
          { to: '/admin/ledger', icon: '📒', label: 'Ledger Entry', desc: 'Gold & amount entries' },
          { to: '/admin/order-report', icon: '📊', label: 'Order Report', desc: 'Print & export' },
          { to: '/admin/ledger-report', icon: '📋', label: 'Ledger Report', desc: 'Customer-wise ledger' },
        ].map(item => (
          <div className="col-md-4" key={item.to}>
            <Link to={item.to} className="text-decoration-none">
              <div className="card p-3 h-100 d-flex flex-row align-items-center gap-3">
                <span style={{ fontSize: 32 }}>{item.icon}</span>
                <div>
                  <div className="fw-semibold">{item.label}</div>
                  <small className="text-muted">{item.desc}</small>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
