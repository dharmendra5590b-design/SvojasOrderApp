import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const CustomerMapping = () => {
  const [customers,        setCustomers]        = useState([]);
  const [employees,        setEmployees]        = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [checkedIds,       setCheckedIds]       = useState([]);  // string IDs currently checked
  const [savedIds,         setSavedIds]         = useState([]);  // string IDs last saved
  const [saving,           setSaving]           = useState(false);

  /* ─── load customers + data-entry operators ─── */
  const loadMasters = useCallback(async () => {
    try {
      const [cRes, eRes] = await Promise.all([
        api.get('https://localhost:8081/api/customer/getcustomermapping'),
       api.post('https://localhost:8081/api/customer/getemployee',{employee_ID:0,mode:'O'}),
      ]);
      setCustomers(cRes.data);
      setEmployees(eRes.data.data);
    } catch {
      toast.error('Failed to load data');
    }
  }, []);

  useEffect(() => { loadMasters(); }, [loadMasters]);

  /* ─── when customer dropdown changes → pre-tick assigned operators ─── */
  /*useEffect(() => {
    if (!selectedCustomer) {
      setCheckedIds([]);
      setSavedIds([]);
      return;
    }
    const cust = customers.find(c => String(c._id) === selectedCustomer);
    // assignedEmployees may be populated objects OR bare id strings – normalise to strings
    const ids = (cust?.assignedEmployees || []).map(e =>
      typeof e === 'object' ? String(e._id) : String(e)
    );
    setCheckedIds(ids);
    setSavedIds(ids);
  }, [selectedCustomer, customers]);*/
async function SetCustomer(customerID) {
 try {
    setCheckedIds([]);
       setSavedIds([]);
       var tempIds=[];
       let tmpemployees=[...employees];
   setSelectedCustomer(customerID);
   if(customerID==="" || customerID===null)
   {
    tmpemployees.forEach(element1 => {
        element1.is_Mapped=false;
     });
     setCheckedIds(tempIds);
   setSavedIds(tempIds);
   setEmployees(tmpemployees);
   return false;
   }
  const {data:MapEmp}=await api.post('https://localhost:8081/api/customer/GetCustomerMappingDtl',{customer_ID:customerID})
 if(MapEmp.statusCode===1)
 {
   
   MapEmp.data.forEach(element => {
     tempIds.push(element.employee_ID.toString());
     tmpemployees.forEach(element1 => {
       if(element.employee_ID===element1.employee_ID)
       {
         element1.is_Mapped=true;
       }
     });
   });
   setCheckedIds(tempIds);
   setSavedIds(tempIds);
   setEmployees(tmpemployees);
   
 }
 } catch (error) {
  
 }
}
  /* ─── checkbox toggle ─── */
  const toggle = id => {
    const sid = String(id);
    setCheckedIds(prev =>
      prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]
    );
  };

  const isChecked = id => checkedIds.includes(String(id));

  /* ─── Save ─── */
  const handleSave = async () => {
    if (!selectedCustomer) { toast.error('Please select a customer first'); return; }
    setSaving(true);
    try {
     const { data } = await api.post(`https://localhost:8081/api/customer/SaveCustomerMapping`, { customer_ID:selectedCustomer, employee_List: checkedIds?.join("|"),mode:"A" });
     
     
          if(data.statusCode===1)
                {   
                toast.success('Mapping saved successfully');
                }
                else
                {
                  toast.error(data?.message || 'Error saving Mapping');
                  return false;
                }
                 setSavedIds([...checkedIds]);
      await loadMasters();          // refresh so summary table reflects change instantly
    } catch {
      toast.error('Error saving mapping');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Delete (clear all assignments for this customer) ─── */
  const handleDelete = async () => {
    if (!selectedCustomer) { toast.error('Please select a customer first'); return; }
    if (!window.confirm('Remove all operator assignments for this customer?')) return;
    setSaving(true);
    try {
     const { data } = await api.post(`https://localhost:8081/api/customer/SaveCustomerMapping`, { customer_ID:selectedCustomer,mode:"D" });
     
     
          if(data.statusCode===1)
                {   
                toast.success(data?.message);
                }
                else
                {
                  toast.error(data?.message || 'Error saving Mapping');
                  return false;
                }
     
      setCheckedIds([]);
      setSavedIds([]);
      await loadMasters();
    } catch {
      toast.error('Error removing assignments');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Cancel (revert unsaved ticks) ─── */
  const handleCancel = () => {
    setCheckedIds([...savedIds]);
    toast.info('Changes discarded');
  };

  const isDirty = JSON.stringify([...checkedIds].sort()) !== JSON.stringify([...savedIds].sort());

  /* ─── UI ─── */
  return (
    <div>
      <h5 className="fw-bold mb-4">Customer Mapping</h5>

      {/* ── Main form card ── */}
      <div className="card" style={{ maxWidth: 680 }}>
        <div className="card-body" style={{ padding: '2rem 2.5rem' }}>

          {/* Customer Name row */}
          <div className="row align-items-center mb-4">
            <label className="col-sm-4 col-form-label fw-semibold">Customer Name</label>
            <div className="col-sm-8">
              <select
                className="form-select"
                style={{ maxWidth: 260 }}
                value={selectedCustomer}
                onChange={e => SetCustomer(e.target.value)}
              >
                <option value="">— Select Customer —</option>
                {customers.map(c => (
                  <option key={c.customer_ID} value={String(c.customer_ID)}>
                    {c.customer_Name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Entry Operator checkboxes */}
          <div className="row mb-4">
            <label className="col-sm-4 col-form-label fw-semibold" style={{ paddingTop: 0 }}>
              Data Entry Operator
            </label>
            <div className="col-sm-8">
              {employees.length === 0 ? (
                <span className="text-muted small">No data entry operators found</span>
              ) : (
                <div
                  className="border rounded"
                  style={{
                    maxWidth: 260,
                    padding: '6px 0',
                    background: selectedCustomer ? '#fff' : '#f8f9fa',
                    opacity: selectedCustomer ? 1 : 0.6,
                  }}
                >
                  {employees.map(emp => (
                    <div
                      key={emp.employee_ID}
                      className="d-flex align-items-center px-3 py-2"
                      style={{ cursor: selectedCustomer ? 'pointer' : 'not-allowed', userSelect: 'none' }}
                      onClick={() => selectedCustomer && toggle(emp.employee_ID)}
                    >
                      <input
                        type="checkbox"
                        className="form-check-input me-3"
                        style={{ cursor: selectedCustomer ? 'pointer' : 'not-allowed', flexShrink: 0, width: 16, height: 16 }}
                        checked={isChecked(emp.employee_ID)}
                        onChange={() => {}}   // controlled via div onClick
                        disabled={!selectedCustomer}
                      />
                      <span style={{ fontSize: '0.95rem' }}>{emp.employee_Name}</span>
                    </div>
                  ))}
                </div>
              )}

              {!selectedCustomer && (
                <p className="text-muted small mt-2 mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  Select a customer above to assign operators
                </p>
              )}

              {selectedCustomer && checkedIds.length > 0 && (
                <p className="text-success small fw-semibold mt-2 mb-0">
                  <i className="bi bi-check2-circle me-1"></i>
                  {checkedIds.length} operator{checkedIds.length !== 1 ? 's' : ''} selected
                  {isDirty && <span className="text-warning ms-2">(unsaved)</span>}
                </p>
              )}
            </div>
          </div>

          {/* Buttons: Cancel | Save | Delete */}
          <div className="d-flex justify-content-center gap-3 mt-2">
            <button
              className="btn btn-secondary px-4"
              style={{ minWidth: 110, borderRadius: 8 }}
              onClick={handleCancel}
              disabled={saving || !isDirty}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary px-4"
              style={{ minWidth: 110, borderRadius: 8 }}
              onClick={handleSave}
              disabled={saving || !selectedCustomer || !isDirty}
            >
              {saving
                ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                : 'Save'
              }
            </button>
            <button
              className="btn btn-danger px-4"
              style={{ minWidth: 110, borderRadius: 8 }}
              onClick={handleDelete}
              disabled={saving || !selectedCustomer || savedIds.length === 0}
            >
              Delete
            </button>
          </div>

        </div>
      </div>

    
    </div>
  );
};

export default CustomerMapping;
