import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const AdminUserDashboard = () => {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    api.get('/orders').then(({ data }) => {
      const c = {};
      data.forEach(o => { c[o.status] = (c[o.status] || 0) + 1; });
      setCounts(c);
    }).catch(() => {});
  }, []);

  const tiles = [
    { status: 'pending', label: 'Customer Orders', icon: '📥', color: 'orange', to: '/adminuser/orders/pending', desc: 'New / Rework orders' },
    { status: 'design_pending', label: 'Design Pending', icon: '🎨', color: 'blue', to: '/adminuser/orders/design_pending', desc: 'Assigned, CAD awaited' },
    { status: 'design_uploaded', label: 'Confirm Design', icon: '✅', color: '', to: '/adminuser/orders/design_uploaded', desc: 'CAD uploaded, review' },
    { status: 'customer_pending', label: 'Cust. Confirmation', icon: '👤', color: 'teal', to: '/adminuser/orders/customer_pending', desc: 'Waiting for customer' },
    { status: 'customer_confirmed', label: 'Assign Development', icon: '🔧', color: 'green', to: '/adminuser/orders/customer_confirmed', desc: 'Ready for production' },
    { status: 'under_processing', label: 'Under Processing', icon: '⚙️', color: 'red', to: '/adminuser/orders/under_processing', desc: 'In production' },
  ];

  return (
    <div>
      <h5 className="fw-bold mb-4">Admin User Dashboard</h5>
      <div className="row row-cols-2 row-cols-md-3 g-3">
        {tiles.map(t => (
          <div className="col" key={t.status}>
            <Link to={t.to} className="text-decoration-none">
              <div className={`stat-card ${t.color}`}>
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="text-muted small">{t.label}</div>
                    <div className="fs-2 fw-bold">{counts[t.status] ?? 0}</div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>{t.desc}</div>
                  </div>
                  <span style={{ fontSize: 36 }}>{t.icon}</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUserDashboard;
