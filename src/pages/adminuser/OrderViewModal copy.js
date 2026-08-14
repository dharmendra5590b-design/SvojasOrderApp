import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BASE_URL = 'https://api.jewelquote.in';
const imgUrl = (fn) => fn ? `${BASE_URL}/${fn}` : null;

const fmt = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-IN');
};

/* ── Sub-components ── */
const InfoRow = ({ label, value }) => (
  <div className="col-md-6 mb-2">
    <small className="text-muted d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</small>
    <div className="fw-semibold text-dark" style={{ fontSize: '0.92rem' }}>{value ?? '—'}</div>
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em',
    color: '#6c757d', fontWeight: 600, marginBottom: 10, paddingBottom: 6,
    borderBottom: '1px solid #e9ecef',
  }}>
    {children}
  </div>
);

const Badge = ({ order }) => {
  if (!order) return null;
  const { label, cls } =
    order.order_Status === 'Completed'
      ? { label: 'Completed', cls: 'bg-success' }
      : order.order_Status === 'Assigned To Production'
      ? { label: 'Assigned To Production', cls: 'bg-primary' }
      : order.order_Status === 'Order Confirmed'
      ? { label: 'Order Confirmed', cls: 'bg-secondary' }
      : order.order_Status === 'Design Approved'
      ? { label: 'Design Approved', cls: 'bg-info' }
      : order.order_Status === 'Design Uploaded'
      ? { label: 'Design Uploaded', cls: 'bg-warning text-dark' }
      : order.order_Status === 'Assigned To Designer'
      ? { label: 'Assigned To Designer', cls: 'bg-dark' }
      : { label: 'In Progress', cls: 'bg-light text-dark' };

  return (
    <span className={`badge rounded-pill px-3 py-2 ${cls}`} style={{ fontSize: '0.75rem' }}>
      {label}
    </span>
  );
};

