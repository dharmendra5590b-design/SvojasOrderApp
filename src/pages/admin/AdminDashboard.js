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
      <h5 className="fw-bold mb-4">Admin Dashboard</h5>
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
<div className="row row-cols-2 row-cols-md-3 g-3">
  <br/>
</div>
      <div className="row g-3">
        <br/>
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
