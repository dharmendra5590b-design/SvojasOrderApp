import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const STATUS_COLORS = {
  pending: 'warning', design_pending: 'info', design_uploaded: 'primary',
  design_confirmed: 'success', customer_pending: 'warning', customer_confirmed: 'success',
  rework_requested: 'danger', assigned_development: 'primary', under_processing: 'secondary',
  completed: 'success', cancelled: 'danger'
};

const CustomerOrderReport = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', customerId: '', status: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/customers').then(r => setCustomers(r.data)).catch(() => {}); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const { data } = await api.get(`/reports/orders?${params}`);
      setOrders(data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    const rows = [['Order#', 'Date', 'Customer', 'Design', 'Status', 'Designer', 'Assigned Date', 'Completed Date']];
    orders.forEach(o => rows.push([
      o.orderNumber, new Date(o.orderDate).toLocaleDateString('en-IN'),
      o.customerId?.customerName, o.design || '', o.status,
      o.designerId?.employeeName || '', o.assignedDate ? new Date(o.assignedDate).toLocaleDateString('en-IN') : '',
      o.completedDate ? new Date(o.completedDate).toLocaleDateString('en-IN') : ''
    ]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'order_report.csv';
    a.click();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">Customer Order Report</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm no-print" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i>Print
          </button>
          <button className="btn btn-outline-success btn-sm no-print" onClick={exportCSV}>
            <i className="bi bi-file-earmark-excel me-1"></i>Export
          </button>
        </div>
      </div>

      <div className="card mb-3 no-print">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label fw-semibold small">From Date</label>
              <input type="date" className="form-control form-control-sm"
                value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small">To Date</label>
              <input type="date" className="form-control form-control-sm"
                value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small">Customer</label>
              <select className="form-select form-select-sm"
                value={filters.customerId} onChange={e => setFilters({ ...filters, customerId: e.target.value })}>
                <option value="">All</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.customerName}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold small">Status</label>
              <select className="form-select form-select-sm"
                value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All</option>
                {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div className="col-md-1 d-flex align-items-end">
              <button className="btn btn-primary btn-sm w-100" onClick={load}>Go</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? <div className="text-center py-4"><span className="spinner-border" /></div> : (
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order #</th><th>Date</th><th>Customer</th><th>Design</th>
                    <th>Status</th><th>Designer</th><th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-4 text-muted">No orders found</td></tr>
                  ) : orders.map(o => (
                    <tr key={o._id}>
                      <td><strong>{o.orderNumber}</strong></td>
                      <td>{new Date(o.orderDate).toLocaleDateString('en-IN')}</td>
                      <td>{o.customerId?.customerName}</td>
                      <td>{o.design || '—'}</td>
                      <td>
                        <span className={`badge bg-${STATUS_COLORS[o.status] || 'secondary'}`}>
                          {o.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>{o.designerId?.employeeName || '—'}</td>
                      <td>{o.completedDate ? new Date(o.completedDate).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderReport;
