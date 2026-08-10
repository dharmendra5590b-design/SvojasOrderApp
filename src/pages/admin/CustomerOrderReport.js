import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import OrderViewModal from '../adminuser/OrderViewModal';
import OrderPrintModal from '../adminuser/OrderPrintModal'; 

const STATUS_COLORS = {
  pending: 'warning', design_pending: 'info', design_uploaded: 'primary',
  design_confirmed: 'success', customer_pending: 'warning', customer_confirmed: 'success',
  rework_requested: 'danger', assigned_development: 'primary', under_processing: 'secondary',
  completed: 'success', cancelled: 'danger'
};
const STATUS = {
  Active: 'success', Cancel: 'danger'
};
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
   Cancel:            { label: 'Cancel',            color: 'danger' },
    Active:     { label: 'Active',     color: 'success'
     },
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const CustomerOrderReport = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({ order_FromDT: '', order_ToDT: '', customer_ID: '', status: 'ALL' });
  const [loading, setLoading] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(10);
  const [viewOrderId, setViewOrderId] = useState(null);
  const [printOrderId, setPrintOrderId] = useState(null);
  useEffect(() => { api.post('http://localhost:8081/api/customer/getcustomer',{customer_ID:0,mode:'L'}).then(r => setCustomers(r.data.data)).catch(() => {}); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const payload = {
    order_FromDT: filters.order_FromDT || null,
    order_ToDT: filters.order_ToDT || null,
    customer_ID: filters.customer_ID || null,
    status: filters.status || ''
  };


      const { data } = await api.post('http://localhost:8081/api/order/GetGridOrder', payload);
      setOrders(data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
// ─── Pagination calculations ───
  const totalPages  = Math.max(1, Math.ceil(orders.length / pageSize));
  const safePage    = Math.min(currentPage, totalPages);
  const startIndex  = (safePage - 1) * pageSize;
  const paginated   = orders.slice(startIndex, startIndex + pageSize);

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

  const oldexportCSV = () => {
    const rows = [['Order#', 'Date', 'Customer', 'Design', 'Status', 'Designer', 'Assigned Date', 'Completed Date']];
    orders.forEach(o => rows.push([
      o.orderNumber, new Date(o.orderDate).toLocaleDateString('en-IN'),
      o.customerId?.customerName, o.design || '', o.status,
      o.designerId?.employeeName || '', o.assignedDate ? new Date(o.assignedDate).toLocaleDateString('en-IN') : '',
      o.completedDate ? new Date(o.completedDate).toLocaleDateString('en-IN') : ''
    ]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'order_report.csv';
    a.click();
  };
  const formatDate = (date) => {
  if (!date || date === '') return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN');
};
  const exportCSV = () => {
  const rows = [[
    'Order Number',
    'Date',
    'Design',
    'Expected Delivery Date',
    'Committed Date',
    'Assigned',
    'Confirmed',
    'Approved',
    'Sent to Production',
    'Completed',
    'Status'
  ]];

  orders.forEach(o => {
    rows.push([
      o.order_Number || '',
      o.order_Date
        ? new Date(o.order_Date).toLocaleDateString('en-IN')
        : '',
      o.design || '',
      o.delivery_Date
        ? new Date(o.delivery_Date).toLocaleDateString('en-IN')
        : '',
          formatDate(o.committed_DT), // Handles null/blank safely
      o.designer_Assgined_DT ? 'Yes' : 'No',
      o.design_Approved_DT ? 'Yes' : 'No',
      o.order_Confirmed_DT ? 'Yes' : 'No',
      o.production_Assigned_DT ? 'Yes' : 'No',
      o.order_Completed_DT ? 'Yes' : 'No',
      o.status || ''
    ]);
  });

  const csv = rows
    .map(row =>
      row
        .map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Customer_Order_Report.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
const YN = v => v
    ? <span className="badge bg-success">Yes</span>
    : <span className="badge bg-light text-dark">No</span>;

  return (
    <div>
   <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">Customer Order Report</h5>
        <div className="d-flex gap-2">
          {/* <button className="btn btn-outline-secondary btn-sm no-print" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i>Print
          </button>*/}
          <button className="btn btn-outline-success btn-sm no-print" onClick={exportCSV}>
            <i className="bi bi-file-earmark-excel me-1"></i>Export
          </button>
        </div>
      </div>

      <div className="card mb-3 no-print">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label fw-semibold small">From Date</label>
              <input type="date" className="form-control form-control-sm"
                value={filters.startDate} onChange={e => setFilters({ ...filters, order_FromDT: e.target.value })} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small">To Date</label>
              <input type="date" className="form-control form-control-sm"
                value={filters.endDate} onChange={e => setFilters({ ...filters, order_ToDT: e.target.value })} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small">Customer</label>
              <select className="form-select form-select-sm"
                value={filters.customer_ID} onChange={e => setFilters({ ...filters, customer_ID: e.target.value })}>
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.customer_ID} value={c.customer_ID}>{c.customer_Name}</option>)}
              </select>
            </div>
         <div className="col-md-2">
              <label className="form-label fw-semibold small">Status</label>
              <select className="form-select form-select-sm"
                value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                <option value="ALL">All</option>
                {Object.keys(STATUS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="col-md-1 d-flex align-items-end">
              <button className="btn btn-primary btn-sm w-100" onClick={load}>Go</button>
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
                                   <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setViewOrderId(o.order_ID)}>
                                     <i className="bi bi-eye"></i>
                                   </button>
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
             {orders.length > 0 && (
               <div className="card-footer d-flex align-items-center justify-content-between flex-wrap gap-2">
     
                 {/* Left: record count + page-size selector */}
                 <div className="d-flex align-items-center gap-2 text-muted small">
                   <span>
                     Showing {startIndex + 1}–{Math.min(startIndex + pageSize, orders.length)} of {orders.length} orders
                     {orders.length}
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
            {/* Order View + Action Modal */}
      <OrderViewModal
        orderId={viewOrderId}
        onClose={() => setViewOrderId(null)}
        onOrderUpdated={load}
      />
      <OrderPrintModal orderId={printOrderId} onClose={() => setPrintOrderId(null)} />
    </div>
  );
};

export default CustomerOrderReport;
