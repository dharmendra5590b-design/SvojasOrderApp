import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const INIT = {customer_ID:0, customer_Name: '', customer_Code: '', mobile_Number: '', company_Name: '',gold_OpeningBalance:'',amount_OpeningBalance:'',mode:'A' };

const CustomerMaster = () => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
const [showPassword, setShowPassword] = useState({});
  const load = async () => {
    try { const { data:cust } = await api.post('https://localhost:8081/api/customer/getcustomer',{customer_ID:0}); 
    setCustomers(cust.data); } catch {}
  
  };

  useEffect(() => { load(); }, []);

  const validate = () => {
    const e = {};
    if (!form.customer_Name.trim()) e.customer_Name = 'Required';
    if (!form.customer_Code.trim()) e.customer_Code = 'Required';
    if (!/^[0-9]{10}$/.test(form.mobile_Number)) e.mobile_Number = 'Valid 10-digit mobile required';
    if (!form.company_Name.trim()) e.company_Name = 'Required';
    if (!form.gold_OpeningBalance) e.gold_OpeningBalance = 'Required';
    if (!form.amount_OpeningBalance) e.amount_OpeningBalance = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (editId) {
       const  {data}=  await api.post(`https://localhost:8081/api/customer/savecustomer`, form);
        if(data.statusCode===1)
      {   
     toast.success('Customer updated');
      }
      else
      {
        toast.error(data?.message || 'Error updating customer');
        return false;
      }
        
      } else {
     const  {data}=  await api.post('https://localhost:8081/api/customer/savecustomer', form);
     if(data.statusCode===1)
      {   
     toast.success('Customer created (login: mobile, password: last 6 digits)');
      }
      else
      {
        toast.error(data?.message || 'Error saving customer');
        return false;
      }
      }
      setShowModal(false); setForm(INIT); setEditId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving customer');
    } finally { setLoading(false); }
  };

  const handleEdit = (c) => {
    setForm({customer_ID:c.customer_ID, customer_Name: c.customer_Name, customer_Code: c.customer_Code, mobile_Number: c.mobile_Number, company_Name: c.company_Name, gold_OpeningBalance: c.gold_OpeningBalance?.toString(), amount_OpeningBalance: c.amount_OpeningBalance?.toString(),mode:'M' || '' });
    setEditId(c.customer_ID); setErrors({}); setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try { const  {data}= await api.post(`https://localhost:8081/api/customer/savecustomer`,{customer_ID:id,mode:"D"}); 
   if(data.statusCode===1)
      {   
     toast.success('Customer Deleted');
      }
      else
      {
        toast.error(data?.message || 'Error saving customer');
        return false;
      }
      load(); }
    catch { toast.error('Delete failed'); }
  };

  const filtered = customers.filter(c =>
    c.customer_Name.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_Code.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile_Number.includes(search)
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
                  <th>#</th><th>Customer Name</th><th>Code</th><th>Phone</th><th>Company</th><th>Password</th>
          <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-muted">No customers found</td></tr>
                ) : filtered.map((c, i) => (
                  <tr key={c.customer_ID}>
                    <td>{i + 1}</td>
                    <td className="fw-semibold">{c.customer_Name}</td>
                    <td><span className="badge bg-light text-dark">{c.customer_Code}</span></td>
                    <td>{c.mobile_Number}</td>
                    <td>{c.company_Name || '—'}</td>
                    <td>
    <div className="d-flex align-items-center gap-2">
      <span>
        {showPassword[c.customer_ID]
          ? c.password
          : '••••••••'}
      </span>

      <button
        type="button"
        className="btn btn-sm btn-link p-0"
        onClick={() =>
          setShowPassword(prev => ({
            ...prev,
            [c.customer_ID]: !prev[c.customer_ID]
          }))
        }
      >
        <i
          className={`bi ${
            showPassword[c.customer_ID]
              ? 'bi-eye-slash'
              : 'bi-eye'
          }`}
        ></i>
      </button>
    </div>
  </td>

                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(c)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.customer_ID)}>
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
                <input type='hidden' value={form['customer_ID']} name='customer_ID'></input>
                <input type='hidden' value={form['mode']} name='mode'></input>
                <div className="modal-body">
                  {[
                    { key: 'customer_Name', label: 'Customer Name *' },
                    { key: 'customer_Code', label: 'Customer Code *', disabled: !!editId },
                    { key: 'mobile_Number', label: 'Mobile Number *', type: 'tel', maxLength: 10, disabled: !!editId },
                    { key: 'company_Name', label: 'Company Name *' },
                    { key: 'gold_OpeningBalance', label: 'Gold Opening Balance *',type:'number', step:'0.01' },
                    { key: 'amount_OpeningBalance', label: 'Amount Opening Balance *',type:'number', step:'0.01' }
                  ].map(f => (
                    <div className="mb-3" key={f.key}>
                      <label className="form-label fw-semibold">{f.label}</label>
                      <input
                        type={f.type || 'text'}
                        maxLength={f.maxLength}
                        className={`form-control ${errors[f.key] ? 'is-invalid' : ''}`}
                        value={form[f.key]}
                        onChange={e => {
  const value = e.target.value;

  if (
    f.key === 'gold_OpeningBalance' ||
    f.key === 'amount_OpeningBalance'
  ) {
    // Allow negative numbers with up to 3 decimal places
    if (!/^-?\d*\.?\d{0,3}$/.test(value)) {
      return;
    }
  }

  setForm({ ...form, [f.key]: value });
}}

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
