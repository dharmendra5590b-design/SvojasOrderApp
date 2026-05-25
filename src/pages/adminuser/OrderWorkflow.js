import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const STATUS_LABELS = {
  pending: 'Customer Orders (New/Rework)',
  design_pending: 'Design Pending',
  design_uploaded: 'Confirm Design',
  design_confirmed: 'Design Confirmed',
  customer_pending: 'Customer Confirmation Pending',
  customer_confirmed: 'Assign to Development',
  assigned_development: 'Assigned to Development',
  under_processing: 'Under Processing',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const OrderWorkflow = () => {
  const { status } = useParams();
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionForm, setActionForm] = useState({});
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cadFile, setCadFile] = useState(null);
  const [imgViewer, setImgViewer] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders${status ? `?status=${status}` : ''}`);
      setOrders(data);
    } catch {}
  }, [status]);

  useEffect(() => { load(); setSelected(null); setActionForm({}); }, [load]);

  useEffect(() => {
    api.get('/employees?designation=designer').then(r => setDesigners(r.data)).catch(() => {});
  }, []);

  const handleView = async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    setSelected(data); setActionForm({});
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Cancel reason is required'); return; }
    try {
      await api.post(`/orders/${cancelModal}/cancel`, { cancelReason });
      toast.success('Order cancelled');
      setCancelModal(null); setCancelReason(''); load(); setSelected(null);
    } catch { toast.error('Error cancelling order'); }
  };

  const assignDesigner = async () => {
    if (!actionForm.designerId) { toast.error('Select a designer'); return; }
    setLoading(true);
    try {
      await api.post(`/orders/${selected._id}/assign-designer`, actionForm);
      toast.success('Assigned to designer');
      load(); setSelected(null);
    } catch { toast.error('Error'); } finally { setLoading(false); }
  };

  const confirmDesign = async (confirm) => {
    if (confirm) {
      if (!actionForm.diamondWeight && !actionForm.skipDiamond) {
        toast.error('Enter diamond weight or confirm no diamonds');
        return;
      }
      setLoading(true);
      try {
        await api.post(`/orders/${selected._id}/confirm-design`, actionForm);
        toast.success('Design confirmed, customer notified');
        load(); setSelected(null);
      } catch { toast.error('Error'); } finally { setLoading(false); }
    } else {
      if (!actionForm.redesignSpecification) { toast.error('Enter redesign specification'); return; }
      setLoading(true);
      try {
        await api.post(`/orders/${selected._id}/request-redesign`, actionForm);
        toast.success('Redesign requested');
        load(); setSelected(null);
      } catch { toast.error('Error'); } finally { setLoading(false); }
    }
  };

  const assignDevelopment = async () => {
    setLoading(true);
    try {
      await api.post(`/orders/${selected._id}/assign-development`, actionForm);
      toast.success('Assigned to development team');
      load(); setSelected(null);
    } catch { toast.error('Error'); } finally { setLoading(false); }
  };

  const completeOrder = async () => {
    const req = ['finalGoldWeight', 'billAmount'];
    for (const f of req) {
      if (!actionForm[f]) { toast.error(`${f} is required`); return; }
    }
    setLoading(true);
    try {
      await api.post(`/orders/${selected._id}/complete`, actionForm);
      toast.success('Order completed!');
      load(); setSelected(null);
    } catch { toast.error('Error'); } finally { setLoading(false); }
  };

  const imgUrl = (fn) => fn ? `http://localhost:5000/uploads/${fn}` : null;

  const renderActions = () => {
    if (!selected) return null;
    switch (selected.status) {
      case 'pending':
      case 'rework_requested':
        return (
          <div className="card mt-3">
            <div className="card-header fw-semibold">Assign to Designer</div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Designer *</label>
                <select className="form-select" value={actionForm.designerId || ''}
                  onChange={e => setActionForm({ ...actionForm, designerId: e.target.value })}>
                  <option value="">Select Designer</option>
                  {designers.map(d => <option key={d._id} value={d._id}>{d.employeeName}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Design Specification</label>
                <textarea className="form-control" rows={3} value={actionForm.designSpecification || ''}
                  onChange={e => setActionForm({ ...actionForm, designSpecification: e.target.value })} />
              </div>
              <button className="btn btn-primary" onClick={assignDesigner} disabled={loading}>Assign & Notify</button>
            </div>
          </div>
        );

      case 'design_uploaded':
        return (
          <div className="card mt-3">
            <div className="card-header fw-semibold">Review CAD Design</div>
            <div className="card-body">
              {selected.cadImage && (
                <div className="mb-3">
                  <img src={imgUrl(selected.cadImage)} alt="CAD" className="img-fluid rounded"
                    style={{ maxHeight: 300, cursor: 'pointer' }}
                    onClick={() => setImgViewer(imgUrl(selected.cadImage))} />
                </div>
              )}
              <div className="row g-2 mb-3">
                <div className="col">
                  <label className="form-label">Diamond Weight</label>
                  <input type="number" step="0.01" className="form-control" value={actionForm.diamondWeight || ''}
                    onChange={e => setActionForm({ ...actionForm, diamondWeight: e.target.value })} />
                </div>
                <div className="col">
                  <label className="form-label">No. of Stones</label>
                  <input type="number" className="form-control" value={actionForm.numberOfStones || ''}
                    onChange={e => setActionForm({ ...actionForm, numberOfStones: e.target.value })} />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-success" onClick={() => confirmDesign(true)} disabled={loading}>
                  ✅ Confirm Design
                </button>
                <button className="btn btn-warning" onClick={() => {
                  const spec = prompt('Enter redesign specification:');
                  if (spec) { setActionForm({ ...actionForm, redesignSpecification: spec }); confirmDesign(false); }
                }} disabled={loading}>
                  🔄 Request Redesign
                </button>
              </div>
            </div>
          </div>
        );

      case 'customer_confirmed':
        return (
          <div className="card mt-3">
            <div className="card-header fw-semibold">Assign to Development</div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Team Email</label>
                <input type="email" className="form-control" value={actionForm.teamEmail || ''}
                  onChange={e => setActionForm({ ...actionForm, teamEmail: e.target.value })} />
              </div>
              <button className="btn btn-primary" onClick={assignDevelopment} disabled={loading}>
                Assign to Development Team
              </button>
            </div>
          </div>
        );

      case 'under_processing':
        return (
          <div className="card mt-3">
            <div className="card-header fw-semibold">Complete Order</div>
            <div className="card-body">
              <div className="row g-2">
                {[
                  { key: 'finalGoldWeight', label: 'Final Gold Weight *' },
                  { key: 'finalDiamondWeight', label: 'Final Diamond Weight' },
                  { key: 'numberOfDiamonds', label: 'No. of Diamonds' },
                  { key: 'billAmount', label: 'Bill Amount *' },
                  { key: 'gold24ktWeight', label: '24kt Gold Weight (Ledger)' }
                ].map(f => (
                  <div className="col-md-4" key={f.key}>
                    <label className="form-label small">{f.label}</label>
                    <input type="number" step="0.001" className="form-control form-control-sm"
                      value={actionForm[f.key] || ''}
                      onChange={e => setActionForm({ ...actionForm, [f.key]: e.target.value })} />
                  </div>
                ))}
              </div>
              <button className="btn btn-success mt-3" onClick={completeOrder} disabled={loading}>
                Mark as Completed
              </button>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div>
      <h5 className="fw-bold mb-4">{STATUS_LABELS[status] || 'Orders'}</h5>

      <div className="row g-3">
        <div className={selected ? 'col-md-5' : 'col-12'}>
          <div className="card">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr><th>Order #</th><th>Customer</th><th>Date</th><th>Design</th><th></th></tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-4 text-muted">No orders</td></tr>
                    ) : orders.map(o => (
                      <tr key={o._id} className={selected?._id === o._id ? 'table-active' : ''}>
                        <td><strong>{o.orderNumber}</strong></td>
                        <td>{o.customerId?.customerName}</td>
                        <td>{new Date(o.orderDate).toLocaleDateString('en-IN')}</td>
                        <td>{o.design || '—'}</td>
                        <td>
                          <button className="btn btn-sm btn-primary me-1" onClick={() => handleView(o._id)}>View</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setCancelModal(o._id)}>Cancel</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {selected && (
          <div className="col-md-7">
            <div className="card">
              <div className="card-header d-flex justify-content-between">
                <span className="fw-semibold">Order: {selected.orderNumber}</span>
                <button className="btn-close" onClick={() => setSelected(null)} />
              </div>
              <div className="card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="row g-2 mb-3">
                  <div className="col-md-6"><small className="text-muted">Customer</small><div className="fw-semibold">{selected.customerId?.customerName}</div></div>
                  <div className="col-md-6"><small className="text-muted">Order Date</small><div>{new Date(selected.orderDate).toLocaleDateString('en-IN')}</div></div>
                  <div className="col-md-6"><small className="text-muted">Design</small><div>{selected.design || '—'}</div></div>
                  <div className="col-md-6"><small className="text-muted">KT / Type</small><div>{selected.kt || '—'} / {selected.type || '—'}</div></div>
                  <div className="col-md-6"><small className="text-muted">Gold Weight</small><div>{selected.goldWeight || '—'}</div></div>
                  <div className="col-md-6"><small className="text-muted">Delivery Date</small><div>{selected.deliveryDate ? new Date(selected.deliveryDate).toLocaleDateString('en-IN') : '—'}</div></div>
                </div>

                {/* Customer Images */}
                <div className="mb-3">
                  <small className="text-muted d-block mb-1">Customer Images</small>
                  <div className="d-flex gap-2 flex-wrap">
                    {['frontImage', 'topImage', 'sideImage', 'backImage'].map(f => selected[f] && (
                      <img key={f} src={imgUrl(selected[f])} alt={f} className="img-thumb"
                        onClick={() => setImgViewer(imgUrl(selected[f]))} />
                    ))}
                    {!selected.frontImage && !selected.topImage && <small className="text-muted">No images</small>}
                  </div>
                </div>

                {selected.designSpecification && (
                  <div className="alert alert-info py-2">
                    <small><strong>Design Spec:</strong> {selected.designSpecification}</small>
                  </div>
                )}
                {selected.reworkSpecification && (
                  <div className="alert alert-warning py-2">
                    <small><strong>Rework Spec:</strong> {selected.reworkSpecification}</small>
                  </div>
                )}

                {renderActions()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header"><h6 className="modal-title">Cancel Order</h6><button className="btn-close" onClick={() => setCancelModal(null)} /></div>
              <div className="modal-body">
                <label className="form-label fw-semibold">Cancel Reason *</label>
                <textarea className="form-control" rows={3} value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)} placeholder="Required" />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setCancelModal(null)}>Back</button>
                <button className="btn btn-danger btn-sm" onClick={handleCancel}>Cancel Order</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer */}
      {imgViewer && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setImgViewer(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <img src={imgViewer} alt="Full view" className="img-fluid rounded" style={{ maxHeight: '90vh', margin: 'auto', display: 'block' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderWorkflow;
