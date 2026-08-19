import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Designerprintmodal from '../designer/Designerprintmodal'; 
const BASE_URL = 'http://localhost:8081';
const PAGE_SIZE_OPTIONS = [10, 25, 50];

const EMPTY_FILTERS = {
  order_ID:     '',
  design_ID:    '',
  order_FromDT: '',
  order_ToDT:   '',
};

const fmt = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-IN');
};

const imgUrl = (fn) => (fn ? `${BASE_URL}/${fn}` : null);

const YN = (v) =>
  v ? <span className="badge bg-success">Yes</span> : <span className="badge bg-light text-dark">No</span>;

const PriorityBadge = ({ isHigh }) => (
  <span
    className="badge rounded-pill"
    style={{
      background: isHigh ? '#dc3545' : '#198754',
      padding: '5px 14px',
      fontWeight: 500,
    }}
  >
    {isHigh ? 'High' : 'Normal'}
  </span>
);

const DesignerTaskReport = () => {
  const [orders,  setOrders]  = useState([]);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter inputs (what's typed/selected but not yet searched)
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [selected,     setSelected]     = useState(null);
  const [imgViewer,    setImgViewer]    = useState(null);
  const [printOrderId, setPrintOrderId] = useState(null);

  // ─── Pagination state ───
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(10);

  const { user } = useAuth();

  // Fetches orders from the API using the given filter values.
  const fetchOrders = useCallback(async (activeFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ DesignerID: user.entity_ID });
      if (activeFilters.order_ID)     params.append('OrderNumber', activeFilters.order_ID);
      if (activeFilters.design_ID)    params.append('DesignID',    activeFilters.design_ID);
      if (activeFilters.order_FromDT) params.append('FromDT',      activeFilters.order_FromDT);
      if (activeFilters.order_ToDT)   params.append('ToDT',        activeFilters.order_ToDT);

      const { data } = await api.get(`${BASE_URL}/api/order/GetDesingOrder?${params.toString()}`);
      setOrders(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch {
      toast.error('Failed to load task report');
    } finally {
      setLoading(false);
    }
  }, [user.entity_ID]);

  useEffect(() => {
  fetchOrders(EMPTY_FILTERS);
  (async () => {
    try {
      const { data: order } = await api.get(`${BASE_URL}/api/order/GetListCustomerOrder`, { employee_ID: 0 });
      setDesigns(order?.design || []);
    } catch {
      // design dropdown is non-critical — silently ignore
    }
  })();
}, [fetchOrders]);

  const handleSearch = () => {
    fetchOrders(filters);
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    fetchOrders(EMPTY_FILTERS);
  };

  const openOrder = async (id) => {
    try {
      const { data } = await api.get(`${BASE_URL}/api/order/GetOrderView?orderID=${id}`);
      setSelected(Array.isArray(data) ? data[0] : data);
    } catch {
      toast.error('Failed to load order detail');
    }
  };

  // ─── Pagination calculations (client-side, over whatever the API returned) ───
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const safePage   = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginated  = orders.slice(startIndex, startIndex + pageSize);

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left  = Math.max(1, safePage - delta);
    const right = Math.min(totalPages, safePage + delta);
    if (left > 1)  { pages.push(1); if (left > 2) pages.push('...'); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) { if (right < totalPages - 1) pages.push('...'); pages.push(totalPages); }
    return pages;
  };

  return (
    <div>
      <h5 className="fw-bold mb-3">My Task Report</h5>

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-2">
            <div className="col-md-3">
              <input
                className="form-control form-control-sm"
                placeholder="Order Number"
                value={filters.order_ID}
                onChange={e => setFilters({ ...filters, order_ID: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={filters.design_ID}
                onChange={e => setFilters({ ...filters, design_ID: e.target.value })}
              >
                <option value="">Select Design</option>
                {designs.map(d => <option key={d.value} value={d.value}>{d.text}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.order_FromDT}
                onChange={e => setFilters({ ...filters, order_FromDT: e.target.value })}
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.order_ToDT}
                onChange={e => setFilters({ ...filters, order_ToDT: e.target.value })}
              />
            </div>
            <div className="col-md-2 d-flex gap-2">
              <button className="btn btn-primary btn-sm w-100" onClick={handleSearch} disabled={loading}>
                <i className="bi bi-search me-1"></i>Search
              </button>
              <button className="btn btn-outline-secondary btn-sm w-100" onClick={handleReset} disabled={loading}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order Number</th>
                    <th>Date</th>
                    <th>Design</th>
                    <th>Assigned Date</th>
                    <th>Expected Date</th>
                    <th>Priority</th>
                    <th className="text-center">Uploaded</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-5 text-muted">No tasks found</td></tr>
                  ) : paginated.map(o => (
                    <tr key={o.order_ID}>
                      <td className="fw-semibold text-primary">{o.order_Number}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmt(o.order_Date)}</td>
                      <td>{o.design || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmt(o.designer_Assgined_DT) || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmt(o.design_Expected_DT) || '—'}</td>
                      <td><PriorityBadge isHigh={!!o.is_High_Priority} /></td>
                      <td className="text-center">
                        {YN(o.caD_Image_URL)}
                        {o.caD_Uploaded_DT && (
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{fmt(o.caD_Uploaded_DT)}</div>
                        )}
                      </td>
                      <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          title="View"
                          onClick={() => openOrder(o.order_ID)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        {o.caD_Image_URL && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            title="Print"
                            onClick={() => setPrintOrderId(o.order_ID)}
                          >
                            <i className="bi bi-printer"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── Pagination Footer ─── */}
        {orders.length > 0 && (
          <div className="card-footer d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2 text-muted small">
              <span>
                Showing {startIndex + 1}–{Math.min(startIndex + pageSize, orders.length)} of {orders.length} tasks
              </span>
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              >
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>

            {totalPages > 1 && (
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${safePage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(safePage - 1)}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {getPageNumbers().map((p, idx) =>
                    p === '...'
                      ? <li key={`ellipsis-${idx}`} className="page-item disabled"><span className="page-link">…</span></li>
                      : <li key={p} className={`page-item ${p === safePage ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(p)}>{p}</button>
                        </li>
                  )}
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

      {/* ─── Task Detail Modal ─── */}
      {selected && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order: {selected.order_Number}</h5>
                <button className="btn-close" onClick={() => setSelected(null)} />
              </div>
              <div className="modal-body">
                <div className="row g-2 mb-3">
                  {[
                    ['Order Date',              fmt(selected.order_Date) || '—'],
                    ['Status',                  selected.order_Status || '—'],
                    ['Design',                  selected.design || '—'],
                    ['KT',                      selected.karat || '—'],
                    ['Type',                    selected.design_Type || '—'],
                    ['Gold Colour',             selected.gold_Colour || '—'],
                    ['Size',                    selected.size || '—'],
                    ['Gold Weight',             selected.weight ?? '—'],
                    ['Stone',                   selected.stone_Name || '—'],
                    ['Diamond Weight',          selected.diamond_Weight ?? '—'],
                    ['Colour Stone',            selected.is_Colour_Required ? (selected.colour_Stone_Name || 'Yes') : 'No'],
                    ['Expected Date',           fmt(selected.design_Expected_DT) || '—'],
                  ].map(([k, v]) => (
                    <div className="col-md-4 col-6" key={k}>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>{k}</div>
                      <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {selected.adminSpecification && (
                  <div className="alert alert-info py-2 mb-3">
                    <div className="small fw-semibold mb-1">Design Specification from Admin:</div>
                    <div className="small">{selected.adminSpecification}</div>
                  </div>
                )}

                <div className="mb-2">
                  <div className="fw-semibold mb-2 small text-muted text-uppercase">Reference Images</div>
                  <div className="d-flex flex-wrap gap-2">
                    {[['front_Image_URL', 'Front'], ['top_Image_URL', 'Top'], ['side_Image_URL', 'Side'], ['back_Image_URL', 'Back']].map(([f, l]) =>
                      selected[f] ? (
                        <div key={f} className="text-center">
                          <img
                            src={imgUrl(selected[f])}
                            alt={l}
                            className="img-thumb"
                            onClick={() => setImgViewer(imgUrl(selected[f]))}
                          />
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>{l}</div>
                        </div>
                      ) : null
                    )}
                    {selected.caD_Image_URL && (
                      <div className="text-center">
                        <img
                          src={imgUrl(selected.caD_Image_URL)}
                          alt="CAD"
                          className="img-thumb"
                          style={{ borderColor: '#7c3aed' }}
                          onClick={() => setImgViewer(imgUrl(selected.caD_Image_URL))}
                        />
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>CAD Design</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
                {selected.caD_Image_URL && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setPrintOrderId(selected.order_ID)}
                  >
                    <i className="bi bi-printer me-1"></i>Print
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Full-screen Image Viewer ─── */}
      {imgViewer && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0,0,0,0.9)', cursor: 'zoom-out' }}
          onClick={() => setImgViewer(null)}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <img
              src={imgViewer}
              alt="Full view"
              className="img-fluid rounded shadow-lg"
              style={{ maxHeight: '90vh', margin: 'auto', display: 'block' }}
            />
          </div>
        </div>
      )}

      <Designerprintmodal orderId={printOrderId} onClose={() => setPrintOrderId(null)} />
    </div>
  );
};

export default DesignerTaskReport;