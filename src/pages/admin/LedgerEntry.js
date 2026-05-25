import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const LedgerEntry = () => {
  const [entries, setEntries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customerId: '', particular: '', goldWeight: '', amount: '', entryDate: new Date().toISOString().split('T')[0] });
  const [errors, setErrors] = useState({});
  const [filterCustomer, setFilterCustomer] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    try {
      const [ent, cust] = await Promise.all([
        api.get(`/ledger${filterCustomer ? `?customerId=${filterCustomer}` : ''}`),
        api.get('/customers')
      ]);
      setEntries(ent.data); setCustomers(cust.data);
    } catch {}
  };
  useEffect(() => { loadAll(); }, [filterCustomer]);

  const validate = () => {
    const e = {};
    if (!form.customerId) e.customerId = 'Select customer';
    if (!form.particular.trim()) e.particular = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/ledger', form);
      toast.success('Entry added');
      setForm({ customerId: '', particular: '', goldWeight: '', amount: '', entryDate: new Date().toISOString().split('T')[0] });
      loadAll();
    } catch (err) {
      toast.error('Error saving entry');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h5 className="fw-bold mb-4">Ledger Entry</h5>
      <div className="row g-3">
        <div className="col-md-5">
          <div className="card">
            <div className="card-header">New Entry</div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Customer *</label>
                  <select className={`form-select ${errors.customerId ? 'is-invalid' : ''}`}
                    value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.customerName} ({c.customerCode})</option>)}
                  </select>
                  {errors.customerId && <div className="invalid-feedback">{errors.customerId}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Particular *</label>
                  <input className={`form-control ${errors.particular ? 'is-invalid' : ''}`}
                    value={form.particular} onChange={e => setForm({ ...form, particular: e.target.value })} />
                  {errors.particular && <div className="invalid-feedback">{errors.particular}</div>}
                </div>
                <div className="row g-2 mb-3">
                  <div className="col">
                    <label className="form-label fw-semibold">Gold Weight</label>
                    <input type="number" step="0.001" className="form-control" placeholder="-999 to any"
                      value={form.goldWeight} onChange={e => setForm({ ...form, goldWeight: e.target.value })} />
                  </div>
                  <div className="col">
                    <label className="form-label fw-semibold">Amount</label>
                    <input type="number" step="0.01" className="form-control"
                      value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Entry Date</label>
                  <input type="date" className="form-control"
                    value={form.entryDate} onChange={e => setForm({ ...form, entryDate: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Saving...' : 'Add Entry'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Ledger Entries</span>
              <select className="form-select form-select-sm" style={{ width: 180 }}
                value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)}>
                <option value="">All Customers</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.customerName}</option>)}
              </select>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive" style={{ maxHeight: 420 }}>
                <table className="table table-sm mb-0">
                  <thead className="table-light">
                    <tr><th>Date</th><th>Customer</th><th>Particular</th><th>Gold Wt</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-3 text-muted">No entries</td></tr>
                    ) : entries.map(e => (
                      <tr key={e._id}>
                        <td>{new Date(e.entryDate).toLocaleDateString('en-IN')}</td>
                        <td>{e.customerId?.customerName}</td>
                        <td>{e.particular}</td>
                        <td className={e.goldWeight < 0 ? 'text-danger' : 'text-success'}>
                          {e.goldWeight ?? '—'}
                        </td>
                        <td>{e.amount ? `₹${Number(e.amount).toLocaleString('en-IN')}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerEntry;
