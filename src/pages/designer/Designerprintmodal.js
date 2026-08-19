import React, { useEffect, useState } from 'react';
import api from '../../services/api';
const BASE_URL = 'http://localhost:8081';

// Image fields come back as relative paths (e.g. "uploads/xyz.jpg"), not full URLs.
const resolveImageUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  return `${BASE_URL}/${String(path).replace(/^\/+/, '')}`;
};

const cellStyle = { border: '1px solid #000', padding: '2px 4px', fontSize: '0.7rem', lineHeight: 1.15 };
const labelStyle = { ...cellStyle, fontWeight: 600, background: '#f4f4f4' };

/**
 * Print-only preview modal for a single completed designer order.
 * Renders the attached print format and prints only that content.
 * IMPORTANT: this shares the same #order-print-area / .modal print CSS block
 * already added for OrderPrintModal in the global stylesheet (index.css / App.css) —
 * no additional CSS is needed as long as this modal also uses id="order-print-area".
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

const DesignerPrintModal = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) { setOrder(null); return; }
    setLoading(true);
    api.get(`${BASE_URL}/api/order/GetDesignerPrint?orderID=${orderId}`)
      .then(r => {
        const raw = Array.isArray(r.data) ? r.data[0] : r.data;
        setOrder(normalize(raw));
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (!orderId) return null;

  // SpecificationList comes back as an array of strings (possibly empty/null/undefined).
  const specList = Array.isArray(order?.SpecificationList) ? order.SpecificationList : [];

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header no-print">
            <h5 className="modal-title">Designer Order Print Preview</h5>
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
                      <td style={{ ...labelStyle, width: '25%' }}>Order Number</td>
                      <td style={{ ...cellStyle, width: '25%' }}>{order.Order_Number}</td>

                      <td
                        rowSpan={13}
                        colSpan={2}
                        style={{
                          border: "1px solid #000",
                          textAlign: "center",
                          verticalAlign: "middle",
                          width: "42%",
                        }}
                      >
                        <img
                          src={resolveImageUrl(order.CAD_Image_URL)}
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
                      <td style={{ ...cellStyle, fontWeight: 600 }}>{order.Karat}</td>
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
                      <td style={labelStyle}>Weight</td>
                      <td style={cellStyle}>{order.Weight}</td>
                    </tr>
                    <tr>
                      <td style={labelStyle}>Stone Name</td>
                      <td style={cellStyle}>{order.Stone_Name}</td>
                    </tr>

                    <tr>
                      <td style={labelStyle}>Diamond Weight</td>
                      <td style={cellStyle}>{order.Diamond_Weight}</td>
                    </tr>

                    <tr>
                      <td style={labelStyle}>No. Of Diamonds</td>
                      <td style={cellStyle}>{order.NoOf_Diamonds}</td>
                    </tr>

                    <tr>
                      <td style={labelStyle}>Colour Stone Name</td>
                      <td style={cellStyle}>{order.Colour_Stone_Name}</td>
                    </tr>

                    {/* Bottom section — no image spanning these rows */}
                    <tr>
                      <td style={labelStyle}>No. Of CLR Stone</td>
                      <td style={cellStyle}>{order.NoOf_CLR_Stone}</td>

                      <td style={labelStyle}>CLR Stone Weight</td>
                      <td style={cellStyle}>{order.CLR_Stone_Weight}</td>
                    </tr>

                    <tr>
                      <td style={labelStyle}>Expected Date</td>
                      <td style={cellStyle}>{order.Expected_DT}</td>

                      <td style={labelStyle}>Priority</td>
                      <td style={cellStyle}>{order.Priority}</td>
                    </tr>

                    {/* Specification — full-width row spanning all 4 columns */}
                    <tr>
                      <td colSpan={4} style={{ ...cellStyle, padding: '4px 6px' }}>
                        <div style={{ fontWeight: 600, textDecoration: 'underline', marginBottom: 2 }}>
                          Specification:
                        </div>
                        {specList.length > 0 ? (
                          specList.map((spec, i) => (
                            <div key={i}>{spec}</div>
                          ))
                        ) : (
                          <div>&nbsp;</div>
                        )}
                      </td>
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
      <style>
        {`
        @media print {
  /* Force the layout to fit on a single page */
  html, body {
    height: 100%;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden;
  }

  /* Target your specific print area */
  #order-print-area {
    width: 100% !important;
    max-height: 100%;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box;
    page-break-inside: avoid; /* Prevent splitting inside the table */
  }

  /* Ensure the table doesn't overflow horizontally or vertically */
  #order-print-area table {
    width: 100% !important;
    max-height: 100%;
    page-break-inside: avoid;
  }

  /* Hide headers/footers added by browsers if needed */
  @page {
    size: auto;
    margin: 5mm; /* Tiny margin to maximize usable space */
  }
}

        `}
      </style>
    </div>
  );
};

export default DesignerPrintModal;