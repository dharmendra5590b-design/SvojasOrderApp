import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const CustomerMapping = () => {
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    Promise.all([api.get('/customers'), api.get('/employees?designation=data_entry')]).then(([c, e]) => {
      setCustomers(c.data); setEmployees(e.data);
    }).catch(() => {});
  }, []);

  const assign = async (customerId, employeeId) => {
    setSaving(s => ({ ...s, [customerId]: true }));
    try {
      await api.post(`/customers/${customerId}/assign`, { employeeId });
      toast.success('Mapping updated');
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch { toast.error('Error updating mapping'); }
    finally { setSaving(s => ({ ...s, [customerId]: false })); }
  };

  return (
    <div>
      <h5 className="fw-bold mb-4">Customer Mapping</h5>
      <div className="card">
        <div className="card-header">
          <small className="text-muted">Assign Data Entry employees to customers</small>
        </div>
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>Customer</th><th>Code</th><th>Phone</th><th>Assigned Employee</th></tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c._id}>
                  <td className="fw-semibold">{c.customerName}</td>
                  <td>{c.customerCode}</td>
                  <td>{c.phoneNumber}</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 220 }}
                      value={c.assignedEmployee?._id || c.assignedEmployee || ''}
                      onChange={e => assign(c._id, e.target.value)}
                      disabled={saving[c._id]}
                    >
                      <option value="">— Not Assigned —</option>
                      {employees.map(e => (
                        <option key={e._id} value={e._id}>{e.employeeName} ({e.phoneNumber})</option>
                      ))}
                    </select>
                    {saving[c._id] && <span className="spinner-border spinner-border-sm ms-2" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerMapping;
