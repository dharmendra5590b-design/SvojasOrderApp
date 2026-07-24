import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const DESIGNATIONS = [{Value:'ADMINUSER',Text:'Admin User'}, {Value:'DESIGNER',Text:'Designer'}, {Value:'Operator',Text:'Operator'}];
const INIT = {employee_ID:0, employee_Name: '', mobile_Number: '', email_ID: '', designation: 'ADMINUSER','mode':'A' };

const EmployeeMaster = () => {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState({});
  const load = async () => {
    try { const { data:emp } = await api.post('https://localhost:8081/api/customer/getemployee',{employee_ID:0,mode:'S'}); 
    setEmployees(emp.data); } catch {}
  };
  useEffect(() => { load(); }, []);

  const validate = () => {
    const e = {};
    if (!form.employee_Name.trim()) e.employee_Name = 'Required';
    if (!/^[0-9]{10}$/.test(form.mobile_Number)) e.mobile_Number = 'Valid 10-digit phone required';
    if (form.email_ID && !/\S+@\S+\.\S+/.test(form.email_ID)) e.email_ID = 'Invalid email';
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
      const {data}=  await api.post(`https://localhost:8081/api/customer/saveemployee`, form);
         if(data.statusCode===1)
          {   
         toast.success('Employee updated');
          }
          else
          {
            toast.error(data?.message || 'Error updating Employee');
            return false;
          }
      } else {
       const {data}= await api.post('https://localhost:8081/api/customer/saveemployee', form);
         if(data.statusCode===1)
          {   
         toast.success('Employee Created');
          }
          else
          {
            toast.error(data?.message || 'Error creating Employee');
            return false;
          }
      }
      setShowModal(false); setForm(INIT); setEditId(null); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setLoading(false); }
  };

  const designationBadge = (d) => {
    const map = { ADMINUSER: 'primary', DESIGNER: 'success', OPERATOR: 'info' };
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
                <tr><th>#</th><th>Name</th><th>Phone</th><th>Email</th><th>Designation</th><th>Password</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-muted">No employees</td></tr>
                ) : employees.map((e, i) => (
                  <tr key={e.employee_ID}>
                    <td>{i + 1}</td>
                    <td className="fw-semibold">{e.employee_Name}</td>
                    <td>{e.mobile_Number}</td>
                    <td>{e.email_ID || '—'}</td>
                    <td>{designationBadge(e.designation)}</td>
                    <td>
    <div className="d-flex align-items-center gap-2">
      <span>
        {showPassword[e.employee_ID]
          ? e.password
          : '••••••••'}
      </span>

      <button
        type="button"
        className="btn btn-sm btn-link p-0"
        onClick={() =>
          setShowPassword(prev => ({
            ...prev,
            [e.employee_ID]: !prev[e.employee_ID]
          }))
        }
      >
        <i
          className={`bi ${
            showPassword[e.employee_ID]
              ? 'bi-eye-slash'
              : 'bi-eye'
          }`}
        ></i>
      </button>
    </div>
  </td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => {
                        setForm({ employee_ID:e.employee_ID, employee_Name: e.employee_Name, mobile_Number: e.mobile_Number, email_ID: e.email_ID || '', designation: e.designation,mode:'M' });
                        setEditId(e.employee_ID); setErrors({}); setShowModal(true);
                      }}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={async () => {
                        if (!window.confirm('Delete employee?')) return;
                        try {const {data}= await api.post(`https://localhost:8081/api/customer/saveemployee`,{employee_ID:e.employee_ID,mode:'D'}); toast.success(data?.message); load(); }
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
                 <input type='hidden' value={form['employee_ID']} name='employee_ID'></input>
                <input type='hidden' value={form['mode']} name='mode'></input>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Employee Name *</label>
                    <input className={`form-control ${errors.employee_Name ? 'is-invalid' : ''}`}
                      value={form.employee_Name} onChange={e => setForm({ ...form, employee_Name: e.target.value })} />
                    {errors.employee_Name && <div className="invalid-feedback">{errors.employee_Name}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Mobile Number *</label>
                    <input type="tel" maxLength={10} className={`form-control ${errors.mobile_Number ? 'is-invalid' : ''}`}
                      value={form.mobile_Number} onChange={e => setForm({ ...form, mobile_Number: e.target.value })} disabled={!!editId} />
                    {errors.mobile_Number && <div className="invalid-feedback">{errors.mobile_Number}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email</label>
                    <input type="email" className={`form-control ${errors.email_ID ? 'is-invalid' : ''}`}
                      value={form.email_ID} onChange={e => setForm({ ...form, email_ID: e.target.value })} />
                    {errors.email && <div className="invalid-feedback">{errors.email_ID}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Designation *</label>
                    <select className={`form-select ${errors.designation ? 'is-invalid' : ''}`}
                      value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} disabled={!!editId}>
                      {DESIGNATIONS.map(d => <option key={d.Value} value={d.Value}>{d.Text.replace('_', ' ').toUpperCase()}</option>)}
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
