import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const BASE_URL = 'https://api.jewelquote.in';

// Image fields come back as relative paths (e.g. "uploads/xyz.jpg"), not full URLs.
const resolveImageUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  return `${BASE_URL}/${String(path).replace(/^\/+/, '')}`;
};

const cellStyle = { border: '1px solid #000', padding: '2px 4px', fontSize: '0.7rem', lineHeight: 1.15 };
const labelStyle = { ...cellStyle, fontWeight: 600, background: '#f4f4f4' };

const Row = ({ label, value }) => (
  <tr>
    <td style={{ ...labelStyle, width: '38%' }}>{label}</td>
    <td style={cellStyle}>{value ?? ''}</td>
  </tr>
);

const QuadRow = ({ l1, v1, l2, v2 }) => (
  <tr>
    <td style={{ ...labelStyle, width: '25%' }}>{l1}</td>
    <td style={{ ...cellStyle, width: '25%' }}>{v1 ?? ''}</td>
    <td style={{ ...labelStyle, width: '25%' }}>{l2}</td>
    <td style={{ ...cellStyle, width: '25%' }}>{v2 ?? ''}</td>
  </tr>
);

/**
 * Print-only preview modal for a single completed order.
 * Renders the attached print format and prints only that content.
 * IMPORTANT: add the CSS block below to a global stylesheet (index.css / App.css) —
 * it neutralizes the Bootstrap modal's fixed positioning/height cap so the
 * whole document prints (not just the on-screen viewport slice), and hides
 * everything outside #order-print-area.
 *
 *   @media print {
 *     body * { visibility: hidden; }
 *     #order-print-area, #order-print-area * { visibility: visible; }
 *
 *     .modal, .modal-dialog, .modal-content, .modal-body {
 *       position: static !important;
 *       overflow: visible !important;
 *       height: auto !important;
 *       max-height: none !important;
 *       width: 100% !important;
 *       margin: 0 !important;
 *       padding: 0 !important;
 *       box-shadow: none !important;
 *       border: none !important;
 *     }
 *
 *     #order-print-area {
 *       position: absolute;
 *       left: 0;
 *       top: 0;
 *       width: 100%;
 *     }
 *
 *     table, tr { page-break-inside: avoid; }
 *     .no-print { display: none !important; }
 *   }
 */

// .NET's default JSON serializer lowercases the first letter of each property
// name (Order_Number -> order_Number, CAD_Image_URL -> cAD_Image_URL, etc.).
// This wraps the response so field access below works regardless of whether
// the API returns PascalCase or camelCase keys.
const normalize = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const lowerMap = {};
  Object.keys(obj).forEach(k => { lowerMap[k.toLowerCase()] = obj[k]; });
  return new Proxy(obj, {
    get(target, prop) {
      if (typeof prop !== 'string') return target[prop];
      if (prop in target) return target[prop];
      return lowerMap[prop.toLowerCase()];
    }
  });
};

