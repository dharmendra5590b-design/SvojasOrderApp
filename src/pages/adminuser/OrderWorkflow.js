import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import OrderViewModal from './OrderViewModal';

const STATUS_LABELS = {
  pending:              'Customer Orders (New/Rework)',
  design_pending:       'Design Pending',
  design_uploaded:      'Confirm Design',
  design_confirmed:     'Design Confirmed',
  customer_pending:     'Customer Confirmation Pending',
  customer_confirmed:   'Assign to Development',
  assigned_development: 'Assigned to Development',
  under_processing:     'Assigned to Production',
  completed:            'Completed',
  cancelled:            'Cancelled',
};

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-IN');
};

// --- Sorting helpers ---------------------------------------------------

const getComparableValue = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'number') return val;

  // Try date first (covers *_DT / *_Date fields, which are strings from the API)
  const asDate = new Date(val);
  if (!isNaN(asDate) && /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/.test(String(val))) {
    return asDate.getTime();
  }

  // Try numeric string
  if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) {
    return Number(val);
  }

  return String(val).toLowerCase();
};

const sortData = (data, key, direction) => {
  if (!key) return data;
  const sorted = [...data].sort((a, b) => {
    const va = getComparableValue(a[key]);
    const vb = getComparableValue(b[key]);

    // Nulls/empties always sort last, regardless of direction
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;

    if (va < vb) return direction === 'asc' ? -1 : 1;
    if (va > vb) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
};

const SortableTh = ({ label, sortKey, sortConfig, onSort, className = '' }) => {
  const isActive = sortConfig.key === sortKey;
  const arrow = isActive ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ' ⇅';
  return (
    <th
      className={className}
      onClick={() => onSort(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      title={`Sort by ${label}`}
    >
      {label}
      <span style={{ opacity: isActive ? 1 : 0.35, fontSize: '0.75em' }}>{arrow}</span>
    </th>
  );
};

// -------------------------------------------------------------------------

const OrderWorkflow = () => {
  const { status } = useParams();
  const [orders, setOrders]         = useState([]);
  const [viewOrderId, setViewOrderId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const load = useCallback(async () => {
    try {
      let URL='http://localhost:8081/api/order/GetReworkOrder'
      if (status === 'design_pending') {
        URL='http://localhost:8081/api/order/GetPendingDesingOrder'
      }
      else if (status === 'design_uploaded') {
        URL='http://localhost:8081/api/order/GetDesignUploadOrder'
      }
      else if (status === 'customer_pending') {
        URL='http://localhost:8081/api/order/GetPendingOrderConfirmation'
      }
      else if (status === 'customer_confirmed') {
        URL='http://localhost:8081/api/order/GetConfirmedOrder'
      }
      else if (status === 'under_processing') {
        URL='http://localhost:8081/api/order/GetUnderProductionOrder'
      }
     
        const { data } = await api.get(URL);
        setOrders(data);
      
    } catch {}
  }, [status]);

  useEffect(() => { load(); }, [load]);

  // Reset sort whenever the view changes, since each status has different columns
  useEffect(() => { setSortConfig({ key: null, direction: 'asc' }); }, [status]);

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: 'asc' }; // third click clears sort
    });
  };

  const sortedOrders = useMemo(
    () => sortData(orders, sortConfig.key, sortConfig.direction),
    [orders, sortConfig]
  );

  const renderBody = () => {
    switch (status) {
      case 'pending':
        return (
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <SortableTh label="Order #" sortKey="order_Number" sortConfig={sortConfig} onSort={requestSort} />
                <SortableTh label="Order Type" sortKey="order_Type" sortConfig={sortConfig} onSort={requestSort} />
                <SortableTh label="Customer" sortKey="customer_Name" sortConfig={sortConfig} onSort={requestSort} />
                <SortableTh label="Date" sortKey="order_Date" sortConfig={sortConfig} onSort={requestSort} />
                <SortableTh label="Design" sortKey="design" sortConfig={sortConfig} onSort={requestSort} />
                <SortableTh label="Quantity" sortKey="quantity" sortConfig={sortConfig} onSort={requestSort} />
                <SortableTh label="Expected Delivery Date" sortKey="delivery_Date" sortConfig={sortConfig} onSort={requestSort} />
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-4 text-muted">No orders</td></tr>
              ) : sortedOrders.map(o => (
                <tr key={o.order_ID}>
                  <td><strong>{o.order_Number}</strong></td>
                  <td>{o.order_Type}</td>
                  <td>{o.customer_Name}</td>
                  <td>{fmt(o.order_Date)}</td>
                  <td>{o.design || '—'}</td>
                  <td>{o.quantity || '—'}</td>
                  <td>{fmt(o.delivery_Date)}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setViewOrderId(o.order_ID)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'design_pending':
        return (
          <div className="table-responsive">
  <table className="table table-hover mb-0">
    <thead className="table-light">
      <tr>
        <SortableTh label="Order #" sortKey="order_Number" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Customer" sortKey="customer_Name" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Order Type" sortKey="order_Type" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Order Date" sortKey="order_Date" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Design" sortKey="design" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Quantity" sortKey="quantity" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Designer" sortKey="designer_Name" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Assigned Date" sortKey="designer_Assgined_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Expected Date" sortKey="design_Expected_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Expected Delivery Date" sortKey="delivery_Date" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Priority" sortKey="is_High_Priority" sortConfig={sortConfig} onSort={requestSort} />
        <th></th>
      </tr>
    </thead>
    <tbody>
      {sortedOrders.length === 0 ? (
        <tr>
          <td colSpan={12} className="text-center py-4 text-muted">
            No orders
          </td>
        </tr>
      ) : (
        sortedOrders.map((o) => (
          <tr key={o.order_ID}>
            <td><strong>{o.order_Number}</strong></td>
            <td>{o.customer_Name}</td>
            <td>{o.order_Type || "—"}</td>
            <td>{fmt(o.order_Date)}</td>
            <td>{o.design || "—"}</td>
            <td>{o.quantity || "—"}</td>
            <td>{o.designer_Name || "Not Assigned"}</td>
            <td>{fmt(o.designer_Assgined_DT)}</td>
            <td>{fmt(o.design_Expected_DT)}</td>
            <td>{fmt(o.delivery_Date)}</td>
            <td>
              {o.is_High_Priority ? (
                <span className="badge bg-danger">High</span>
              ) : (
                <span className="badge bg-secondary">Normal</span>
              )}
            </td>
            <td>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setViewOrderId(o.order_ID)}
              >
                View
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
        );
case 'design_uploaded':
  return(
    <div className="table-responsive">
  <table className="table table-hover mb-0">
    <thead className="table-light">
      <tr>
        <SortableTh label="Order #" sortKey="order_Number" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Customer" sortKey="customer_Name" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Order Type" sortKey="order_Type" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Order Date" sortKey="order_Date" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Design" sortKey="design" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Designer" sortKey="designer_Name" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Assigned Date" sortKey="designer_Assgined_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Expected Date" sortKey="design_Expected_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Design Upload Date" sortKey="design_Upload_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Expected Delivery Date" sortKey="delivery_Date" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Priority" sortKey="is_High_Priority" sortConfig={sortConfig} onSort={requestSort} />
        <th></th>
      </tr>
    </thead>
    <tbody>
      {sortedOrders.length === 0 ? (
        <tr>
          <td colSpan={13} className="text-center py-4 text-muted">
            No orders
          </td>
        </tr>
      ) : (
        sortedOrders.map((o) => (
          <tr key={o.order_ID}>
            <td>
              <strong>{o.order_Number}</strong>
            </td>
            <td>{o.customer_Name}</td>
            <td>{o.order_Type || "—"}</td>
            <td>{fmt(o.order_Date)}</td>
            <td>{o.design || "—"}</td>
            <td>{o.designer_Name || "Not Assigned"}</td>
            <td>{fmt(o.designer_Assgined_DT)}</td>
            <td>{fmt(o.design_Expected_DT)}</td>
            <td>{fmt(o.design_Upload_DT)}</td>
            <td>{fmt(o.delivery_Date)}</td>
            <td>
              {o.is_High_Priority ? (
                <span className="badge bg-danger">High</span>
              ) : (
                <span className="badge bg-secondary">Normal</span>
              )}
            </td>
            <td>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setViewOrderId(o.order_ID)}
              >
                View
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
  );
  case 'customer_pending':
  return(
    <div className="table-responsive">
  <table className="table table-hover mb-0">
    <thead className="table-light">
      <tr>
        <SortableTh label="Order#" sortKey="order_Number" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Order Date" sortKey="order_Date" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Customer Name" sortKey="customer_Name" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Order Type" sortKey="order_Type" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Design" sortKey="design" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Quantity" sortKey="quantity" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Designer" sortKey="designer_Name" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Assigned Date" sortKey="designer_Assgined_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Design Upload Date" sortKey="design_Upload_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Design Approved Date" sortKey="design_Approved_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Expected Delivery Date" sortKey="delivery_Date" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Priority" sortKey="is_High_Priority" sortConfig={sortConfig} onSort={requestSort} />
        <th></th>
      </tr>
    </thead>

    <tbody>
      {sortedOrders.length === 0 ? (
        <tr>
          <td colSpan={14} className="text-center py-4 text-muted">
            No orders found
          </td>
        </tr>
      ) : (
        sortedOrders.map((o) => (
          <tr key={o.order_ID}>
            <td className="fw-bold">{o.order_Number}</td>
            <td>{fmt(o.order_Date)}</td>
            <td>{o.customer_Name || "—"}</td>
            <td>{o.order_Type || "—"}</td>
            <td>{o.design || "—"}</td>
            <td>{o.quantity || "—"}</td>
            <td>{o.designer_Name || "Not Assigned"}</td>
            <td>{fmt(o.designer_Assgined_DT)}</td>
            <td>{fmt(o.design_Upload_DT)}</td>
            <td>{fmt(o.design_Approved_DT)}</td>
            <td>{fmt(o.delivery_Date)}</td>
            <td>
              {o.is_High_Priority ? (
                <span className="badge bg-danger">High</span>
              ) : (
                <span className="badge bg-secondary">Normal</span>
              )}
            </td>
            <td>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setViewOrderId(o.order_ID)}
              >
                View
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
  );
  case 'customer_confirmed':
  return(
    <div className="table-responsive">
  <table className="table table-hover mb-0">
    <thead className="table-light">
      <tr>
        <SortableTh label="Order#" sortKey="order_Number" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Order Date" sortKey="order_Date" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Customer Name" sortKey="customer_Name" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Order Type" sortKey="order_Type" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Design" sortKey="design" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Quantity" sortKey="quantity" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Designer" sortKey="designer_Name" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Assigned Date" sortKey="designer_Assgined_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Design Upload Date" sortKey="design_Upload_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Design Approved Date" sortKey="design_Approved_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Order Confirmed Date" sortKey="order_Confirmed_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Expected Delivery Date" sortKey="delivery_Date " sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Committed Date" sortKey="committed_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Priority" sortKey="is_High_Priority" sortConfig={sortConfig} onSort={requestSort} />
        <th></th>
      </tr>
    </thead>

    <tbody>
      {sortedOrders.length === 0 ? (
        <tr>
          <td colSpan={14} className="text-center py-4 text-muted">
            No orders found
          </td>
        </tr>
      ) : (
        sortedOrders.map((o) => (
          <tr key={o.order_ID}>
            <td className="fw-bold">{o.order_Number}</td>
            <td>{fmt(o.order_Date)}</td>
            <td>{o.customer_Name || "—"}</td>
            <td>{o.order_Type || "—"}</td>
            <td>{o.design || "—"}</td>
            <td>{o.quantity || "—"}</td>
            <td>{o.designer_Name || "Not Assigned"}</td>
            <td>{fmt(o.designer_Assgined_DT)}</td>
            <td>{fmt(o.design_Upload_DT)}</td>
            <td>{fmt(o.design_Approved_DT)}</td>
            <td>{fmt(o.order_Confirmed_DT)}</td>
            <td>{fmt(o.delivery_Date)}</td>
            <td>{fmt(o.committed_DT)}</td>
            <td>
              {o.is_High_Priority ? (
                <span className="badge bg-danger">High</span>
              ) : (
                <span className="badge bg-secondary">Normal</span>
              )}
            </td>
            <td>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setViewOrderId(o.order_ID)}
              >
                View
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
  );
  case 'under_processing':
  return(
    <div className="table-responsive">
  <table className="table table-hover mb-0">
    <thead className="table-light">
      <tr>
        <SortableTh label="Order#" sortKey="order_Number" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Order Date" sortKey="order_Date" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Customer Name" sortKey="customer_Name" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Order Type" sortKey="order_Type" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Design" sortKey="design" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Quantity" sortKey="quantity" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Designer" sortKey="designer_Name" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Assigned Date" sortKey="designer_Assgined_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Design Upload Date" sortKey="design_Upload_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Design Approved Date" sortKey="design_Approved_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Order Confirmed Date" sortKey="order_Confirmed_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Production Assigned Date" sortKey="production_Assigned_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Expected Delivery Date" sortKey="delivery_Date " sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Committed Date" sortKey="committed_DT" sortConfig={sortConfig} onSort={requestSort} />
        <SortableTh label="Priority" sortKey="is_High_Priority" sortConfig={sortConfig} onSort={requestSort} />
        <th></th>
      </tr>
    </thead>

    <tbody>
      {sortedOrders.length === 0 ? (
        <tr>
          <td colSpan={14} className="text-center py-4 text-muted">
            No orders found
          </td>
        </tr>
      ) : (
        sortedOrders.map((o) => (
          <tr key={o.order_ID}>
            <td className="fw-bold">{o.order_Number}</td>
            <td>{fmt(o.order_Date)}</td>
            <td>{o.customer_Name || "—"}</td>
            <td>{o.order_Type || "—"}</td>
            <td>{o.design || "—"}</td>
            <td>{o.quantity || "—"}</td>
            <td>{o.designer_Name || "Not Assigned"}</td>
            <td>{fmt(o.designer_Assgined_DT)}</td>
            <td>{fmt(o.design_Upload_DT)}</td>
            <td>{fmt(o.design_Approved_DT)}</td>
            <td>{fmt(o.order_Confirmed_DT)}</td>
            <td>{fmt(o.production_Assigned_DT)}</td>
            <td>{fmt(o.delivery_Date)}</td>
            <td>{fmt(o.committed_DT)}</td>
            <td>
              {o.is_High_Priority ? (
                <span className="badge bg-danger">High</span>
              ) : (
                <span className="badge bg-secondary">Normal</span>
              )}
            </td>
            <td>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setViewOrderId(o.order_ID)}
              >
                View
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
  );
      case 'rework_requested':
      default:
        return (
          <div className="text-center py-5 text-muted">No orders to display.</div>
        );
    }
  };

  return (
    <div>
      <h5 className="fw-bold mb-4">{STATUS_LABELS[status] || 'Orders'}</h5>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            {renderBody()}
          </div>
        </div>
      </div>

      {/* Order View + Action Modal */}
      <OrderViewModal
        orderId={viewOrderId}
        onClose={() => setViewOrderId(null)}
        onOrderUpdated={load}
      />
    </div>
  );
};

export default OrderWorkflow;