/* ── Main Component ── */
const OrderViewModal = ({ orderId, onClose, onOrderUpdated }) => {
  const [order, setOrder]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [imgViewer, setImgViewer]         = useState(null);
  const [designers, setDesigners]         = useState([]);
  const [actionForm, setActionForm]       = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModal, setCancelModal]     = useState(false);
  const [cancelReason, setCancelReason]   = useState('');
  const [cancelAmount, setCancelAmount]   = useState('');
  const [redesignModal, setRedesignModal] = useState(false);
  const [redesignSpec, setRedesignSpec]   = useState('');
  const [redesignFile, setRedesignFile]   = useState(null);      // ← new
  const [redesignPreview, setRedesignPreview] = useState(null);  // ← new
  const fileInputRef = useRef(null);                             // ← new

  const { user } = useAuth();

  /* fetch order */
  const fetchOrder = useCallback(() => {
    if (!orderId) return;
    setLoading(true);
    setOrder(null);
    api.get(`${BASE_URL}/api/order/GetOrderView?orderID=${orderId}`)
      .then(r => setOrder(r.data[0]))
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => { fetchOrder(); setActionForm({}); }, [fetchOrder]);

  /* fetch designers */
  useEffect(() => {
    api.get(BASE_URL + '/api/customer/getdesigner').then(r => setDesigners(r.data)).catch(() => {});
  }, []);

  /* ESC to close */
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  if (!orderId) return null;

  const refresh = () => { fetchOrder(); onOrderUpdated && onOrderUpdated(); };

  /* ── handle redesign image pick ── */
  const handleRedesignFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { toast.error('Please select a valid image file (JPG, PNG, WEBP)'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return; }
    setRedesignFile(file);
    setRedesignPreview(URL.createObjectURL(file));
  };

  const clearRedesignFile = () => {
    setRedesignFile(null);
    if (redesignPreview) URL.revokeObjectURL(redesignPreview);
    setRedesignPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeRedesignModal = () => {
    setRedesignModal(false);
    setRedesignSpec('');
    clearRedesignFile();
  };

  /* ── Actions ── */
  const assignDesigner = async () => {
    if (!actionForm.designerId) { toast.error('Select a designer'); return; }
    setActionLoading(true);
    try {
      const { data } = await api.post(`${BASE_URL}/api/order/AssignDesigner`, {
        order_ID:            orderId,
        designer_ID:         actionForm.designerId,
        admin_Specification: actionForm.designSpecification || '',
        is_High_Priority:    actionForm.is_High_Priority || false,
        design_Expected_DT:  actionForm.design_Expected_DT || null,
      });
      if (data.statusCode === 1) { toast.success('Assigned to designer'); refresh(); onClose(); }
      else { toast.error(data.message); }
    } catch { toast.error('Error assigning designer'); } finally { setActionLoading(false); }
  };

  const confirmDesign = async () => {
    if (!actionForm.designer_Diamond_Weight && !actionForm.skipDiamond) {
      toast.error('Enter diamond weight or check "No Diamonds"'); return;
    }
    setActionLoading(true);
    try {
      const { data } = await api.post(`${BASE_URL}/api/order/OrderDesignApprove`, {
        order_ID:               orderId,
        designer_Weight:        actionForm.designer_Weight,
        designer_Diamond_Weight: actionForm.designer_Diamond_Weight || '',
        designer_NoOf_Diamonds: actionForm.designer_NoOf_Diamonds || '',
      });
      if (data.statusCode === 1) { toast.success('Design confirmed, customer notified'); refresh(); onClose(); }
      else { toast.error(data.message); }
    } catch { toast.error('Error confirming design'); } finally { setActionLoading(false); }
  };

  const requestRedesign = async () => {
    if (!redesignSpec.trim()) { toast.error('Enter redesign specification'); return; }
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('order_ID', orderId);
      formData.append('specification', redesignSpec);
      formData.append('user_ID', user.user_ID);
      if (redesignFile) formData.append('cADImage', redesignFile);

      const { data } = await api.post(
        `${BASE_URL}/api/order/OrderReworkDtl`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (data.statusCode === 1) {
        toast.success('Redesign requested');
        closeRedesignModal();
        refresh();
      } else {
        toast.error(data.message);
      }
    } catch { toast.error('Error requesting redesign'); } finally { setActionLoading(false); }
  };

  const assignDevelopment = async () => {
    setActionLoading(true);
    try {
      await api.post(`/orders/${orderId}/assign-development`, actionForm);
      toast.success('Assigned to development team'); refresh();
    } catch { toast.error('Error assigning to development'); } finally { setActionLoading(false); }
  };

  const completeOrder = async () => {
    if (!actionForm.final_Gross_Weight) { toast.error('Final Gross Weight is required'); return; }
    if (!actionForm.billAmount)         { toast.error('Bill Amount is required'); return; }
    setActionLoading(true);
    try {
      await api.post(`/orders/${orderId}/complete`, actionForm);
      toast.success('Order marked as completed!'); refresh();
    } catch { toast.error('Error completing order'); } finally { setActionLoading(false); }
  };

  const cancelOrder = async () => {
    if (!cancelReason.trim()) { toast.error('Cancel reason is required'); return; }
    if (!cancelAmount)        { toast.error('Cancel amount is required'); return; }
    setActionLoading(true);
    try {
      const { data } = await api.post(BASE_URL + '/api/order/cancelorder', {
        order_ID: orderId, user_ID: user.user_ID,
        cancel_Reason: cancelReason, cancelation_Charge: cancelAmount,
      });
      if (data.statusCode === 1) {
        toast.success('Order cancelled'); setCancelModal(false); setCancelReason(''); setCancelAmount('');
        onClose(); onOrderUpdated && onOrderUpdated();
      } else { toast.error(data.message); }
    } catch (e) { console.log(e); toast.error('Error cancelling order'); } finally { setActionLoading(false); }
  };

  /* ── Action Panel ── */
  const renderActionPanel = () => {
    if (!order || order.order_Status === 'Completed') return null;

    /* Step 1 — Pending → Assign Designer */
    if (order.Order_Status === 'Pending') {
      return (
        <div className="card border-0 bg-light mt-2">
          <div className="card-body">
            <SectionLabel>Assign to Designer</SectionLabel>
            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Designer *</label>
                <select className="form-select form-select-sm" value={actionForm.designerId || ''}
                  onChange={e => setActionForm({ ...actionForm, designerId: e.target.value })}>
                  <option value="">Select Designer</option>
                  {designers.map(d => (
                    <option key={d.designer_ID} value={d.designer_ID}>{d.designer_Name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Design Expected Date</label>
                <input type="date" className="form-control form-control-sm"
                  value={actionForm.design_Expected_DT || ''}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setActionForm({ ...actionForm, design_Expected_DT: e.target.value })} />
              </div>
              <div className="col-12">
                <div
                  onClick={() => setActionForm({ ...actionForm, is_High_Priority: !actionForm.is_High_Priority })}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '7px 14px', borderRadius: 8, cursor: 'pointer', userSelect: 'none',
                    border: `1.5px solid ${actionForm.is_High_Priority ? '#dc3545' : '#dee2e6'}`,
                    background: actionForm.is_High_Priority ? '#fff5f5' : '#fff',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                    background: actionForm.is_High_Priority ? '#dc3545' : '#ced4da',
                    position: 'relative', transition: 'background 0.2s',
                  }}>
                    <div style={{
                      position: 'absolute', top: 2,
                      left: actionForm.is_High_Priority ? 18 : 2,
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#fff', transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: actionForm.is_High_Priority ? '#dc3545' : '#6c757d' }}>
                    {actionForm.is_High_Priority ? '🔴 High Priority' : 'High Priority'}
                  </span>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Design Specification</label>
                <textarea className="form-control form-control-sm" rows={2}
                  value={actionForm.designSpecification || ''}
                  onChange={e => setActionForm({ ...actionForm, designSpecification: e.target.value })} />
              </div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-primary" onClick={assignDesigner} disabled={actionLoading}>
                {actionLoading ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                Assign
              </button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => setCancelModal(true)}>Cancel Order</button>
            </div>
          </div>
        </div>
      );
    }

    /* Step 2 — Design Uploaded → Review CAD */
    if (order.order_Status === 'Design Uploaded') {
      return (
        <div className="card border-0 bg-light mt-2">
          <div className="card-body">
            <SectionLabel>Review CAD Design</SectionLabel>
            <div className="row g-2 mb-3">
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Designer Weight</label>
                <input type="number" step="0.01" className="form-control form-control-sm"
                  value={actionForm.designer_Weight || ''}
                  onChange={e => setActionForm({ ...actionForm, designer_Weight: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Diamond Weight</label>
                <input type="number" step="0.001" className="form-control form-control-sm"
                  value={actionForm.designer_Diamond_Weight || ''}
                  onChange={e => setActionForm({ ...actionForm, designer_Diamond_Weight: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">No. of Diamonds</label>
                <input type="text" className="form-control form-control-sm"
                  value={actionForm.designer_NoOf_Diamonds || ''}
                  onChange={e => setActionForm({ ...actionForm, designer_NoOf_Diamonds: e.target.value })} />
              </div>
              <div className="col-12 d-flex align-items-center gap-2">
                <input type="checkbox" className="form-check-input" id="skipDiamond"
                  checked={!!actionForm.skipDiamond}
                  onChange={e => setActionForm({ ...actionForm, skipDiamond: e.target.checked })} />
                <label className="form-check-label small" htmlFor="skipDiamond">No Diamonds in this design</label>
              </div>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-sm btn-success" onClick={confirmDesign} disabled={actionLoading}>
                {actionLoading ? <span className="spinner-border spinner-border-sm me-1" /> : '✅ '}
                Confirm Design
              </button>
              <button className="btn btn-sm btn-warning" onClick={() => setRedesignModal(true)} disabled={actionLoading}>
                🔄 Request Redesign
              </button>
              <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => setCancelModal(true)}>Cancel Order</button>
            </div>
          </div>
        </div>
      );
    }

    /* Step 3 — Design Approved → waiting for customer */
    if (order.order_Status === 'Design Approved') {
      return (
        <div className="alert alert-info py-2 mt-2 mb-0">
          <small>⏳ Waiting for <strong>customer confirmation</strong>. No action required.</small>
        </div>
      );
    }

    /* Step 4 — Order Confirmed → Assign to Development */
    if (order.order_Status === 'Order Confirmed') {
      return (
        <div className="card border-0 bg-light mt-2">
          <div className="card-body">
            <SectionLabel>Assign to Development</SectionLabel>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Team Email</label>
              <input type="email" className="form-control form-control-sm"
                value={actionForm.teamEmail || ''}
                onChange={e => setActionForm({ ...actionForm, teamEmail: e.target.value })} />
            </div>
            <button className="btn btn-sm btn-primary" onClick={assignDevelopment} disabled={actionLoading}>
              {actionLoading ? <span className="spinner-border spinner-border-sm me-1" /> : null}
              Assign to Development Team
            </button>
          </div>
        </div>
      );
    }

    /* Step 5 — Assigned to Production → Complete Order */
    if (order.order_Status === 'Assigned To Production') {
      return (
        <div className="card border-0 bg-light mt-2">
          <div className="card-body">
            <SectionLabel>Complete Order</SectionLabel>
            <div className="row g-2 mb-3">
              {[
                { key: 'final_Gross_Weight',  label: 'Final Gross Weight *' },
                { key: 'final_Net_Weight',     label: 'Final Net Weight' },
                { key: 'final_Diamond_Weight', label: 'Final Diamond Weight' },
                { key: 'final_Noof_Diamonds',  label: 'No. of Diamonds' },
                { key: 'billAmount',           label: 'Bill Amount *' },
                { key: 'gold24ktWeight',       label: '24kt Gold Weight (Ledger)' },
              ].map(f => (
                <div className="col-md-4" key={f.key}>
                  <label className="form-label small fw-semibold">{f.label}</label>
                  <input type="number" step="0.001" className="form-control form-control-sm"
                    value={actionForm[f.key] || ''}
                    onChange={e => setActionForm({ ...actionForm, [f.key]: e.target.value })} />
                </div>
              ))}
            </div>
            <button className="btn btn-sm btn-success" onClick={completeOrder} disabled={actionLoading}>
              {actionLoading ? <span className="spinner-border spinner-border-sm me-1" /> : null}
              Mark as Completed
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  const imageFields = [
    { key: 'front_Image_URL', label: 'Front' },
    { key: 'top_Image_URL',   label: 'Top'   },
    { key: 'side_Image_URL',  label: 'Side'  },
    { key: 'back_Image_URL',  label: 'Back'  },
  ];

  return (
    <>
      {/* ── Backdrop ── */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)', zIndex: 1050,
      }} />

      {/* ── Modal Panel ── */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(860px, 96vw)', maxHeight: '92vh',
        background: '#fff', borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        zIndex: 1051, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #e9ecef',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f8f9fb', flexShrink: 0,
        }}>
          <div>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6c757d' }}>Order Details</span>
            <h6 className="mb-0 fw-bold mt-1" style={{ fontSize: '1rem' }}>
              {order ? `#${order.order_Number || order.order_ID}` : `#${orderId}`}
            </h6>
          </div>
          <div className="d-flex align-items-center gap-3">
            <Badge order={order} />
            <button onClick={onClose} aria-label="Close" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6c757d', fontSize: '1.1rem',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#e9ecef'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="mt-2 text-muted small">Loading order…</div>
            </div>
          ) : !order ? (
            <div className="text-center py-5 text-muted">Failed to load order details.</div>
          ) : (
            <>
              {/* Order Information */}
              <div className="mb-4">
                <SectionLabel>Order Information</SectionLabel>
                <div className="row g-0">
                  <InfoRow label="Order Number"  value={order.order_Number} />
                  <InfoRow label="Order Date"    value={fmt(order.order_Date)} />
                  <InfoRow label="Delivery Date" value={fmt(order.delivery_Date)} />
                  <InfoRow label="Design"        value={order.design} />
                  <InfoRow label="Quantity"      value={order.quantity} />
                  <InfoRow label="Size"          value={order.size} />
                  {order.Is_High_Priority && (
                    <div className="col-12 mb-2">
                      <span className="badge bg-danger px-2 py-1" style={{ fontSize: '0.75rem' }}>🔴 High Priority</span>
                    </div>
                  )}
                  {order.design_Expected_DT && (
                    <InfoRow label="Design Expected By" value={fmt(order.design_Expected_DT)} />
                  )}
                </div>
              </div>

              {/* Metal Details */}
              <div className="mb-4">
                <SectionLabel>Metal Details</SectionLabel>
                <div className="row g-0">
                  <InfoRow label="Karat"         value={order.karat} />
                  <InfoRow label="Karat %"       value={order.karat_Percent} />
                  <InfoRow label="Design Type"   value={order.design_Type} />
                  <InfoRow label="Gold Colour"   value={order.gold_Colour} />
                  <InfoRow label="Weight (Est.)" value={order.weight} />
                </div>
              </div>

              {/* Stone & Diamond Details */}
              <div className="mb-4">
                <SectionLabel>Stone & Diamond Details</SectionLabel>
                <div className="row g-0">
                  <InfoRow label="Stone Name"              value={order.stone_Name} />
                  <InfoRow label="No. of Diamonds"         value={order.noOf_Diamonds} />
                  <InfoRow label="Diamond Weight"          value={order.diamond_Weight} />
                  <InfoRow label="Diamond Quality"         value={order.diamond_Quality} />
                  <InfoRow label="Colour Stone"            value={order.is_Colour_Required ? order.colour_Stone_Name : 'Not Required'} />
                  <InfoRow label="Colour Stone Wt."        value={order.colour_Stone} />
                  <InfoRow label="No. of Colour Stones"    value={order.noOfColour_Stone} />
                  <InfoRow label="Colour Stone Weight"     value={order.colourStone_Weight} />
                  <InfoRow label="Others Colour Stones"    value={order.others_NoOfColour_Stone} />
                  <InfoRow label="Others Colour Stone Wt." value={order.others_Colour_Stone_Weight} />
                </div>
              </div>

              {/* Certificate */}
              {order.is_Certificate_Required && (
                <div className="mb-4">
                  <SectionLabel>Certificate</SectionLabel>
                  <div className="row g-0">
                    <InfoRow label="Certificate Required" value="Yes" />
                    <InfoRow label="Certificate Name"     value={order.cretificate_Name} />
                  </div>
                </div>
              )}

              {/* Specification */}
              {order.specification && (
                <div className="mb-4">
                  <SectionLabel>Specification</SectionLabel>
                  <div className="alert alert-info py-2 mb-0">
                    <small>{order.specification}</small>
                  </div>
                </div>
              )}

              {/* Designer Details */}
              {(order.designer_Weight || order.designer_Diamond_Weight || order.designer_NoOf_Diamonds) && (
                <div className="mb-4">
                  <SectionLabel>Designer Details</SectionLabel>
                  <div className="row g-0">
                    <InfoRow label="Designer Weight"          value={order.designer_Weight} />
                    <InfoRow label="Designer Diamond Weight"  value={order.designer_Diamond_Weight} />
                    <InfoRow label="Designer No. of Diamonds" value={order.designer_NoOf_Diamonds} />
                  </div>
                </div>
              )}

              {/* Completion Details */}
              {(order.final_Gross_Weight || order.final_Net_Weight || order.order_Complete_DT) && (
                <div className="mb-4">
                  <SectionLabel>Completion Details</SectionLabel>
                  <div className="row g-0">
                    <InfoRow label="Final Gross Weight"    value={order.final_Gross_Weight} />
                    <InfoRow label="Final Net Weight"      value={order.final_Net_Weight} />
                    <InfoRow label="Final Diamond Weight"  value={order.final_Diamond_Weight} />
                    <InfoRow label="Final No. of Diamonds" value={order.final_Noof_Diamonds} />
                    <InfoRow label="Completed On"          value={fmt(order.order_Complete_DT)} />
                  </div>
                </div>
              )}

              {/* CAD Image */}
              {order.caD_Image_URL && (
                <div className="mb-4">
                  <SectionLabel>CAD Design</SectionLabel>
                  <img src={imgUrl(order.caD_Image_URL)} alt="CAD Design" className="rounded"
                    style={{ maxHeight: 200, cursor: 'zoom-in', objectFit: 'contain', border: '1px solid #e9ecef' }}
                    onClick={() => setImgViewer(imgUrl(order.caD_Image_URL))} />
                </div>
              )}

              {/* Customer Images */}
              {imageFields.some(f => order[f.key]) && (
                <div className="mb-4">
                  <SectionLabel>Customer Images</SectionLabel>
                  <div className="d-flex gap-2 flex-wrap">
                    {imageFields.map(({ key, label }) => order[key] ? (
                      <div key={key} style={{ position: 'relative' }}>
                        <img src={imgUrl(order[key])} alt={label}
                          onClick={() => setImgViewer(imgUrl(order[key]))}
                          style={{
                            width: 90, height: 90, objectFit: 'cover', borderRadius: 10,
                            cursor: 'zoom-in', border: '2px solid #e9ecef', transition: 'border-color 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#0d6efd'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = '#e9ecef'}
                        />
                        <span style={{
                          position: 'absolute', bottom: 4, left: 4,
                          background: 'rgba(0,0,0,0.55)', color: '#fff',
                          fontSize: '0.62rem', borderRadius: 4, padding: '1px 5px',
                        }}>{label}</span>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              {/* Action Panel */}
              {renderActionPanel()}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px', borderTop: '1px solid #e9ecef',
          background: '#f8f9fb', display: 'flex', justifyContent: 'flex-end', flexShrink: 0,
        }}>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>

      {/* ── Full-size Image Viewer ── */}
      {imgViewer && (
        <div onClick={() => setImgViewer(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
          zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
        }}>
          <img src={imgViewer} alt="Full view" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 8 }} />
        </div>
      )}

      {/* ── Redesign Spec Modal ── */}
      {redesignModal && (
        <div className="modal show d-block" style={{ zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
            <div className="modal-content">
              <div className="modal-header py-2">
                <h6 className="modal-title mb-0">🔄 Request Redesign</h6>
                <button className="btn-close btn-sm" onClick={closeRedesignModal} />
              </div>

              <div className="modal-body">
                {/* Specification */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Redesign Specification *</label>
                  <textarea className="form-control form-control-sm" rows={4} value={redesignSpec}
                    onChange={e => setRedesignSpec(e.target.value)}
                    placeholder="Describe the changes required…" />
                </div>

                {/* CAD Image Upload */}
                <div>
                  <label className="form-label small fw-semibold">Reference CAD Image <span className="text-muted fw-normal">(optional)</span></label>

                  {/* Drop zone / pick button */}
                  {!redesignPreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: '2px dashed #ced4da', borderRadius: 10,
                        padding: '20px 16px', textAlign: 'center',
                        cursor: 'pointer', background: '#fafafa',
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d6efd'; e.currentTarget.style.background = '#f0f5ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#ced4da'; e.currentTarget.style.background = '#fafafa'; }}
                    >
                      <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>🖼️</div>
                      <div className="small text-muted">Click to upload CAD image</div>
                      <div style={{ fontSize: '0.7rem', color: '#adb5bd', marginTop: 2 }}>JPG, PNG, WEBP · max 10 MB</div>
                    </div>
                  ) : (
                    /* Preview */
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={redesignPreview}
                        alt="CAD preview"
                        style={{
                          width: '100%', maxHeight: 200, objectFit: 'contain',
                          borderRadius: 10, border: '1.5px solid #dee2e6',
                          cursor: 'zoom-in',
                        }}
                        onClick={() => setImgViewer(redesignPreview)}
                      />
                      {/* Remove button */}
                      <button
                        onClick={clearRedesignFile}
                        title="Remove image"
                        style={{
                          position: 'absolute', top: 6, right: 6,
                          background: 'rgba(220,53,69,0.9)', border: 'none',
                          borderRadius: '50%', width: 24, height: 24,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: '#fff', fontSize: '0.75rem', lineHeight: 1,
                        }}
                      >✕</button>
                      {/* Re-pick link */}
                      <div className="mt-1">
                        <span
                          className="small text-primary"
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change image
                        </span>
                        <span className="small text-muted ms-2">{redesignFile?.name}</span>
                      </div>
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={handleRedesignFile}
                  />
                </div>
              </div>

              <div className="modal-footer py-2">
                <button className="btn btn-secondary btn-sm" onClick={closeRedesignModal}>Cancel</button>
                <button className="btn btn-warning btn-sm" onClick={requestRedesign} disabled={actionLoading}>
                  {actionLoading ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Order Modal ── */}
      {cancelModal && (
        <div className="modal show d-block" style={{ zIndex: 1070 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header py-2">
                <h6 className="modal-title mb-0">Cancel Order</h6>
                <button className="btn-close btn-sm" onClick={() => setCancelModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Cancel Amount *</label>
                  <input type="number" step="0.01" className="form-control form-control-sm"
                    value={cancelAmount} onChange={e => setCancelAmount(e.target.value)} placeholder="Enter amount" />
                </div>
                <div>
                  <label className="form-label small fw-semibold">Cancel Reason *</label>
                  <textarea className="form-control form-control-sm" rows={3} value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)} placeholder="Required" />
                </div>
              </div>
              <div className="modal-footer py-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setCancelModal(false)}>Back</button>
                <button className="btn btn-danger btn-sm" onClick={cancelOrder} disabled={actionLoading}>
                  {actionLoading ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderViewModal;