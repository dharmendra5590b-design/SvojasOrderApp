import React, { useEffect, useState, useCallback } from 'react';
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

const OrderWorkflow = () => {
  const { status } = useParams();
  const [orders, setOrders]         = useState([]);
  const [viewOrderId, setViewOrderId] = useState(null);

  const load = useCallback(async () => {
    try {
      let URL='https://api.jewelquote.in/api/order/GetReworkOrder'
      if (status === 'design_pending') {
        URL='https://api.jewelquote.in/api/order/GetPendingDesingOrder'
      }
      else if (status === 'design_uploaded') {
        URL='https://api.jewelquote.in/api/order/GetDesignUploadOrder'
      }
      else if (status === 'customer_pending') {
        URL='https://api.jewelquote.in/api/order/GetPendingOrderConfirmation'
      }
      else if (status === 'customer_confirmed') {
        URL='https://api.jewelquote.in/api/order/GetConfirmedOrder'
      }
      else if (status === 'under_processing') {
        URL='https://api.jewelquote.in/api/order/GetUnderProductionOrder'
      }
     
        const { data } = await api.get(URL);
        setOrders(data);
      
    } catch {}
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const renderBody = () => {
    switch (status) {
      case 'pending':
        return (
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Order #</th>
                <th>Order Type</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Design</th>
                <th>Quantity</th>
                <th>Expected Delivery Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4 text-muted">No orders</td></tr>
              ) : orders.map(o => (
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
        <th>Order #</th>
        <th>Customer</th>
        <th>Order Type</th>
        <th>Order Date</th>
        <th>Design</th>
        <th>Quantity</th>
        <th>Designer</th>
        <th>Assigned Date</th>
        <th>Expected Date</th>
        <th>Expected Delivery Date</th>
        <th>Priority</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {orders.length === 0 ? (
        <tr>
          <td colSpan={12} className="text-center py-4 text-muted">
            No orders
          </td>
        </tr>
      ) : (
        orders.map((o) => (
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
        <th>Order #</th>
        <th>Customer</th>
        <th>Order Type</th>
        <th>Order Date</th>
        <th>Design</th>
        <th>Designer</th>
        <th>Assigned Date</th>
        <th>Expected Date</th>
        <th>Design Upload Date</th>
        <th>Expected Delivery Date</th>
        <th>Priority</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {orders.length === 0 ? (
        <tr>
          <td colSpan={13} className="text-center py-4 text-muted">
            No orders
          </td>
        </tr>
      ) : (
        orders.map((o) => (
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
       
        <th>Order#</th>
        <th>Order Date</th>
        <th>Customer Name</th>
        <th>Order Type</th>
        <th>Design</th>
        <th>Quantity</th>
        <th>Designer</th>
        <th>Assigned Date</th>
        <th>Design Upload Date</th>
        <th>Design Approved Date</th>
        <th>Expected Delivery Date</th>
        <th>Priority</th>
        <th></th>
      </tr>
    </thead>

    <tbody>
      {orders.length === 0 ? (
        <tr>
          <td colSpan={14} className="text-center py-4 text-muted">
            No orders found
          </td>
        </tr>
      ) : (
        orders.map((o) => (
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
       
        <th>Order#</th>
        <th>Order Date</th>
        <th>Customer Name</th>
        <th>Order Type</th>
        <th>Design</th>
        <th>Quantity</th>
        <th>Designer</th>
        <th>Assigned Date</th>
        <th>Design Upload Date</th>
        <th>Design Approved Date</th>
        <th>Order Confirmed Date</th>
        <th>Priority</th>
        <th></th>
      </tr>
    </thead>

    <tbody>
      {orders.length === 0 ? (
        <tr>
          <td colSpan={14} className="text-center py-4 text-muted">
            No orders found
          </td>
        </tr>
      ) : (
        orders.map((o) => (
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
       
        <th>Order#</th>
        <th>Order Date</th>
        <th>Customer Name</th>
        <th>Order Type</th>
        <th>Design</th>
        <th>Quantity</th>
        <th>Designer</th>
        <th>Assigned Date</th>
        <th>Design Upload Date</th>
        <th>Design Approved Date</th>
        <th>Order Confirmed Date</th>
        <th>Production Assigned Date</th>
        <th>Priority</th>
        <th></th>
      </tr>
    </thead>

    <tbody>
      {orders.length === 0 ? (
        <tr>
          <td colSpan={14} className="text-center py-4 text-muted">
            No orders found
          </td>
        </tr>
      ) : (
        orders.map((o) => (
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