import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
const BASE_URL = 'https://api.jewelquote.in';
const ConfirmOrder = () => {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [action,  setAction]  = useState(''); // 'confirm' | 'rework'
  const [reworkSpec, setReworkSpec] = useState('');
  const [needDiscuss, setNeedDiscuss] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imgViewer,  setImgViewer]  = useState(null);
  const navigate = useNavigate();
const { user } = useAuth();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(BASE_URL+'/api/order/GetPendingOrderConfirmation?customerID='+user.entity_ID );
      setOrders(data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openOrder = async id => {
    const { data } = await api.get(`${BASE_URL}/api/order/GetOrderView?orderID=${id}`);
    setSelected(data[0]);
    setAction(''); setReworkSpec(''); setNeedDiscuss(false);
  };

  const handleSubmit = async () => {
    if (!action) { toast.error('Please choose Confirm or Rework'); return; }
    if (action === 'rework' && !reworkSpec.trim()) {
      toast.error('Enter rework specification');
      return;
    }
    setSubmitting(true);
    try {
    const {data}=  await api.post(`${BASE_URL}/api/order/CustomerOrderConfirm`, {
        action_Type:action.toLocaleUpperCase(),
        rework_Specification: reworkSpec,
        order_ID:selected.order_ID
      });
      if(data.statusCode===1)
      {
      toast.success(action === 'confirm' ? 'Order confirmed! 🎉' : 'Rework request sent');
      setSelected(null);
      load();
      }
      else
      {
         toast.error(data?.message || 'Error submitting response');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting response');
    } finally { setSubmitting(false); }
  };

  // Image URL built from BASE_URL + relative path returned by API
  const imgUrl = url => url ? `${BASE_URL}/${url}` : null;

  /* ─── empty state ─── */
  if (!loading && orders.length === 0) {
    return (
      <div>
        <h5 className="fw-bold mb-4">Confirm Design</h5>
        <div className="card">
          <div className="card-body text-center py-5">
            <div style={{ fontSize: 56 }}>🎨</div>
            <h6 className="mt-3 text-muted">No orders awaiting your approval right now</h6>
            <p className="text-muted small">You'll be notified via WhatsApp once a design is ready for review.</p>
            <button className="btn btn-outline-primary" onClick={() => navigate('/customer/orders')}>
              View All Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h5 className="fw-bold mb-1">Confirm Design</h5>
      <p className="text-muted small mb-4">Review the CAD design prepared by our designer and either confirm or request changes.</p>

      {loading && <div className="text-center py-4"><span className="spinner-border text-primary" /></div>}

      <div className="row g-3">
        {/* Order list — unchanged */}
        <div className={selected ? 'col-md-4' : 'col-12'}>
          {orders.map(o => (
            <div
              key={o.order_ID}
              className={`card mb-2 cursor-pointer ${selected?.order_ID === o.order_ID ? 'border-primary' : ''}`}
              style={{ cursor: 'pointer', borderWidth: selected?.order_ID === o.order_ID ? 2 : 1 }}
              onClick={() => openOrder(o.order_ID)}
            >
              <div className="card-body">
                <div className="row align-items-center">

                  <div className="col-md-4">
                    <h6 className="mb-1 fw-bold">{o.order_Number}</h6>
                    <div>{o.customer_Name}</div>
                  </div>

                  <div className="col-md-3">
                    <div><strong>Design:</strong> {o.design || '—'}</div>
                    <div><strong>Type:</strong> {o.order_Type || '—'}</div>
                  </div>

                  <div className="col-md-2">
                    <div><strong>Qty:</strong> {o.quantity || '—'}</div>
                    <div>
                      {o.is_High_Priority ? (
                        <span className="badge bg-danger">High</span>
                      ) : (
                        <span className="badge bg-secondary">Normal</span>
                      )}
                    </div>
                  </div>

                  <div className="col-md-3 text-md-end">
                    <div>
                      <strong>Upload:</strong><br />
                      {o.design_Upload_DT ? new Date(o.design_Upload_DT).toLocaleDateString('en-IN') : '—'}
                    </div>
                    <div>
                      <strong>Approved:</strong><br />
                      {o.design_Approved_DT ? new Date(o.design_Approved_DT).toLocaleDateString('en-IN') : 'Pending'}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Detail panel ── */}
        {selected && (
          <div className="col-md-8">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span className="fw-semibold">
                  Order {selected.order_Number || `#${selected.order_ID}`}
                  {/* NEW: order status badge */}
                  {selected.order_Status && (
                    <span className={`badge ms-2 ${selected.is_Design_Approved ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {selected.order_Status}
                    </span>
                  )}
                </span>
                <button className="btn-close" onClick={() => setSelected(null)} />
              </div>
              <div className="card-body">

                {/* Order specs — fixed property keys */}
                <div className="row g-2 mb-3 p-3 rounded" style={{ background: '#f8f7ff' }}>
                  {[
                    ['Design',          selected.design          || '—'],
                    ['Karat',           selected.karat           || '—'],          // was: selected.kt
                    ['Type',            selected.design_Type     || '—'],          // was: selected.type
                    ['Gold Colour',     selected.gold_Colour     || '—'],          // was: selected.goldColour
                    ['Size',            selected.size            || '—'],
                    ['Weight',          selected.weight ? `${selected.weight} g` : '—'], // was: selected.goldWeight
                    ['Stone',           selected.stone_Name      || '—'],          // NEW
                    ['Diamond Quality', selected.diamond_Quality || '—'],          // NEW
                    ['Diamond Wt',      selected.diamond_Weight ? `${selected.diamond_Weight} ct` : '—'], // was: selected.diamondWeight
                    ['No. Diamonds',    selected.noOf_Diamonds   ?? '—'],          // was: selected.numberOfStones
                    ['Order Date',      selected.order_Date      || '—'],          // NEW
                    ['Expected Delivery Date',   selected.delivery_Date
                                          ? new Date(selected.delivery_Date).toLocaleDateString('en-IN')
                                          : '—'],  
                  ['Committed Date',   selected.committed_Date
                                          ? new Date(selected.committed_Date).toLocaleDateString('en-IN')
                                          : '—'],                                     // NEW
                  ].map(([k, v]) => (
                    <div className="col-6 col-md-3" key={k}>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{k}</div>
                      <div className="fw-semibold" style={{ fontSize: '0.88rem' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* NEW: Colour stone & certificate badges */}
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {selected.is_Colour_Required && (
                    <span className="badge bg-info text-dark">
                      Colour Stone: {selected.colour_Stone_Name || '—'}
                    </span>
                  )}
                  {selected.is_Certificate_Required && (
                    <span className="badge bg-secondary">
                      Certificate: {selected.cretificate_Name || 'Required'}
                    </span>
                  )}
                </div>
<div className="row g-4">

  {/* Left Side */}
  <div className={selected.caD_Image_URL ? "col-lg-7" : "col-12"}>

    {/* Customer Specification & Admin Note */}
    {(selected.specification || selected.adminSpecification) && (
      <div className="mb-3">
        {selected.specification && (
          <div className="alert alert-light border py-2 mb-2">
            <div className="small fw-semibold text-muted text-uppercase mb-1">
              Customer Specification
            </div>
            <div style={{ fontSize: "0.9rem" }}>
              {selected.specification}
            </div>
          </div>
        )}

        {selected.adminSpecification && (
          <div className="alert alert-warning py-2 mb-0">
            <div className="small fw-semibold text-uppercase mb-1">
              Admin Note
            </div>
            <div style={{ fontSize: "0.9rem" }}>
              {selected.adminSpecification}
            </div>
          </div>
        )}
      </div>
    )}

    {/* Reference Images */}
    {(selected.front_Image_URL ||
      selected.top_Image_URL ||
      selected.side_Image_URL ||
      selected.back_Image_URL) && (
      <div className="mb-3">
        <div className="small fw-semibold text-muted text-uppercase mb-2">
          Your Reference Images
        </div>

        <div className="d-flex flex-wrap gap-2">
          {[
            ["front_Image_URL", "Front"],
            ["top_Image_URL", "Top"],
            ["side_Image_URL", "Side"],
            ["back_Image_URL", "Back"],
          ].map(
            ([f, l]) =>
              selected[f] && (
                <div key={f} className="text-center">
                  <img
                    src={imgUrl(selected[f])}
                    alt={l}
                    className="rounded"
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      cursor: "zoom-in",
                      border: "1px solid #dee2e6",
                    }}
                    onClick={() =>
                      setImgViewer(imgUrl(selected[f]))
                    }
                  />
                  <div
                    className="text-muted"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {l}
                  </div>
                </div>
              )
          )}
        </div>
      </div>
    )}

  </div>

  {/* Right Side - CAD */}
  <div className={selected.caD_Image_URL ? "col-lg-5" : "col-12"}>
    <div className="small fw-semibold text-muted text-uppercase mb-2">
      CAD Design by Designer
    </div>

    {selected.caD_Image_URL ? (
      <div className="text-center">
        <img
          src={imgUrl(selected.caD_Image_URL)}
          alt="CAD Design"
          className="img-fluid rounded shadow-sm"
          style={{
            maxHeight: 320,
            border: "2px solid #7c3aed",
            cursor: "zoom-in",
          }}
          onClick={() =>
            setImgViewer(imgUrl(selected.caD_Image_URL))
          }
        />
        <div className="text-muted small mt-1">
          Click image to enlarge
        </div>
      </div>
    ) : (
      <div className="text-muted">
        No CAD image uploaded yet
      </div>
    )}
  </div>

</div>
{/* NEW: Designer estimates */}
                {(selected.designer_Weight || selected.designer_Diamond_Weight || selected.designer_NoOf_Diamonds) && (
                  <div className="mb-3 p-3 rounded border" style={{ background: '#fff8f0' }}>
                    <div className="small fw-semibold text-muted text-uppercase mb-2">Designer Estimates</div>
                    <div className="row g-2">
                      {[
                        ['Est. Weight',       selected.designer_Weight         ? `${selected.designer_Weight} g`        : '—'],
                        ['Est. Diamond Wt',   selected.designer_Diamond_Weight ? `${selected.designer_Diamond_Weight} ct` : '—'],
                        ['Est. No. Diamonds', selected.designer_NoOf_Diamonds  || '—'],
                      ].map(([k, v]) => (
                        <div className="col-4" key={k}>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{k}</div>
                          <div className="fw-semibold" style={{ fontSize: '0.88rem' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
               

                {/* Decision — unchanged */}
                <div className="border rounded p-3">
                  <div className="fw-semibold mb-3">Your Decision</div>

                  <div className="d-flex gap-3 mb-3">
                    <div
                      className={`flex-fill p-3 rounded border text-center ${action === 'confirm' ? 'border-success bg-success bg-opacity-10' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setAction('confirm')}>
                      <div style={{ fontSize: 32 }}>✅</div>
                      <div className="fw-semibold mt-1">Confirm Design</div>
                      <div className="text-muted small">I'm happy with this design</div>
                    </div>
                    <div
                      className={`flex-fill p-3 rounded border text-center ${action === 'rework' ? 'border-warning bg-warning bg-opacity-10' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setAction('rework')}>
                      <div style={{ fontSize: 32 }}>🔄</div>
                      <div className="fw-semibold mt-1">Request Changes</div>
                      <div className="text-muted small">I need modifications</div>
                    </div>
                  </div>

                  {action === 'rework' && (
                    <div className="mt-3">
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Rework Specification</label>
                        <textarea className="form-control" rows={3}
                          placeholder="Describe the changes you need…"
                          value={reworkSpec}
                          onChange={e => setReworkSpec(e.target.value)} />
                      </div>
                      
                    </div>
                  )}

                  {action && (
                    <button
                      className={`btn mt-3 ${action === 'confirm' ? 'btn-success' : 'btn-warning'}`}
                      onClick={handleSubmit}
                      disabled={submitting}>
                      {submitting
                        ? <><span className="spinner-border spinner-border-sm me-2" />Submitting…</>
                        : action === 'confirm' ? 'Confirm & Proceed' : 'Send Rework Request'
                      }
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full-screen image viewer */}
      {imgViewer && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.9)', cursor: 'zoom-out' }}
          onClick={() => setImgViewer(null)}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <img src={imgViewer} alt="Full view" className="img-fluid rounded"
              style={{ maxHeight: '92vh', margin: 'auto', display: 'block' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmOrder;