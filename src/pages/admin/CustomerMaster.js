import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const INIT = { customerName: '', customerCode: '', phoneNumber: '', companyName: '' };

const CustomerMaster = () => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try { const { data } = await api.get('/customers'); setCustomers(data); } catch {}
  };

  useEffect(() => { load(); }, []);

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = 'Required';
    if (!form.customerCode.trim()) e.customerCode = 'Required';
    if (!/^[0-9]{10}$/.test(form.phoneNumber)) e.phoneNumber = 'Valid 10-digit mobile required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/customers/${editId}`, form);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', form);
        toast.success('Customer created (login: mobile, password: last 6 digits)');
      }
      setShowModal(false); setForm(INIT); setEditId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving customer');
    } finally { setLoading(false); }
  };

  const handleEdit = (c) => {
    setForm({ customerName: c.customerName, customerCode: c.customerCode, phoneNumber: c.phoneNumber, companyName: c.companyName || '' });
    setEditId(c._id); setErrors({}); setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try { await api.delete(`/customers/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const filtered = customers.filter(c =>
    c.customerName.toLowerCase().includes(search.toLowerCase()) ||
    c.customerCode.toLowerCase().includes(search.toLowerCase()) ||
    c.phoneNumber.includes(search)
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">Customer Master</h5>
        <button className="btn btn-primary" onClick={() => { setForm(INIT); setEditId(null); setErrors({}); setShowModal(true); }}>
          <i className="bi bi-plus-lg me-1"></i> Add Customer
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body pb-0">
          <input className="form-control" placeholder="Search by name, code or phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th><th>Customer Name</th><th>Code</th><th>Phone</th><th>Company</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-muted">No customers found</td></tr>
                ) : filtered.map((c, i) => (
                  <tr key={c._id}>
                    <td>{i + 1}</td>
                    <td className="fw-semibold">{c.customerName}</td>
                    <td><span className="badge bg-light text-dark">{c.customerCode}</span></td>
                    <td>{c.phoneNumber}</td>
                    <td>{c.companyName || '—'}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(c)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c._id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editId ? 'Edit Customer' : 'Add Customer'}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {[
                    { key: 'customerName', label: 'Customer Name *' },
                    { key: 'customerCode', label: 'Customer Code *', disabled: !!editId },
                    { key: 'phoneNumber', label: 'Phone Number *', type: 'tel', maxLength: 10, disabled: !!editId },
                    { key: 'companyName', label: 'Company Name' }
                  ].map(f => (
                    <div className="mb-3" key={f.key}>
                      <label className="form-label fw-semibold">{f.label}</label>
                      <input
                        type={f.type || 'text'}
                        maxLength={f.maxLength}
                        className={`form-control ${errors[f.key] ? 'is-invalid' : ''}`}
                        value={form[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        disabled={f.disabled}
                      />
                      {errors[f.key] && <div className="invalid-feedback">{errors[f.key]}</div>}
                    </div>
                  ))}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : editId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMaster;
