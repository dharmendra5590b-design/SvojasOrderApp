import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useReactToPrint } from 'react-to-print';

// Maps to: usp_Get_Customer_Ledger @Customer_ID, @FromDT, @ToDT, @Ledger_Type, @User_ID
//
// The SP embeds a status tag inside the value string itself for the
// BALANCE B/F and Closing Balance rows, e.g. "0.028 ( Advance )" or
// "68,124.00 ( Payable )". This component pulls that tag out and renders
// it as the colored pill shown in the screenshot, mapping the SP's raw
// wording to the label your change request asked for:
//   SP says "Payable"     -> shown as "Advance"
//   SP says "Receivables" -> shown as "Receivable"
// If you'd rather have the SP emit "Advance"/"Receivable" directly and
// drop this mapping, that's a one-line change in the SP's IIF() calls.
const TAG_LABELS = { Payable: 'Advance', Receivables: 'Receivable' };
const TAG_STYLES = {
  Advance: { background: '#fef3c7', color: '#b45309' },
  Receivable: { background: '#fee2e2', color: '#b91c1c' },
};

// Pulls "<value> ( <tag> )" apart. Returns { value, tag } - tag is null
// for rows that don't carry a status suffix (ordinary transaction rows).
const parseTagged = (raw) => {
  if (raw === null || raw === undefined || raw === '') return { value: '', tag: null };
  const match = String(raw).match(/^(.*?)\s*\(\s*(.*?)\s*\)\s*$/);
  if (!match) return { value: raw, tag: null };
  return { value: match[1].trim(), tag: match[2].trim() };
};

// Tries a few casings so this survives whichever JSON casing your API
// actually uses for the two-column customer-info result set.
const pick = (obj, ...keys) => {
  if (!obj) return '';
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return '';
};

