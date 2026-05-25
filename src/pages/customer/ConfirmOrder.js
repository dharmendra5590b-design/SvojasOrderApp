import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders?status=customer_pending');
      setOrders(data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openOrder = async id => {
    const { data } = await api.get(`/orders/${id}`);
    setSelected(data);
    setAction(''); setReworkSpec(''); setNeedDiscuss(false);
  };

  const handleSubmit = async () => {
    if (!action) { toast.error('Please choose Confirm or Rework'); return; }
    if (action === 'rework' && !reworkSpec.trim() && !needDiscuss) {
      toast.error('Enter rework specification or tick "Need to Discuss"');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/orders/${selected._id}/customer-action`, {
        action,
        reworkSpecification: reworkSpec,
        needToDiscuss: needDiscuss,
      });
      toast.success(action === 'confirm' ? 'Order confirmed! 🎉' : 'Rework request sent');
      setSelected(null);
      load();
      if (action === 'confirm') navigate('/customer/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting response');
    } finally { setSubmitting(false); }
  };

  const imgUrl = fn => fn ? `http://localhost:5000/uploads/${fn}` : null;

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
        {/* Order list */}
        <div className={selected ? 'col-md-4' : 'col-12'}>
          {orders.map(o => (
            <div key={o._id}
              className={`card mb-2 cursor-pointer ${selected?._id === o._id ? 'border-primary' : ''}`}
              style={{ cursor: 'pointer', borderWidth: selected?._id === o._id ? 2 : 1 }}
              onClick={() => openOrder(o._id)}>
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-bold">{o.orderNumber}</div>
                    <div className="text-muted small">{o.design || '—'} · {o.kt || '—'}</div>
                    <div className="text-muted small">
                      Design confirmed: {o.designConfirmedDate
                        ? new Date(o.designConfirmedDate).toLocaleDateString('en-IN')
                        : '—'}
                    </div>
                  </div>
                  <span className="badge bg-warning text-dark">Awaiting You</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="col-md-8">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span className="fw-semibold">Order {selected.orderNumber}</span>
                <button className="btn-close" onClick={() => setSelected(null)} />
              </div>
              <div className="card-body">

                {/* Order specs summary */}
                <div className="row g-2 mb-3 p-3 rounded" style={{ background: '#f8f7ff' }}>
                  {[
                    ['Design',      selected.design      || '—'],
                    ['KT',          selected.kt          || '—'],
                    ['Type',        selected.type        || '—'],
                    ['Gold Colour', selected.goldColour  || '—'],
                    ['Size',        selected.size        || '—'],
                    ['Gold Weight', selected.goldWeight  ?? '—'],
                    ['Diamond Wt',  selected.diamondWeight ? `${selected.diamondWeight} ct` : '—'],
                    ['No. Stones',  selected.numberOfStones ?? '—'],
                  ].map(([k, v]) => (
                    <div className="col-6 col-md-3" key={k}>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{k}</div>
                      <div className="fw-semibold" style={{ fontSize: '0.88rem' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Your reference images */}
                {(selected.frontImage || selected.topImage || selected.sideImage || selected.backImage) && (
                  <div className="mb-3">
                    <div className="small fw-semibold text-muted text-uppercase mb-2">Your Reference Images</div>
                    <div className="d-flex gap-2 flex-wrap">
                      {[['frontImage','Front'],['topImage','Top'],['sideImage','Side'],['backImage','Back']].map(([f,l]) =>
                        selected[f] && (
                          <div key={f} className="text-center">
                            <img src={imgUrl(selected[f])} alt={l} className="img-thumb"
                              onClick={() => setImgViewer(imgUrl(selected[f]))} />
                            <div style={{ fontSize: '0.7rem' }} className="text-muted">{l}</div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* CAD design */}
                <div className="mb-4">
                  <div className="small fw-semibold text-muted text-uppercase mb-2">CAD Design by Designer</div>
                  {selected.cadImage
                    ? (
                      <div>
                        <img src={imgUrl(selected.cadImage)} alt="CAD design"
                          className="rounded shadow-sm"
                          style={{ maxHeight: 280, maxWidth: '100%', cursor: 'zoom-in', border: '2px solid #7c3aed' }}
                          onClick={() => setImgViewer(imgUrl(selected.cadImage))} />
                        <div className="text-muted small mt-1">Click image to enlarge</div>
                      </div>
                    )
                    : <div className="text-muted">No CAD image uploaded yet</div>
                  }
                </div>

                {/* Decision */}
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
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="needDiscuss"
                          checked={needDiscuss} onChange={e => setNeedDiscuss(e.target.checked)} />
                        <label className="form-check-label" htmlFor="needDiscuss">
                          Need to Discuss (team will reach out to you)
                        </label>
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
