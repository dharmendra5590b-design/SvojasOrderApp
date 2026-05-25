import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const DesignerDashboard = () => {
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [cadFile,   setCadFile]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imgViewer, setImgViewer] = useState(null);
  const [tab,       setTab]       = useState('pending'); // 'pending' | 'done'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, done] = await Promise.all([
        api.get('/orders?status=design_pending'),
        api.get('/orders?status=design_uploaded'),
      ]);
      setOrders({ pending: pending.data, done: done.data });
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openOrder = async id => {
    const { data } = await api.get(`/orders/${id}`);
    setSelected(data); setCadFile(null);
  };

  const handleUpload = async () => {
    if (!cadFile) { toast.error('Please select a CAD image file'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('cadImage', cadFile);
      await api.post(`/orders/${selected._id}/upload-cad`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('CAD design uploaded successfully!');
      setCadFile(null); setSelected(null); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const imgUrl = fn => fn ? `http://localhost:5000/uploads/${fn}` : null;

  const displayOrders = (orders[tab] || []);

  return (
    <div>
      <h5 className="fw-bold mb-1">My Design Tasks</h5>
      <p className="text-muted small mb-4">View your assigned orders, download reference images, and upload CAD designs.</p>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'pending' ? 'active' : ''}`} onClick={() => { setTab('pending'); setSelected(null); }}>
            Pending CAD Upload
            {orders.pending?.length > 0 && (
              <span className="badge bg-danger ms-2">{orders.pending.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'done' ? 'active' : ''}`} onClick={() => { setTab('done'); setSelected(null); }}>
            CAD Uploaded
            {orders.done?.length > 0 && (
              <span className="badge bg-success ms-2">{orders.done.length}</span>
            )}
          </button>
        </li>
      </ul>

      {loading && <div className="text-center py-4"><span className="spinner-border text-primary" /></div>}

      {!loading && displayOrders.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-5">
            <div style={{ fontSize: 52 }}>{tab === 'pending' ? '🎨' : '✅'}</div>
            <h6 className="mt-3 text-muted">
              {tab === 'pending' ? 'No pending design tasks' : 'No completed uploads yet'}
            </h6>
          </div>
        </div>
      )}

      <div className="row g-3">
        {/* Order list */}
        <div className={selected ? 'col-md-5' : 'col-12'}>
          {!loading && displayOrders.map(o => (
            <div key={o._id}
              className={`card mb-2 ${selected?._id === o._id ? 'border-primary' : ''}`}
              style={{ cursor: 'pointer', borderWidth: selected?._id === o._id ? 2 : 1 }}
              onClick={() => openOrder(o._id)}>
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-bold">{o.orderNumber}</div>
                    <div className="text-muted small">{o.customerId?.customerName}</div>
                    <div className="text-muted small">
                      {o.design || '—'} · {o.kt || '—'}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-muted small">{new Date(o.orderDate).toLocaleDateString('en-IN')}</div>
                    {o.assignedDate && (
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Assigned: {new Date(o.assignedDate).toLocaleDateString('en-IN')}
                      </div>
                    )}
                    {tab === 'done' && o.cadUploadDate && (
                      <div className="text-success" style={{ fontSize: '0.72rem' }}>
                        Uploaded: {new Date(o.cadUploadDate).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="col-md-7">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span className="fw-semibold">Order: {selected.orderNumber}</span>
                <button className="btn-close" onClick={() => setSelected(null)} />
              </div>
              <div className="card-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>

                {/* Customer info */}
                <div className="mb-3 p-3 rounded" style={{ background: '#f8f7ff' }}>
                  <div className="row g-2">
                    {[
                      ['Customer',   selected.customerId?.customerName],
                      ['Order Date', new Date(selected.orderDate).toLocaleDateString('en-IN')],
                      ['Design',     selected.design     || '—'],
                      ['KT',         selected.kt         || '—'],
                      ['Type',       selected.type       || '—'],
                      ['Gold Colour',selected.goldColour || '—'],
                      ['Size',       selected.size       || '—'],
                      ['Gold Weight',selected.goldWeight ?? '—'],
                      ['Stone',      selected.stone      || '—'],
                      ['Colour Stone Required', selected.colourStoneRequired ? (selected.colourStone || 'Yes') : 'No'],
                      ['Certificate Required',  selected.certificateRequired ? (selected.certificateType || 'Yes') : 'No'],
                      ['Delivery Date', selected.deliveryDate ? new Date(selected.deliveryDate).toLocaleDateString('en-IN') : '—'],
                    ].map(([k,v]) => (
                      <div className="col-6" key={k}>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{k}</div>
                        <div className="fw-semibold" style={{ fontSize: '0.88rem' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Design specification */}
                {selected.designSpecification && (
                  <div className="alert alert-info py-2 mb-3">
                    <div className="small fw-semibold mb-1">Design Specification from Admin:</div>
                    <div className="small">{selected.designSpecification}</div>
                  </div>
                )}

                {/* Redesign note */}
                {selected.redesignSpecification && (
                  <div className="alert alert-warning py-2 mb-3">
                    <div className="small fw-semibold mb-1">⚠️ Redesign Required:</div>
                    <div className="small">{selected.redesignSpecification}</div>
                  </div>
                )}

                {/* Reference images */}
                <div className="mb-3">
                  <div className="small fw-semibold text-muted text-uppercase mb-2">Reference Images</div>
                  <div className="d-flex flex-wrap gap-2">
                    {[['frontImage','Front'],['topImage','Top'],['sideImage','Side'],['backImage','Back']].map(([f,l]) =>
                      selected[f] && (
                        <div key={f} className="text-center">
                          <img src={imgUrl(selected[f])} alt={l} className="img-thumb"
                            onClick={() => setImgViewer(imgUrl(selected[f]))} />
                          <div style={{ fontSize: '0.7rem' }} className="text-muted">{l}</div>
                          <a href={imgUrl(selected[f])} download className="d-block text-primary" style={{ fontSize: '0.7rem' }}>
                            <i className="bi bi-download"></i> Download
                          </a>
                        </div>
                      )
                    )}
                    {!selected.frontImage && !selected.topImage && !selected.sideImage && !selected.backImage && (
                      <span className="text-muted small">No reference images provided</span>
                    )}
                  </div>
                </div>

                {/* Existing CAD */}
                {selected.cadImage && (
                  <div className="mb-3">
                    <div className="small fw-semibold text-muted text-uppercase mb-2">Uploaded CAD Design</div>
                    <img src={imgUrl(selected.cadImage)} alt="CAD"
                      className="rounded shadow-sm"
                      style={{ maxHeight: 200, maxWidth: '100%', cursor: 'zoom-in', border: '2px solid #7c3aed' }}
                      onClick={() => setImgViewer(imgUrl(selected.cadImage))} />
                  </div>
                )}

                {/* Upload panel – only for pending */}
                {tab === 'pending' && (
                  <div className="border rounded p-3 mt-2">
                    <div className="fw-semibold mb-2">
                      {selected.cadImage ? 'Replace CAD Design' : 'Upload CAD Design'}
                    </div>
                    <div className="mb-3">
                      <input type="file" className="form-control" accept="image/*"
                        onChange={e => setCadFile(e.target.files[0])} />
                      <div className="text-muted small mt-1">Accepted: JPG, PNG, WEBP (max 10 MB)</div>
                    </div>
                    {cadFile && (
                      <div className="mb-3">
                        <img src={URL.createObjectURL(cadFile)} alt="Preview"
                          className="rounded" style={{ maxHeight: 160, maxWidth: '100%' }} />
                      </div>
                    )}
                    <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !cadFile}>
                      {uploading
                        ? <><span className="spinner-border spinner-border-sm me-2" />Uploading…</>
                        : <><i className="bi bi-cloud-upload me-1"></i> Upload CAD</>
                      }
                    </button>
                  </div>
                )}
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

export default DesignerDashboard;
