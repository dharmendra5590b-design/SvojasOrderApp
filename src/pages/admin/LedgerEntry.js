import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const LedgerEntry = () => {
  const [entries, setEntries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customer_ID: '',voucher:'', particular: '', goldIn: '', amountIn: '', mode:'A' });
  const [errors, setErrors] = useState({});
  const [filterCustomer, setFilterCustomer] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    try {
      const [cust] = await Promise.all([
        api.post('https://api.jewelquote.in/api/customer/getcustomer',{customer_ID:0,mode:'L'})
      ]);
     setCustomers(cust.data.data);
    } catch {}
  };
  useEffect(() => { loadAll(); }, [filterCustomer]);

  const validate = () => {
    const e = {};
    if (!form.customer_ID) e.customer_ID = 'Select customer';
    if (!form.voucher.trim()) e.voucher = 'Required';
    if (!form.particular.trim()) e.particular = 'Required';
    if (!form.goldIn) e.goldIn = 'Required';
    if (!form.amountIn) e.amountIn = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
   const {data}=   await api.post('https://api.jewelquote.in/api/customer/SaveCustomerLedgerCredit', form);
      if(data.statusCode===1)
            {   
           toast.success(data?.message);
            }
            else
            {
              toast.error(data?.message || 'Error saving ledger');
              return false;
            }
      setForm({ customer_ID: '',voucher:'', particular: '', goldIn: '', amountIn: '','mode':'A' });
     // loadAll();
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
                <input type='hidden' value={form['mode']} name='mode'></input>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Customer *</label>
                  <select className={`form-select ${errors.customer_ID ? 'is-invalid' : ''}`}
                    value={form.customer_ID} onChange={e => setForm({ ...form, customer_ID: e.target.value })}>
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c.customer_ID} value={c.customer_ID}>{c.customer_Name}</option>)}
                  </select>
                  {errors.customer_ID && <div className="invalid-feedback">{errors.customer_ID}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Voucher *</label>
                  <input className={`form-control ${errors.voucher ? 'is-invalid' : ''}`}
                    value={form.voucher} onChange={e => setForm({ ...form, voucher: e.target.value })} />
                  {errors.voucher && <div className="invalid-feedback">{errors.voucher}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Particular *</label>
                  <input className={`form-control ${errors.particular ? 'is-invalid' : ''}`}
                    value={form.particular} onChange={e => setForm({ ...form, particular: e.target.value })} />
                  {errors.particular && <div className="invalid-feedback">{errors.particular}</div>}
                </div>
                <div className="row g-2 mb-3">
                  <div className="col">
                    <label className="form-label fw-semibold">Gold Received *</label>
                    <input type="number" step="0.001" className={`form-control ${errors.goldIn ? 'is-invalid' : ''}`} placeholder="Gold Received (-999)"
                      value={form.goldIn} onChange={e => {
    const value = e.target.value;

    // Allow negative numbers with up to 3 decimal places
    if (/^-?\d*\.?\d{0,3}$/.test(value) || value === "") {
      setForm({ ...form, goldIn: value });
    }
  }}
 />
                      {errors.goldIn && <div className="invalid-feedback">{errors.goldIn}</div>}
                  </div>
                  <div className="col">
                    <label className="form-label fw-semibold">Amount Received *</label>
                  <input
  type="number"
  step="0.01"
  className={`form-control ${errors.amountIn ? 'is-invalid' : ''}`}
  value={form.amountIn}
  onChange={e => {
    const value = e.target.value;

    // Allow negative numbers with up to 2 decimal places
    if (/^-?\d*\.?\d{0,2}$/.test(value) || value === "") {
      setForm({ ...form, amountIn: value });
    }
  }}
/>
                  {errors.amountIn && <div className="invalid-feedback">{errors.amountIn}</div>}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Saving...' : 'Add Entry'}
                </button>
              </form>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default LedgerEntry;
