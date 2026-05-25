import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const DESIGNATIONS = ['admin_user', 'designer', 'data_entry'];
const INIT = { employeeName: '', phoneNumber: '', email: '', designation: 'designer' };

const EmployeeMaster = () => {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try { const { data } = await api.get('/employees'); setEmployees(data); } catch {}
  };
  useEffect(() => { load(); }, []);

  const validate = () => {
    const e = {};
    if (!form.employeeName.trim()) e.employeeName = 'Required';
    if (!/^[0-9]{10}$/.test(form.phoneNumber)) e.phoneNumber = 'Valid 10-digit phone required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.designation) e.designation = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/employees/${editId}`, form);
        toast.success('Employee updated');
      } else {
        await api.post('/employees', form);
        toast.success('Employee created');
      }
      setShowModal(false); setForm(INIT); setEditId(null); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setLoading(false); }
  };

  const designationBadge = (d) => {
    const map = { admin_user: 'primary', designer: 'success', data_entry: 'info' };
    return <span className={`badge bg-${map[d] || 'secondary'}`}>{d.replace('_', ' ').toUpperCase()}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">Employee Master</h5>
        <button className="btn btn-primary" onClick={() => { setForm(INIT); setEditId(null); setErrors({}); setShowModal(true); }}>
          <i className="bi bi-plus-lg me-1"></i> Add Employee
        </button>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr><th>#</th><th>Name</th><th>Phone</th><th>Email</th><th>Designation</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-muted">No employees</td></tr>
                ) : employees.map((e, i) => (
                  <tr key={e._id}>
                    <td>{i + 1}</td>
                    <td className="fw-semibold">{e.employeeName}</td>
                    <td>{e.phoneNumber}</td>
                    <td>{e.email || '—'}</td>
                    <td>{designationBadge(e.designation)}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => {
                        setForm({ employeeName: e.employeeName, phoneNumber: e.phoneNumber, email: e.email || '', designation: e.designation });
                        setEditId(e._id); setErrors({}); setShowModal(true);
                      }}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={async () => {
                        if (!window.confirm('Delete employee?')) return;
                        try { await api.delete(`/employees/${e._id}`); toast.success('Deleted'); load(); }
                        catch { toast.error('Error'); }
                      }}><i className="bi bi-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editId ? 'Edit Employee' : 'Add Employee'}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Employee Name *</label>
                    <input className={`form-control ${errors.employeeName ? 'is-invalid' : ''}`}
                      value={form.employeeName} onChange={e => setForm({ ...form, employeeName: e.target.value })} />
                    {errors.employeeName && <div className="invalid-feedback">{errors.employeeName}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Phone Number *</label>
                    <input type="tel" maxLength={10} className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                      value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} disabled={!!editId} />
                    {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email</label>
                    <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Designation *</label>
                    <select className={`form-select ${errors.designation ? 'is-invalid' : ''}`}
                      value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} disabled={!!editId}>
                      {DESIGNATIONS.map(d => <option key={d} value={d}>{d.replace('_', ' ').toUpperCase()}</option>)}
                    </select>
                    {errors.designation && <div className="invalid-feedback">{errors.designation}</div>}
                  </div>
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

export default EmployeeMaster;