const CustomerLedgerReport = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [filters, setFilters] = useState({ customer_ID: '0', from_Date: '', to_Date: '', ledger_Type: 'BOTH',user_ID:'0' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    if (user?.user_Type !== 'CUSTOMER') {
      api.get('https://api.jewelquote.in/api/customer/getcustomermapping').then((r) => setCustomers(r.data)).catch(() => {});
    } else {
      setFilters((f) => ({ ...f, customer_ID: user.entity_ID.toString() }));
    }
  }, [user]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Ledger Report',
  });

  // From Date & To Date are now mandatory, per the change request.
  const validate = () => {
    const e = {};
    if (user?.user_Type !== 'CUSTOMER' && !selectedCustomer) e.customer = 'Select a customer';
    if (!filters.from_Date) e.from_Date = 'From Date is required';
    if (!filters.to_Date) e.to_Date = 'To Date is required';
    if (filters.from_Date && filters.to_Date && filters.from_Date > filters.to_Date) {
      e.to_Date = 'To Date cannot be before From Date';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const load = async () => {
    if (!validate()) return;

    setLoading(true);
    setSearched(true);
    try {
      const params = { ...filters };
      params.customer_ID = user?.user_Type === 'CUSTOMER' ? user.entity_ID : selectedCustomer;
 params.user_ID = user.user_ID;
      const { data: Cust } = await api.post('https://api.jewelquote.in/api/customer/GetCustomerLedger', params);
      // data[0][0] => { Customer_Name, FromDate, Todate }
      // data[1]    => [ { Trans_Date, Voucher, Particular, GoldOut, GoldIn, AmountOut, AmountIn }, ... ]
      if (Cust.statusCode === 1) {
        setCustomerInfo(Cust.data ?? null);
        setEntries(Cust.data?.ledger ?? Cust.data?.leadger ?? []);
      } else {
        setCustomerInfo(null);
        setEntries([]);
      }
    } catch {
      setCustomerInfo(null);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const selectedCustomerName =
      customers.find((c) => String(c.customer_ID) === String(selectedCustomer))?.customer_Name || '';

    const rows = [
      ['Customer Name', selectedCustomerName, '', 'From Date', filters.from_Date || '', 'To Date', filters.to_Date || ''],
      [],
      ['Date', 'Voucher', 'Particular', 'Gold Out', 'Gold In', 'Amount Out', 'Amount In'],
    ];

    displayRows.forEach((e) => {
      rows.push([
        e.trans_Date ?? '',
        e.voucher ?? '',
        e.particular ?? '',
        parseTagged(e.goldOut).value,
        parseTagged(e.goldIn).value,
        parseTagged(e.amountOut).value,
        parseTagged(e.amountIn).value,
      ]);
    });

    const csv = rows
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ledger_report.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Row-type checks against what the current SP actually emits.
  const isBalanceBF = (e) => e.voucher === 'BALANCE B/F';
  const isBlankSpacer = (e) =>
    !e.trans_Date && !e.voucher && !e.particular && !e.goldOut && !e.goldIn && !e.amountOut && !e.amountIn;
  const isTotalRow = (e) => e.particular?.trim().toLowerCase() === 'total movements';
  const isClosingRow = (e) => e.particular?.trim().toLowerCase() === 'closing balance';

  // The SP inserts 3 blank spacer rows before the totals - drop those,
  // the screenshot layout has no gap between transactions and totals.
  const displayRows = entries.filter((e) => !isBlankSpacer(e));

  const renderTaggedCell = (raw, unit) => {
    const { value, tag } = parseTagged(raw);
    if (value === '') return <td style={{ textAlign: 'right' }}></td>;
    const label = tag ? TAG_LABELS[tag] || tag : null;
    const pillStyle = label ? TAG_STYLES[label] : null;
    return (
      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        <span style={{ fontWeight: 500 }}>
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
        {label && (
          <span
            className="badge ms-2"
            style={{ fontWeight: 500, fontSize: 10, borderRadius: 10, padding: '3px 8px', ...pillStyle }}
          >
            {label}
          </span>
        )}
      </td>
    );
  };

  const plainCell = (raw) => (
    <td style={{ textAlign: 'right' }}>{raw === null || raw === undefined || raw === '' ? '' : raw}</td>
  );

  const custName = pick(customerInfo, 'customer_Name', 'Customer_Name');
  const fromDateDisplay = pick(customerInfo, 'fromDate', 'FromDate', 'form_Date') || filters.from_Date;
  const toDateDisplay = pick(customerInfo, 'todate', 'Todate', 'to_Date') || filters.to_Date;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">Customer Ledger Report</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={handlePrint} disabled={!displayRows.length}>
            <i className="bi bi-printer me-1"></i>Print
          </button>
          <button className="btn btn-outline-success btn-sm" onClick={exportCSV} disabled={!displayRows.length}>
            <i className="bi bi-file-earmark-excel me-1"></i>Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            {user?.user_Type !== 'CUSTOMER' && (
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Customer *</label>
                <select
                  className={`form-select form-select-sm ${errors.customer ? 'is-invalid' : ''}`}
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.customer_ID} value={c.customer_ID}>
                      {c.customer_Name}
                    </option>
                  ))}
                </select>
                {errors.customer && <div className="invalid-feedback">{errors.customer}</div>}
              </div>
            )}
            <div className="col-md-2">
              <label className="form-label fw-semibold small">From Date *</label>
              <input
                type="date"
                className={`form-control form-control-sm ${errors.from_Date ? 'is-invalid' : ''}`}
                value={filters.from_Date}
                onChange={(e) => setFilters({ ...filters, from_Date: e.target.value })}
              />
              {errors.from_Date && <div className="invalid-feedback">{errors.from_Date}</div>}
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold small">To Date *</label>
              <input
                type="date"
                className={`form-control form-control-sm ${errors.to_Date ? 'is-invalid' : ''}`}
                value={filters.to_Date}
                onChange={(e) => setFilters({ ...filters, to_Date: e.target.value })}
              />
              {errors.to_Date && <div className="invalid-feedback">{errors.to_Date}</div>}
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold small">Ledger Type</label>
              <select
                className="form-select form-select-sm"
                value={filters.ledger_Type}
                onChange={(e) => setFilters({ ...filters, ledger_Type: e.target.value })}
              >
                <option value="BOTH">All</option>
                <option value="CREDIT">Credit</option>
                <option value="DEBIT">Debit</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-primary btn-sm w-100" onClick={load}>
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div className="card" ref={printRef}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-4">
              <span className="spinner-border" />
            </div>
          ) : (
            <>
              {/* Statement banner */}
              {customerInfo && (
                <div style={styles.infoBanner}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Customer Statement: {custName}</span>
                  <span style={{ fontSize: 13 }}>
                    Period: <strong>{fromDateDisplay}</strong> to <strong>{toDateDisplay}</strong>
                  </span>
                </div>
              )}

              <div className="table-responsive">
                <table className="table table-bordered mb-0" style={{ fontSize: 13, tableLayout: 'fixed', minWidth: 760 }}>
                  <colgroup>
                    <col style={{ width: 65 }} />
                    <col style={{ width: 90 }} />
                    <col style={{ width: 110 }} />
                    <col style={{ width: 90 }} />
                    <col style={{ width: 80 }} />
                    <col style={{ width: 120 }} />
                    <col style={{ width: 120 }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <th style={styles.thBase}>Date</th>
                      <th style={styles.thBase}>Voucher</th>
                      <th style={styles.thBase}>Particular</th>
                      <th colSpan={2} style={{ ...styles.thBase, textAlign: 'center' }}>
                        Fine Gold 999 (grm)
                      </th>
                      <th colSpan={2} style={{ ...styles.thBase, textAlign: 'center' }}>
                        Amount (₹)
                      </th>
                    </tr>
                    <tr>
                      <th style={styles.thSub}></th>
                      <th style={styles.thSub}></th>
                      <th style={styles.thSub}></th>
                      <th style={{ ...styles.thSub, textAlign: 'right' }}>Gold Out</th>
                      <th style={{ ...styles.thSub, textAlign: 'right' }}>Gold In</th>
                      <th style={{ ...styles.thSub, textAlign: 'right' }}>Amount Out</th>
                      <th style={{ ...styles.thSub, textAlign: 'right' }}>Amount In</th>
                    </tr>
                  </thead>

                  <tbody>
                    {displayRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          {searched ? 'No entries found' : 'Select a customer and date range, then click Search'}
                        </td>
                      </tr>
                    ) : (
                      displayRows.map((e, idx) => {
                        if (isBalanceBF(e)) {
                          return (
                            <tr key={idx} style={{ fontWeight: 600, background: '#f8f9fa' }}>
                              <td>--</td>
                              <td style={{ fontWeight: 700 }}>BALANCE B/F</td>
                              <td>Opening Balance</td>
                           {/*  {renderTaggedCell(e.goldOut)}
                              {renderTaggedCell(e.goldIn)}
                              {renderTaggedCell(e.amountOut)}
                              {renderTaggedCell(e.amountIn)}*/}
                              {e.goldOut}
                              {e.goldIn}
                              {e.amountOut}
                              {e.amountIn}
                            </tr>
                          );
                        }

                        if (isTotalRow(e)) {
                          return (
                            <tr key={idx} style={{ background: '#d0e4f7', fontWeight: 600 }}>
                              <td colSpan={3} style={{ textAlign: 'right', fontSize: 12 }}>
                                Total Movements:
                              </td>
                              {plainCell(e.goldOut)}
                              {plainCell(e.goldIn)}
                              {plainCell(e.amountOut)}
                              {plainCell(e.amountIn)}
                            </tr>
                          );
                        }

                        if (isClosingRow(e)) {
                          return (
                            <tr key={idx} style={styles.balanceRow}>
                              <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700, letterSpacing: '0.5px' }}>
                                CLOSING BALANCE:
                              </td>
                            {/*  {renderTaggedCell(e.goldOut, 'grm')}*/}
                           { e.goldOut}
                              <td></td>
                            {/* {renderTaggedCell(e.amountOut)}*/}  
                            {e.amountOut}
                              <td></td>
                            </tr>
                          );
                        }

                        // Regular transaction row
                        return (
                          <tr key={idx}>
                            <td>{e.trans_Date ?? ''}</td>
                            <td>{e.voucher ?? ''}</td>
                            <td>{e.particular ?? ''}</td>
                            {plainCell(e.goldOut)}
                            {plainCell(e.goldIn)}
                            {plainCell(e.amountOut)}
                            {plainCell(e.amountIn)}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <style>
          {`
@media print {
  body * { visibility: visible; }
}
`}
        </style>
      </div>
    </div>
  );
};

const styles = {
  infoBanner: {
    background: '#1a3a5c',
    color: '#fff',
    padding: '8px 14px',
    fontSize: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  thBase: {
    background: '#2b5a8c',
    color: '#fff',
    fontWeight: 500,
    fontSize: 12,
    padding: '6px 8px',
    verticalAlign: 'middle',
  },
  thSub: {
    background: '#d0e4f7',
    color: '#1a3a5c',
    fontWeight: 500,
    fontSize: 11,
    padding: '5px 8px',
  },
  balanceRow: {
    background: '#fef08a',
    fontWeight: 700,
    fontSize: 13,
  },
};

export default CustomerLedgerReport;