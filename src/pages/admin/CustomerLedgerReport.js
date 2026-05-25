import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CustomerLedgerReport = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'customer') {
      api.get('/customers').then(r => setCustomers(r.data)).catch(() => {});
    }
  }, [user]);

  const load = async () => {
    const cid = selectedCustomer;
    if (!cid) return;
    setLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const { data } = await api.get(`/reports/ledger/${cid}?${params}`);
      setEntries(data);
    } catch {} finally { setLoading(false); }
  };

  const exportCSV = () => {
    const rows = [['Date', 'Particular', 'Gold Weight', 'Amount']];
    entries.forEach(e => rows.push([
      new Date(e.entryDate).toLocaleDateString('en-IN'), e.particular, e.goldWeight ?? '', e.amount ?? ''
    ]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'ledger_report.csv';
    a.click();
  };

  const totalGold = entries.reduce((s, e) => s + (Number(e.goldWeight) || 0), 0);
  const totalAmount = entries.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">Customer Ledger Report</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i>Print
          </button>
          <button className="btn btn-outline-success btn-sm" onClick={exportCSV} disabled={!entries.length}>
            <i className="bi bi-file-earmark-excel me-1"></i>Export
          </button>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            {user?.role !== 'customer' && (
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Customer</label>
                <select className="form-select form-select-sm"
                  value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.customerName}</option>)}
                </select>
              </div>
            )}
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
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-primary btn-sm w-100" onClick={load}>Search</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? <div className="text-center py-4"><span className="spinner-border" /></div> : (
            <>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr><th>Date</th><th>Particular</th><th>Gold Weight</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-4 text-muted">No entries found</td></tr>
                    ) : entries.map(e => (
                      <tr key={e._id}>
                        <td>{new Date(e.entryDate).toLocaleDateString('en-IN')}</td>
                        <td>{e.particular}</td>
                        <td className={Number(e.goldWeight) < 0 ? 'text-danger fw-semibold' : 'text-success fw-semibold'}>
                          {e.goldWeight ?? '—'}
                        </td>
                        <td>{e.amount ? `₹${Number(e.amount).toLocaleString('en-IN')}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  {entries.length > 0 && (
                    <tfoot className="table-light fw-bold">
                      <tr>
                        <td colSpan={2}>Total</td>
                        <td className={totalGold < 0 ? 'text-danger' : 'text-success'}>{totalGold.toFixed(3)}</td>
                        <td>₹{totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerLedgerReport;