const OrderPrintModal = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) { setOrder(null); return; }
    setLoading(true);
    api.get(`${BASE_URL}/api/order/GetOrderPrint?orderID=${orderId}`)
      .then(r => {
        const raw = Array.isArray(r.data) ? r.data[0] : r.data;
        setOrder(normalize(raw));
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (!orderId) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header no-print">
            <h5 className="modal-title">Order Print Preview</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body" style={{ padding: '0.6rem 0.85rem' }}>
            {loading ? (
              <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
            ) : !order ? (
              <div className="text-center py-5 text-muted">Unable to load order.</div>
            ) : (
              <div id="order-print-area" style={{ padding: "5px", fontFamily: "Arial" }}>
 

  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      tableLayout: "fixed",
      fontSize: "11px",
    }}
  >
    <tbody>
      <tr>
        <td style={labelStyle}>Order Number</td>
        <td style={cellStyle}>{order.Order_Number}</td>

        <td
          rowSpan={10}
          colSpan={2}
          style={{
            border: "1px solid #000",
            textAlign: "center",
            verticalAlign: "middle",
            width: "42%",
          }}
        >
          <img
            src={
              resolveImageUrl(order.CAD_Image_URL) ||
              resolveImageUrl(order.Front_Image_URL)
            }
            alt=""
            style={{
              maxWidth: "95%",
              maxHeight: "220px",
              objectFit: "contain",
            }}
          />
        </td>
      </tr>

      <tr>
        <td style={labelStyle}>Customer Name</td>
        <td style={cellStyle}>{order.Customer_Name}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Order Date</td>
        <td style={cellStyle}>{order.Order_DT}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Design</td>
        <td style={cellStyle}>{order.Design}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Quantity</td>
        <td style={cellStyle}>{order.Quantity}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Karat</td>
        <td style={cellStyle}>{order.Karat}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Design Type</td>
        <td style={cellStyle}>{order.Design_Type}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Gold Colour</td>
        <td style={cellStyle}>{order.Gold_Colour}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Size</td>
        <td style={cellStyle}>{order.Size}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Stone Name</td>
        <td style={cellStyle}>{order.Stone_Name}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Diamond Quality</td>
        <td style={cellStyle}>{order.Diamond_Quality}</td>
        <td style={labelStyle}>Certificate Name</td>
        <td style={cellStyle}>{order.Cretificate_Name}</td>
      </tr>

      <tr>       
      
        <td style={labelStyle}>Colour Stone Name</td>
        <td style={cellStyle}>{order.Colour_Stone_Name}</td>
      
        <td style={labelStyle}>Completed Date</td>
        <td style={cellStyle}>{order.Order_Complete_DT}</td>
      </tr>

      {/* Bottom Details */}
      <tr>
        <td style={labelStyle}>Gross Weight</td>
        <td style={cellStyle}>{order.Final_Gross_Weight}</td>

        <td style={labelStyle}>No. of Diamonds</td>
        <td style={cellStyle}>{order.Final_Noof_Diamonds}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Diamond Weight</td>
        <td style={cellStyle}>{order.Final_Diamond_Weight}</td>

        <td style={labelStyle}>Diamond Value</td>
        <td style={cellStyle}>{order.Diamond_Value}</td>
      </tr>

      <tr>
        <td style={labelStyle}>No. Of Colour Stone</td>
        <td style={cellStyle}>{order.NoOfColour_Stone}</td>

        <td style={labelStyle}>Colour Stone Weight</td>
        <td style={cellStyle}>{order.ColourStone_Weight}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Colour Stone Value</td>
        <td style={cellStyle}>{order.ColourStone_Value}</td>

        <td style={labelStyle}>OTH CLR Stone</td>
        <td style={cellStyle}>{order.Others_NoOfColour_Stone}</td>
      </tr>

      <tr>
        <td style={labelStyle}>OTH CLR Stone WT</td>
        <td style={cellStyle}>{order.Others_Colour_Stone_Weight}</td>

        <td style={labelStyle}>OTH CLR Stone Value</td>
        <td style={cellStyle}>{order.Other_Colour_Stone_Value}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Final Net Weight</td>
        <td style={cellStyle}>{order.Final_Net_Weight}</td>

        <td style={labelStyle}>Final Net Weight (24kt)</td>
        <td style={cellStyle}>{order.Final_Net_Weight_24kt}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Gold Loss</td>
        <td style={cellStyle}>{order.Gold_Loss}</td>

        <td style={labelStyle}>Labour Charge</td>
        <td style={cellStyle}>{order.Labour_Charge}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Gold Loss (24kt)</td>
        <td style={cellStyle}>{order.Gold_Loss_24kt}</td>

        <td style={labelStyle}>Certificate Charge</td>
        <td style={cellStyle}>{order.Certificate_Charge}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Other Charges</td>
        <td style={cellStyle}>{order.Other_Charges}</td>

        <td style={labelStyle}>Final Gold Weight (24kt)</td>
        <td style={cellStyle}>{order.Final_Gold_Weight_24kt}</td>
      </tr>

      <tr>
        <td style={labelStyle}>Bill Amount</td>
        <td style={cellStyle}>{order.Bill_Amount}</td>

        <td style={cellStyle}></td>
        <td style={cellStyle}></td>
      </tr>
    </tbody>
  </table>
</div>
            )}
          </div>

          <div className="modal-footer no-print">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading || !order}
              onClick={() => window.print()}
            >
              <i className="bi bi-printer me-1"></i>Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPrintModal;