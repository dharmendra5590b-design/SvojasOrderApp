import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const AdminUserDashboard = () => {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    api.get('http://localhost:8081/api/adminDashboard/GetAdminDashboard').then(({ data }) => {
    //  const c = {};
     // data.forEach(o => { c[o.status] = (c[o.status] || 0) + 1; });
      //setCounts(c);
      const o = data;
      setCounts({
          pending:o[0].newOrderCount,
          design_pending:o[0].pendingDesignCount,
          design_uploaded:o[0].designUploadedCount,
          customer_pending:o[0].pendingOrderConfirmedCount,
          customer_confirmed:o[0].orderConfirmedCount,
          under_processing:o[0].orderUnderProductionCount
        });
    }).catch(() => {});
  }, []);

  const tiles = [
    { status: 'pending', label: 'Customer Orders', icon: '📥', color: 'orange', to: '/adminuser/orders/pending', desc: 'New / Rework orders' },
    { status: 'design_pending', label: 'Design Pending', icon: '🎨', color: 'blue', to: '/adminuser/orders/design_pending', desc: 'Assigned, CAD awaited' },
    { status: 'design_uploaded', label: 'Confirm Design', icon: '✅', color: '', to: '/adminuser/orders/design_uploaded', desc: 'CAD uploaded, review' },
    { status: 'customer_pending', label: 'Cust. Confirmation', icon: '👤', color: 'teal', to: '/adminuser/orders/customer_pending', desc: 'Waiting for customer' },
    { status: 'customer_confirmed', label: 'Order Confirmed', icon: '🔧', color: 'green', to: '/adminuser/orders/customer_confirmed', desc: 'Ready for production' },
    { status: 'under_processing', label: 'Order Under Production', icon: '⚙️', color: 'red', to: '/adminuser/orders/under_processing', desc: 'In production' },
  ];

  return (
    <div>
      <h5 className="fw-bold mb-4">Admin User Dashboard</h5>
   <div className="row row-cols-1 row-cols-sm-3 row-cols-lg-4 g-2 g-md-3">
  {tiles.map(t => (
    <div className="col" key={t.status}>
      <Link to={t.to} className="text-decoration-none">
        <div className={`stat-card ${t.color} h-100`}>
          <div className="d-flex justify-content-between align-items-start">
            <div className="flex-grow-1 me-2" style={{ minWidth: 0 }}>
              <div className="text-muted small">{t.label}</div>
              <div className="fs-4 fs-md-2 fw-bold">{counts[t.status] ?? 0}</div>
              <div className="text-muted d-sm-block" style={{ fontSize: '0.78rem' }}>{t.desc}</div>
            </div>
            <span className="flex-shrink-0" style={{ fontSize: 'clamp(18px, 4.5vw, 36px)' }}>{t.icon}</span>
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
