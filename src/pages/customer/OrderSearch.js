import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import OrderPrintModal from '../adminuser/OrderPrintModal'; 
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
  cancelled:            { label: 'Cancelled',            color: 'danger' },
  Cancel:            { label: 'Cancel',            color: 'danger' },
    Active:     { label: 'Active',     color: 'success'
     },
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const OrderSearch = () => {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [filters,     setFilters]     = useState({ order_FromDT: '', order_ToDT: '', order_ID: '', design_ID: '', customer_ID: 0 });
  const [selected,    setSelected]    = useState(null);
  const [cancelId,    setCancelId]    = useState(null);
  const [cancelReason,setCancelReason]= useState('');
  const [imgViewer,   setImgViewer]   = useState(null);
const [designs, setDesigns] = useState([]);
const [printOrderId, setPrintOrderId] = useState(null);
  // ─── Pagination state ───
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(10);

  const { user } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.post('https://localhost:8081/api/order/GetGridOrder', { customer_ID: user.entity_ID });
      setOrders(data);
      setCurrentPage(1); // reset to first page on fresh load
      const { data:order } = await api.get('https://localhost:8081/api/order/GetListCustomerOrder',{employee_ID:0}); 
    setDesigns(order.design); 
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Reset page to 1 whenever filters change ───
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // ─── Filtered list ───
  const filtered = orders.filter(o => {
    const od = new Date(o.order_Date);
    if (filters.order_FromDT && od < new Date(filters.order_FromDT)) return false;
    if (filters.order_ToDT   && od > new Date(filters.order_ToDT))   return false;
    if (filters.order_ID  && !o.order_ID.toString().toLowerCase().includes(filters.order_ID.toLowerCase())) return false;
    if (filters.design_ID && !(o.design_ID || '').toString().toLowerCase().includes(filters.design_ID.toLowerCase())) return false;
    return true;
  });

  // ─── Pagination calculations ───
  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage    = Math.min(currentPage, totalPages);
  const startIndex  = (safePage - 1) * pageSize;
  const paginated   = filtered.slice(startIndex, startIndex + pageSize);

  // Build page number array (show max 5 pages around current)
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left  = Math.max(1, safePage - delta);
    const right = Math.min(totalPages, safePage + delta);
    if (left > 1)          { pages.push(1); if (left > 2) pages.push('...'); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) { if (right < totalPages - 1) pages.push('...'); pages.push(totalPages); }
    return pages;
  };

  // ─── Cancel ───
  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Cancel reason is required'); return; }
    try {
      const { data:order } = await api.post(`https://localhost:8081/api/order/cancelOrder`, { order_ID:cancelId,user_ID:user.entity_ID, cancel_Reason:cancelReason });
      if(order.statusCode===1)
      {
      toast.success('Order cancelled');
      setCancelId(null); setCancelReason('');
      load();
      }
      else
      {
       toast.error(order?.message || 'Error cancelling order'); 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error cancelling order');
    }
  };

  const imgUrl = fn => fn ? `https://localhost:8081/uploads/${fn}` : null;

  const YN = v => v
    ? <span className="badge bg-success">Yes</span>
    : <span className="badge bg-light text-dark">No</span>;

  // ─── Render ───
  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">
          My Orders <span className="text-muted fw-normal" style={{ fontSize: '0.85rem' }}>(Last 6 months)</span>
        </h5>
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
                value={filters.order_ID}
                onChange={e => handleFilterChange({ ...filters, order_ID: e.target.value })} />
            </div>
            <div className="col-md-2">
              <select className="form-select"
                      value={filters.design_ID} onChange={e => handleFilterChange({ ...filters, design_ID: e.target.value })}>
                      <option value="">Select Design</option>
                      {designs.map(d => <option key={d.value} value={d.value}>{d.text}</option>)}
                    </select>
             
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control form-control-sm"
                value={filters.order_FromDT}
                onChange={e => handleFilterChange({ ...filters, order_FromDT: e.target.value })} />
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control form-control-sm"
                value={filters.order_ToDT}
                onChange={e => handleFilterChange({ ...filters, order_ToDT: e.target.value })} />
            </div>
            <div className="col-md-1">
              <button className="btn btn-outline-secondary btn-sm w-100"
                onClick={() => handleFilterChange({ order_FromDT: '', order_ToDT: '', order_ID: '', design_ID: '', customer_ID: 0 })}>
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
                      <th>Order Number</th>
                      <th>Date</th>
                      <th>Design</th>
                      <th>Expected Delivery Date</th>
                      <th>Committed Date</th>
                      <th>Assigned</th>
                      <th>Confirmed</th>
                      <th>Approved</th>
                      <th>Sent to Prod.</th>
                      <th>Completed</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0
                      ? <tr><td colSpan={10} className="text-center py-5 text-muted">No orders found</td></tr>
                      : paginated.map(o => {
                        const meta   = STATUS_META[o.status] || { label: o.status, color: 'secondary' };
                        const canEdit = o.is_Assigned_Designer === 'No';
                        return (
                          <tr key={o._id}>
                            <td>{o.order_Number}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{new Date(o.order_Date).toLocaleDateString('en-IN')}</td>
                            <td>{o.design || '—'}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{new Date(o.delivery_Date).toLocaleDateString('en-IN')}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                                  {o.committed_DT
                                    ? new Date(o.committed_DT).toLocaleDateString('en-IN')
                                    : '-'}
                                </td>
                            <td className="text-center">
                              {YN(o.designer_Assgined_DT)}
                              {o.designer_Assgined_DT && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{new Date(o.designer_Assgined_DT).toLocaleDateString('en-IN')}</div>}
                            </td>
                            <td className="text-center">
                              {YN(o.design_Approved_DT)}
                              {o.design_Approved_DT && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{new Date(o.design_Approved_DT).toLocaleDateString('en-IN')}</div>}
                            </td>
                            <td className="text-center">
                              {YN(o.order_Confirmed_DT)}
                              {o.order_Confirmed_DT && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{new Date(o.order_Confirmed_DT).toLocaleDateString('en-IN')}</div>}
                            </td>
                            <td className="text-center">
                              {YN(o.production_Assigned_DT)}
                              {o.production_Assigned_DT && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{new Date(o.production_Assigned_DT).toLocaleDateString('en-IN')}</div>}
                            </td>
                            <td className="text-center">
                              {YN(o.order_Completed_DT)}
                              {o.order_Completed_DT && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{new Date(o.order_Completed_DT).toLocaleDateString('en-IN')}</div>}
                            </td>
                            <td>
                              <span className={`badge bg-${meta.color} status-badge`}>{meta.label}</span>
                            </td>
                           
                            <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                              {/* View */}
                              {!canEdit && (
                                <button
                                  className="btn btn-sm btn-outline-primary me-1"
                                  onClick={() =>
                                    (window.location.href = `/customer/new-order?edit=${o.order_ID}`)
                                  }
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                              )}

                              {/* Edit */}
                              {canEdit && (
                                <Link
                                  to={`/customer/new-order?edit=${o.order_ID}`}
                                  className="btn btn-sm btn-outline-secondary me-1"
                                >
                                  <i className="bi bi-pencil"></i>
                                </Link>
                              )}

                              {/* Repeat Order */}
                               {(o.order_Completed_DT)?
                              <Link
                                to="#"
                                className="btn btn-sm btn-outline-success me-1"
                                title="Repeat Order"
                                onClick={(e) => {
                                  e.preventDefault();

                                  if (window.confirm(    "Are you sure you want to repeat this order with modifications?")) {
                                    window.location.href = `/customer/new-order?RepeatorderModification=${o.order_ID}`;
                                  }
                                  else
                                  {
                                    window.location.href = `/customer/new-order?PassRepeatOrder=${o.order_ID}`;
                                  }
                                }}
                              >
                                <i className="bi bi-arrow-repeat"></i>
                              </Link>:null}

                              {/* Cancel */}
                              {canEdit && o.status !== 'cancelled' && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => {
                                    setCancelId(o.order_ID);
                                    setCancelReason('');
                                  }}
                                >
                                  <i className="bi bi-x-circle"></i>
                                </button>
                              )}
                              {o.order_Completed_DT && (
                                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setPrintOrderId(o.order_ID)}>
                                        <i className="bi bi-printer"></i>
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

        {/* ─── Pagination Footer ─── */}
        {filtered.length > 0 && (
          <div className="card-footer d-flex align-items-center justify-content-between flex-wrap gap-2">

            {/* Left: record count + page-size selector */}
            <div className="d-flex align-items-center gap-2 text-muted small">
              <span>
                Showing {startIndex + 1}–{Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} orders
                {filtered.length !== orders.length && ` (filtered from ${orders.length})`}
              </span>
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              >
                {PAGE_SIZE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n} / page</option>
                ))}
              </select>
            </div>

            {/* Right: page buttons */}
            {totalPages > 1 && (
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  {/* Prev */}
                  <li className={`page-item ${safePage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(safePage - 1)}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>

                  {/* Page numbers */}
                  {getPageNumbers().map((p, idx) =>
                    p === '...'
                      ? <li key={`ellipsis-${idx}`} className="page-item disabled"><span className="page-link">…</span></li>
                      : <li key={p} className={`page-item ${p === safePage ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(p)}>{p}</button>
                        </li>
                  )}

                  {/* Next */}
                  <li className={`page-item ${safePage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(safePage + 1)}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        )}
      </div>

      {/* ─── Order Detail Modal ─── */}
      {selected && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order: {selected.order_ID}</h5>
                <button className="btn-close" onClick={() => setSelected(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <span className={`badge bg-${(STATUS_META[selected.status] || { color: 'secondary' }).color} fs-6`}>
                    {(STATUS_META[selected.status] || { label: selected.status }).label}
                  </span>
                </div>

                <div className="row g-2 mb-3">
                  {[
                    ['Order Date',     new Date(selected.order_Date).toLocaleDateString('en-IN')],
                    ['Design',         selected.design || '—'],
                    ['KT',             selected.kt     || '—'],
                    ['Type',           selected.type   || '—'],
                    ['Gold Colour',    selected.goldColour || '—'],
                    ['Size',           selected.size   || '—'],
                    ['Gold Weight',    selected.goldWeight ?? '—'],
                    ['Expected Delivery Date',  selected.deliveryDate ? new Date(selected.deliveryDate).toLocaleDateString('en-IN') : '—'],
                    ['Stone',          selected.stone  || '—'],
                    ['Colour Stone',   selected.colourStoneRequired ? (selected.colourStone || 'Yes') : 'No'],
                    ['Certificate',    selected.certificateRequired ? (selected.certificateType || 'Yes') : 'No'],
                    ['Diamond Wt Req', selected.diamondWeightRequired ? 'Yes' : 'No'],
                  ].map(([k, v]) => (
                    <div className="col-md-4 col-6" key={k}>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>{k}</div>
                      <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div className="mb-3">
                  <div className="fw-semibold mb-2 small text-muted text-uppercase">Workflow Timeline</div>
                  <div className="d-flex flex-wrap gap-2">
                    {[
                      { label: 'Order Placed',       date: selected.order_Date              },
                      { label: 'Designer Assigned',   date: selected.designer_Assgined_DT   },
                      { label: 'CAD Uploaded',        date: selected.cadUploadDate          },
                      { label: 'Design Confirmed',    date: selected.designConfirmedDate    },
                      { label: 'You Approved',        date: selected.customerConfirmedDate  },
                      { label: 'Sent to Production',  date: selected.assignedDevelopmentDate},
                      { label: 'Completed',           date: selected.completedDate          },
                    ].map(step => (
                      <div key={step.label}
                        className={`px-3 py-2 rounded border ${step.date ? 'border-success bg-success bg-opacity-10' : 'border-light text-muted'}`}
                        style={{ fontSize: '0.8rem', minWidth: 120 }}>
                        <div className={`fw-semibold ${step.date ? 'text-success' : ''}`}>
                          {step.date ? '✓ ' : '○ '}{step.label}
                        </div>
                        {step.date && <div style={{ fontSize: '0.72rem' }}>{new Date(step.date).toLocaleDateString('en-IN')}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {(selected.frontImage || selected.topImage || selected.sideImage || selected.backImage || selected.cadImage) && (
                  <div>
                    <div className="fw-semibold mb-2 small text-muted text-uppercase">Images</div>
                    <div className="d-flex flex-wrap gap-2">
                      {[['frontImage', 'Front'], ['topImage', 'Top'], ['sideImage', 'Side'], ['backImage', 'Back']].map(([f, l]) =>
                        selected[f] && (
                          <div key={f} className="text-center">
                            <img src={imgUrl(selected[f])} alt={l} className="img-thumb"
                              onClick={() => setImgViewer(imgUrl(selected[f]))} />
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>{l}</div>
                          </div>
                        )
                      )}
                      {selected.cadImage && (
                        <div className="text-center">
                          <img src={imgUrl(selected.cadImage)} alt="CAD" className="img-thumb"
                            style={{ borderColor: '#7c3aed' }}
                            onClick={() => setImgViewer(imgUrl(selected.cadImage))} />
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>CAD Design</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                    Review &amp; Approve Design
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
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.9)', cursor: 'zoom-out' }}
          onClick={() => setImgViewer(null)}>
          <div className="modal-dialog modal-xl modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <img src={imgViewer} alt="Full view" className="img-fluid rounded shadow-lg"
              style={{ maxHeight: '90vh', margin: 'auto', display: 'block' }} />
          </div>
        </div>
      )}
      <OrderPrintModal orderId={printOrderId} onClose={() => setPrintOrderId(null)} />
    </div>
  );
};

export default OrderSearch;