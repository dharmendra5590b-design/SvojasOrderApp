import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext'
const BASE_URL = 'https://localhost:8081';

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-IN');
};

const imgUrl = (fn) => fn ? `${BASE_URL}/${fn}` : null;

const DesignerDashboard = () => {
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [cadFile,   setCadFile]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imgViewer, setImgViewer] = useState(null);
  const [tab,       setTab]       = useState('pending'); // 'pending' | 'done'
const { user } = useAuth();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pending] = await Promise.all([
        api.get(BASE_URL + '/api/order/GetDesingOrder?DesignerID='+user.entity_ID),
      ]);
      setOrders({ pending: pending.data });
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openOrder = async (id) => {
    const { data } = await api.get(`${BASE_URL}/api/order/GetOrderView?orderID=${id}`);
    //const order = Array.isArray(data) ? data.find(o => o.order_ID === id) : data;
    setSelected(data[0]);
    setCadFile(null);
  };

  const handleUpload = async () => {
    if (!cadFile) { toast.error('Please select a CAD image file'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('order_ID', selected.order_ID);
      fd.append('cadImage', cadFile);
      const {data}=await api.post(`${BASE_URL}/api/order/OrderDesingUploadCAD`,fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if(data.statusCode===1)
      {        
      toast.success('CAD design uploaded successfully!');
      setCadFile(null); setSelected(null); load();
      }
      else{
        toast.error(data?.message || 'Upload failed');
      
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const displayOrders = (orders[tab] || []);

  return (
    <div>
      <h5 className="fw-bold mb-1">My Design Tasks</h5>
      <p className="text-muted small mb-4">View your assigned orders, download reference images, and upload CAD designs.</p>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'pending' ? 'active' : ''}`}
            onClick={() => { setTab('pending'); setSelected(null); }}
          >
            Pending CAD Upload
            {orders.pending?.length > 0 && (
              <span className="badge bg-danger ms-2">{orders.pending.length}</span>
            )}
          </button>
        </li>
        {/* <li className="nav-item">
          <button className={`nav-link ${tab === 'done' ? 'active' : ''}`} onClick={() => { setTab('done'); setSelected(null); }}>
            CAD Uploaded
            {orders.done?.length > 0 && (
              <span className="badge bg-success ms-2">{orders.done.length}</span>
            )}
          </button>
        </li> */}
      </ul>

      {loading && (
        <div className="text-center py-4">
          <span className="spinner-border text-primary" />
        </div>
      )}

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
            <div
              key={o.order_ID}
              className={`card mb-2 ${selected?.order_ID === o.order_ID ? 'border-primary' : ''}`}
              style={{
                cursor: 'pointer',
                borderWidth: selected?.order_ID === o.order_ID ? 2 : 1,
              }}
              onClick={() => openOrder(o.order_ID)}
            >
              <div className="card-body">
                <div className="row align-items-start">
                  <div className="col-8">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <div className="fw-bold fs-6">{o.order_Number}</div>
                      {o.is_High_Priority && (
                        <span className="badge bg-danger">High Priority</span>
                      )}
                    </div>
                    <div className="text-muted mb-1">{o.design_Type || '—'}</div>
                    <div className="mb-1" style={{ wordBreak: 'break-word' }}>
                      <strong>Design:</strong> {o.design || '—'}
                    </div>
                    <div>
                      <strong>Order Type:</strong> {o.order_Type || '—'}
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="text-muted">Order: {fmt(o.order_Date)}</div>
                    {o.designer_Assgined_DT && (
                      <div className="text-muted">Assigned: {fmt(o.designer_Assgined_DT)}</div>
                    )}
                    {o.design_Expected_DT && (
                      <div className="text-warning">Expected: {fmt(o.design_Expected_DT)}</div>
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
                <span className="fw-semibold">Order: {selected.order_Number}</span>
                <button className="btn-close" onClick={() => setSelected(null)} />
              </div>
              <div className="card-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>

                {/* Order info */}
                <div className="mb-3 p-3 rounded" style={{ background: '#f8f7ff' }}>
                  <div className="row g-2">
                    {[
                      ['Order Date',                fmt(selected.order_Date)],
                      ['Status',                    selected.order_Status            || '—'],
                      ['Design',                    selected.design                  || '—'],
                      ['KT',                        selected.karat                   || '—'],
                      ['Karat %',                   selected.karat_Percent           ?? '—'],
                      ['Type',                      selected.design_Type             || '—'],
                      ['Gold Colour',               selected.gold_Colour             || '—'],
                      ['Size',                      selected.size                    || '—'],
                      ['Gold Weight',               selected.weight                  ?? '—'],
                      ['Stone',                     selected.stone_Name              || '—'],
                      ['Diamond Quality',           selected.diamond_Quality         || '—'],
                      ['No. of Diamonds',           selected.noOf_Diamonds           ?? '—'],
                      ['Diamond Weight',            selected.diamond_Weight          ?? '—'],
                      ['Colour Stone Required',     selected.is_Colour_Required
                                                      ? (selected.colour_Stone_Name  || 'Yes')
                                                      : 'No'],
                      ['Colour Stone',              selected.colour_Stone            || '—'],
                      ['No. of Colour Stones',      selected.noOfColour_Stone        ?? '—'],
                      ['Colour Stone Weight',       selected.colourStone_Weight      ?? '—'],
                      ['Certificate Required',      selected.is_Certificate_Required
                                                      ? (selected.cretificate_Name   || 'Yes')
                                                      : 'No'],
                      ['Delivery Date',             fmt(selected.delivery_Date)],
                      ['Designer Weight',           selected.designer_Weight         ?? '—'],
                      ['Designer Diamond Weight',   selected.designer_Diamond_Weight ?? '—'],
                      ['Designer No. of Diamonds',  selected.designer_NoOf_Diamonds  ?? '—'],
                    ].map(([k, v]) => (
                      <div className="col-6" key={k}>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{k}</div>
                        <div className="fw-semibold" style={{ fontSize: '0.88rem' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
{/* Design specification 
                {selected.specification && (
                  <div className="alert alert-info py-2 mb-3">
                    <div className="small fw-semibold mb-1">Design Specification:</div>
                    <div className="small">{selected.specification}</div>
                  </div>
                )}*/}
                {/* Design specification */}
                {selected.adminSpecification && (
                  <div className="alert alert-info py-2 mb-3">
                    <div className="small fw-semibold mb-1">Design Specification from Admin:</div>
                    <div className="small">{selected.adminSpecification}</div>
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
                    {[
                      ['front_Image_URL', 'Front'],
                      ['top_Image_URL',   'Top'],
                      ['side_Image_URL',  'Side'],
                      ['back_Image_URL',  'Back'],
                    ].map(([f, l]) =>
                      selected[f] ? (
                        <div key={f} className="text-center">
                          <img
                            src={imgUrl(selected[f])}
                            alt={l}
                            className="img-thumb"
                            onClick={() => setImgViewer(imgUrl(selected[f]))}
                          />
                          <div style={{ fontSize: '0.7rem' }} className="text-muted">{l}</div>
                          <a
                             href={`${BASE_URL}/api/Order/download?FileName=${selected[f]}&downloadFileName=${selected.order_Number.replace("/","_")+"_"+l}`}

                            download
                            className="d-block text-primary"
                            style={{ fontSize: '0.7rem' }}
                          >
                            <i className="bi bi-download"></i> Download
                          </a>
                        </div>
                      ) : null
                    )}
                    {!selected.front_Image_URL && !selected.top_Image_URL &&
                     !selected.side_Image_URL  && !selected.back_Image_URL && (
                      <span className="text-muted small">No reference images provided</span>
                    )}
                  </div>
                </div>

                {/* Existing CAD */}
                {selected.caD_Image_URL && (
                  <div className="mb-3">
                    <div className="small fw-semibold text-muted text-uppercase mb-2">Uploaded CAD Design</div>
                    <img
                      src={imgUrl(selected.caD_Image_URL)}
                      alt="CAD"
                      className="rounded shadow-sm"
                      style={{ maxHeight: 200, maxWidth: '100%', cursor: 'zoom-in', border: '2px solid #7c3aed' }}
                      onClick={() => setImgViewer(imgUrl(selected.caD_Image_URL))}
                    />
                  </div>
                )}

                {/* Upload panel – only for pending */}
                {tab === 'pending' && (
                  <div className="border rounded p-3 mt-2">
                    <div className="fw-semibold mb-2">
                      {selected.caD_Image_URL ? 'Replace CAD Design' : 'Upload CAD Design'}
                    </div>
                    <div className="mb-3">
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={e => setCadFile(e.target.files[0])}
                      />
                      <div className="text-muted small mt-1">Accepted: JPG, PNG, WEBP (max 10 MB)</div>
                    </div>
                    {cadFile && (
                      <div className="mb-3">
                        <img
                          src={URL.createObjectURL(cadFile)}
                          alt="Preview"
                          className="rounded"
                          style={{ maxHeight: 160, maxWidth: '100%' }}
                        />
                      </div>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={handleUpload}
                      disabled={uploading || !cadFile}
                    >
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
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0,0,0,0.9)', cursor: 'zoom-out' }}
          onClick={() => setImgViewer(null)}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <img
              src={imgViewer}
              alt="Full view"
              className="img-fluid rounded"
              style={{ maxHeight: '92vh', margin: 'auto', display: 'block' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignerDashboard;
