import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const STATUS_META = {
  pending:              { label: 'Pending',              color: 'warning'   },
  design_pending:       { label: 'Design Pending',       color: 'info'      },
  design_uploaded:      { label: 'CAD Uploaded',         color: 'primary'   },
  design_confirmed:     { label: 'Design Confirmed',     color: 'success'   },
  customer_pending:     { label: 'Awaiting Your Approval', color: 'warning' },
  customer_confirmed:   { label: 'You Approved',         color: 'success'   },
  rework_requested:     { label: 'Rework Requested',     color: 'danger'    },
  assigned_development: { label: 'Sent to Production',   color: 'primary'   },
  under_processing:     { label: 'Under Processing',     color: 'secondary' },
  completed:            { label: 'Completed',            color: 'success'   },
  cancelled:            { label: 'Cancelled',            color: 'danger'    },
};

const OrderSearch = () => {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', orderNumber: '', design: '' });
  const [selected,     setSelected]     = useState(null);
  const [cancelId,     setCancelId]     = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [imgViewer,    setImgViewer]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ─── filters ─── */
  const filtered = orders.filter(o => {
    const od = new Date(o.orderDate);
    if (filters.startDate && od < new Date(filters.startDate)) return false;
    if (filters.endDate   && od > new Date(filters.endDate))   return false;
    if (filters.orderNumber && !o.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase())) return false;
    if (filters.design && !(o.design || '').toLowerCase().includes(filters.design.toLowerCase())) return false;
    return true;
  });

  /* ─── cancel ─── */
  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Cancel reason is required'); return; }
    try {
      await api.post(`/orders/${cancelId}/cancel`, { cancelReason });
      toast.success('Order cancelled');
      setCancelId(null); setCancelReason('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error cancelling order');
    }
  };

  const imgUrl = fn => fn ? `http://localhost:5000/uploads/${fn}` : null;

  const YN = v => v
    ? <span className="badge bg-success">Yes</span>
    : <span className="badge bg-light text-dark">No</span>;

  /* ─── render ─── */
  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">My Orders <span className="text-muted fw-normal" style={{fontSize:'0.85rem'}}>(Last 6 months)</span></h5>
        <Link to="/customer/new-order" className="btn btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1"></i> New Order
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-2">
            <div className="col-md-3">
              <input className="form-control form-control-sm" placeholder="Order Number"
                value={filters.orderNumber}
                onChange={e => setFilters({ ...filters, orderNumber: e.target.value })} />
            </div>
            <div className="col-md-2">
              <input className="form-control form-control-sm" placeholder="Design type"
                value={filters.design}
                onChange={e => setFilters({ ...filters, design: e.target.value })} />
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control form-control-sm" placeholder="From"
                value={filters.startDate}
                onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control form-control-sm" placeholder="To"
                value={filters.endDate}
                onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
            </div>
            <div className="col-md-1">
              <button className="btn btn-outline-secondary btn-sm w-100"
                onClick={() => setFilters({ startDate:'', endDate:'', orderNumber:'', design:'' })}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading
            ? <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
            : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Design</th>
                    <th>Designer&nbsp;Assigned</th>
                    <th>Design&nbsp;Confirmed</th>
                    <th>You&nbsp;Approved</th>
                    <th>Sent to Prod.</th>
                    <th>Completed</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan={10} className="text-center py-5 text-muted">No orders found</td></tr>
                    : filtered.map(o => {
                      const meta = STATUS_META[o.status] || { label: o.status, color: 'secondary' };
                      const canEdit = o.status === 'pending';
                      return (
                        <tr key={o._id}>
                          <td><strong>{o.orderNumber}</strong></td>
                          <td style={{whiteSpace:'nowrap'}}>{new Date(o.orderDate).toLocaleDateString('en-IN')}</td>
                          <td>{o.design || '—'}</td>
                          <td className="text-center">
                            {YN(o.designerId)}
                            {o.assignedDate && <div className="text-muted" style={{fontSize:'0.72rem'}}>{new Date(o.assignedDate).toLocaleDateString('en-IN')}</div>}
                          </td>
                          <td className="text-center">
                            {YN(o.designConfirmedDate)}
                            {o.designConfirmedDate && <div className="text-muted" style={{fontSize:'0.72rem'}}>{new Date(o.designConfirmedDate).toLocaleDateString('en-IN')}</div>}
                          </td>
                          <td className="text-center">
                            {YN(o.customerConfirmedDate)}
                            {o.customerConfirmedDate && <div className="text-muted" style={{fontSize:'0.72rem'}}>{new Date(o.customerConfirmedDate).toLocaleDateString('en-IN')}</div>}
                          </td>
                          <td className="text-center">
                            {YN(o.assignedDevelopmentDate)}
                            {o.assignedDevelopmentDate && <div className="text-muted" style={{fontSize:'0.72rem'}}>{new Date(o.assignedDevelopmentDate).toLocaleDateString('en-IN')}</div>}
                          </td>
                          <td className="text-center">
                            {YN(o.completedDate)}
                            {o.completedDate && <div className="text-muted" style={{fontSize:'0.72rem'}}>{new Date(o.completedDate).toLocaleDateString('en-IN')}</div>}
                          </td>
                          <td>
                            <span className={`badge bg-${meta.color} status-badge`}>{meta.label}</span>
                          </td>
                          <td className="text-end" style={{whiteSpace:'nowrap'}}>
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setSelected(o)}>
                              <i className="bi bi-eye"></i>
                            </button>
                            {canEdit && (
                              <Link to={`/customer/new-order?edit=${o._id}`} className="btn btn-sm btn-outline-secondary me-1">
                                <i className="bi bi-pencil"></i>
                              </Link>
                            )}
                            {canEdit && o.status !== 'cancelled' && (
                              <button className="btn btn-sm btn-outline-danger" onClick={() => { setCancelId(o._id); setCancelReason(''); }}>
                                <i className="bi bi-x-circle"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="card-footer text-muted small">
            Showing {filtered.length} of {orders.length} orders
          </div>
        )}
      </div>

      {/* ─── Order Detail Modal ─── */}
      {selected && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order: {selected.orderNumber}</h5>
                <button className="btn-close" onClick={() => setSelected(null)} />
              </div>
              <div className="modal-body">
                {/* Status bar */}
                <div className="mb-3">
                  <span className={`badge bg-${(STATUS_META[selected.status]||{color:'secondary'}).color} fs-6`}>
                    {(STATUS_META[selected.status]||{label:selected.status}).label}
                  </span>
                </div>

                {/* Details grid */}
                <div className="row g-2 mb-3">
                  {[
                    ['Order Date',     new Date(selected.orderDate).toLocaleDateString('en-IN')],
                    ['Design',         selected.design || '—'],
                    ['KT',             selected.kt     || '—'],
                    ['Type',           selected.type   || '—'],
                    ['Gold Colour',    selected.goldColour || '—'],
                    ['Size',           selected.size   || '—'],
                    ['Gold Weight',    selected.goldWeight ?? '—'],
                    ['Delivery Date',  selected.deliveryDate ? new Date(selected.deliveryDate).toLocaleDateString('en-IN') : '—'],
                    ['Stone',          selected.stone  || '—'],
                    ['Colour Stone',   selected.colourStoneRequired ? (selected.colourStone || 'Yes') : 'No'],
                    ['Certificate',    selected.certificateRequired ? (selected.certificateType || 'Yes') : 'No'],
                    ['Diamond Wt Req', selected.diamondWeightRequired ? 'Yes' : 'No'],
                  ].map(([k,v]) => (
                    <div className="col-md-4 col-6" key={k}>
                      <div className="text-muted" style={{fontSize:'0.78rem'}}>{k}</div>
                      <div className="fw-semibold" style={{fontSize:'0.9rem'}}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Workflow timeline */}
                <div className="mb-3">
                  <div className="fw-semibold mb-2 small text-muted text-uppercase">Workflow Timeline</div>
                  <div className="d-flex flex-wrap gap-2">
                    {[
                      { label: 'Order Placed',      date: selected.orderDate             },
                      { label: 'Designer Assigned',  date: selected.assignedDate          },
                      { label: 'CAD Uploaded',       date: selected.cadUploadDate         },
                      { label: 'Design Confirmed',   date: selected.designConfirmedDate   },
                      { label: 'You Approved',       date: selected.customerConfirmedDate },
                      { label: 'Sent to Production', date: selected.assignedDevelopmentDate },
                      { label: 'Completed',          date: selected.completedDate         },
                    ].map(step => (
                      <div key={step.label}
                        className={`px-3 py-2 rounded border ${step.date ? 'border-success bg-success bg-opacity-10' : 'border-light text-muted'}`}
                        style={{fontSize:'0.8rem', minWidth:120}}>
                        <div className={`fw-semibold ${step.date ? 'text-success' : ''}`}>
                          {step.date ? '✓ ' : '○ '}{step.label}
                        </div>
                        {step.date && <div style={{fontSize:'0.72rem'}}>{new Date(step.date).toLocaleDateString('en-IN')}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Images */}
                {(selected.frontImage || selected.topImage || selected.sideImage || selected.backImage || selected.cadImage) && (
                  <div>
                    <div className="fw-semibold mb-2 small text-muted text-uppercase">Images</div>
                    <div className="d-flex flex-wrap gap-2">
                      {[
                        ['frontImage','Front'], ['topImage','Top'],
                        ['sideImage','Side'],   ['backImage','Back'],
                      ].map(([f,l]) => selected[f] && (
                        <div key={f} className="text-center">
                          <img src={imgUrl(selected[f])} alt={l} className="img-thumb"
                            onClick={() => setImgViewer(imgUrl(selected[f]))} />
                          <div className="text-muted" style={{fontSize:'0.7rem'}}>{l}</div>
                        </div>
                      ))}
                      {selected.cadImage && (
                        <div className="text-center">
                          <img src={imgUrl(selected.cadImage)} alt="CAD" className="img-thumb"
                            style={{borderColor:'#7c3aed'}}
                            onClick={() => setImgViewer(imgUrl(selected.cadImage))} />
                          <div className="text-muted" style={{fontSize:'0.7rem'}}>CAD Design</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Completion info */}
                {selected.status === 'completed' && (
                  <div className="alert alert-success mt-3">
                    <strong>Order Completed</strong>
                    <div className="row g-1 mt-1 small">
                      <div className="col-6">Final Gold Wt: <strong>{selected.finalGoldWeight ?? '—'}</strong></div>
                      <div className="col-6">Final Diamond Wt: <strong>{selected.finalDiamondWeight ?? '—'}</strong></div>
                      <div className="col-6">No. Diamonds: <strong>{selected.numberOfDiamonds ?? '—'}</strong></div>
                      <div className="col-6">Bill Amount: <strong>{selected.billAmount ? `₹${Number(selected.billAmount).toLocaleString('en-IN')}` : '—'}</strong></div>
                    </div>
                  </div>
                )}

                {/* Cancel info */}
                {selected.status === 'cancelled' && (
                  <div className="alert alert-danger mt-3">
                    <strong>Cancelled</strong> – {selected.cancelReason}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
                {selected.status === 'customer_pending' && (
                  <Link to="/customer/confirm-order" className="btn btn-primary" onClick={() => setSelected(null)}>
                    Review & Approve Design
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cancel Modal ─── */}
      {cancelId && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white py-2">
                <h6 className="modal-title mb-0">Cancel Order</h6>
                <button className="btn-close btn-close-white" onClick={() => setCancelId(null)} />
              </div>
              <div className="modal-body">
                <label className="form-label fw-semibold">Reason for cancellation <span className="text-danger">*</span></label>
                <textarea className="form-control" rows={3} value={cancelReason}
                  placeholder="Mandatory – please explain why"
                  onChange={e => setCancelReason(e.target.value)} />
              </div>
              <div className="modal-footer py-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setCancelId(null)}>Back</button>
                <button className="btn btn-danger btn-sm" onClick={handleCancel}>Confirm Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Full-screen Image Viewer ─── */}
      {imgViewer && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.9)', cursor:'zoom-out' }}
          onClick={() => setImgViewer(null)}>
          <div className="modal-dialog modal-xl modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <img src={imgViewer} alt="Full view" className="img-fluid rounded shadow-lg"
              style={{ maxHeight: '90vh', margin: 'auto', display: 'block' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSearch;
