import React, { useEffect, useState,useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useReactToPrint } from 'react-to-print';
const CustomerLedgerReport = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [filters, setFilters] = useState({customer_ID:'0', from_Date: '', to_Date: '',ledger_Type: 'BOTH' });
  const [loading, setLoading] = useState(false);
const printRef = useRef();
  useEffect(() => {
    if (user?.user_Type !== 'CUSTOMER') {
      api.get('https://api.jewelquote.in/api/customer/getcustomermapping').then(r => setCustomers(r.data)).catch(() => {});
      
    }
    else
    {
      setFilters({...filters,customer_ID:user.entity_ID.toString()})
    }
  }, [user]);

  const handlePrint = useReactToPrint({
  contentRef: printRef,
  documentTitle: "Ledger Report",
});
  const load = async () => {
    if (user?.user_Type !== 'CUSTOMER') {
    if (!selectedCustomer) return;
     setFilters({...filters,customer_ID:selectedCustomer})
    }
    setLoading(true);
    try {
      let params = {...filters}
      if (user?.user_Type === 'CUSTOMER') {
        params["customer_ID"]=user.entity_ID;
      }
      else
      {
      params["customer_ID"]=selectedCustomer;
      }
      const { data:Cust } = await api.post('https://api.jewelquote.in/api/customer/GetCustomerLedger',params);
      // data[0][0] => { Customer_Name, FromDate, Todate }
      // data[1]    => [ { Trans_Date, Voucher, Particular, GoldOut, GoldIn, amountOut, amountIn }, ... ]
      if (Cust.statusCode===1) {
        setCustomerInfo(Cust.data?? null);
        setEntries(Cust.data.leadger ?? []);
      } else{
        setCustomerInfo(null);
        setEntries(data);
      }
    } catch {} finally { setLoading(false); }
  };

  const exportCSV = () => {
  const selectedCustomerName =
    customers.find(c => String(c.customer_ID) === String(selectedCustomer))
      ?.customer_Name || '';

  const rows = [
    [
      'Customer Name', selectedCustomerName, '',
      'From Date', filters.from_Date || '',
      'To Date', filters.to_Date || ''
    ],
    [],
    [
      'Date',
      'Voucher',
      'Particular',
      'Gold Out',
      'Gold In',
      'Amount Out',
      'Amount In'
    ]
  ];

  entries.forEach(e => {
    rows.push([
      e.trans_Date ?? '',
      e.voucher ?? '',
      e.particular ?? '',
      e.goldOut ?? '',
      e.goldIn ?? '',
      e.amountOut ?? '',
      e.amountIn ?? ''
    ]);
  });

  const csv = rows
    .map(row =>
      row
        .map(value => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\r\n');

  const blob = new Blob(
    ['\uFEFF', csv],
    { type: 'text/csv;charset=utf-8;' }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'ledger_report.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
};
  const fmt     = (n) => (n !== null && n !== undefined) ? n : '';
  const fmtGold = (n) => (n !== null && n !== undefined) ? n : '';

  // Identify special row types coming from SQL
  const isBalanceBF     = (e) => !e.trans_Date && e.voucher === 'BALANCE B/F';
  const isTotalRow      = (e) => e.particular?.trim() === 'Total';
  const isBalanceAmount = (e) => e.particular?.includes('BALANCE AMOUNT');
  const isBalanceGold   = (e) => e.particular?.includes('BALANCE GOLD');
  const isSummaryRow    = (e) => isBalanceAmount(e) || isBalanceGold(e);

  const renderCell = (val, isGold = false) => {
    if (val === null || val === undefined || val === '') return <td style={{ textAlign: 'right' }}></td>;
    const num = Number(val);
    //const display = isGold ? fmtGold(val) : `₹${fmt(val)}`;
    const display = isGold ? fmtGold(val) : fmt(val);
    const color = num < 0 ? '#dc2626' : num > 0 ? (isGold ? '#16a34a' : undefined) : undefined;
   // return <td style={{ textAlign: 'right', color, fontWeight: num !== 0 ? 500 : undefined }}>{display}</td>;
   return <td style={{ textAlign: 'right', fontWeight: num !== 0 ? 500 : undefined }}>{display}</td>;
  };

  return (
    <div>
      {/* Page header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">Customer Ledger Report</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={handlePrint}>
            <i className="bi bi-printer me-1"></i>Print
          </button>
          <button className="btn btn-outline-success btn-sm" onClick={exportCSV} disabled={!entries.length}>
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
                <label className="form-label fw-semibold small">Customer</label>
                <select className="form-select form-select-sm"
                  value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.customer_ID} value={c.customer_ID}>{c.customer_Name}</option>)}
                </select>
              </div>
            )}
            <div className="col-md-2">
              <label className="form-label fw-semibold small">From Date</label>
              <input type="date" className="form-control form-control-sm"
                value={filters.from_Date} onChange={e => setFilters({ ...filters, from_Date: e.target.value })} />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold small">To Date</label>
              <input type="date" className="form-control form-control-sm"
                value={filters.to_Date} onChange={e => setFilters({ ...filters, to_Date: e.target.value })} />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold small">Ledger Type</label>
              <select
                className="form-select form-select-sm"
                value={filters.ledger_Type}
                onChange={(e) =>
                  setFilters({ ...filters, ledger_Type: e.target.value })
                }
              >
                <option value="BOTH">All</option>
                <option value="CREDIT">Credit</option>
                <option value="DEBIT">Debit</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-primary btn-sm w-100" onClick={load}>Search</button>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Grid */}
      <div className="card" ref={printRef}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-4"><span className="spinner-border" /></div>
          ) : (
            <>
              {/* Dataset 1 — Customer info banner */}
              {customerInfo && (
                <div style={styles.infoBanner}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{customerInfo.customer_Name}</span>
                  <span style={{ marginLeft: 24, fontSize: 13 }}>
                    Period: <strong>{customerInfo.form_Date}</strong> &nbsp;to&nbsp; <strong>{customerInfo.to_Date}</strong>
                  </span>
                </div>
              )}

              {/* Dataset 2 — Ledger table */}
              <div className="table-responsive">
                <table className="table table-bordered mb-0" style={{ fontSize: 13, tableLayout: 'fixed', minWidth: 760 }}>
                  <colgroup>
                    <col style={{ width: 65 }} />
                    <col style={{ width: 60 }} />
                    <col style={{ width: 70 }} />
                    <col style={{ width: 80 }} />
                    <col style={{ width: 75 }} />
                    <col style={{ width: 110 }} />
                    <col style={{ width: 110 }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <th rowSpan={2} style={styles.thBase}>Date</th>
                      <th rowSpan={2} style={styles.thBase}>Voucher</th>
                      <th rowSpan={2} style={styles.thBase}>Particular</th>
                      <th colSpan={2} style={{ ...styles.thBase, textAlign: 'center' }}>GOLD - 999</th>
                      <th colSpan={2} style={{ ...styles.thBase, textAlign: 'center' }}>AMOUNT (Rs)</th>
                    </tr>
                    <tr>
                      <th style={{ ...styles.thSub, textAlign: 'right' }}>Gold Out (grm)</th>
                      <th style={{ ...styles.thSub, textAlign: 'right' }}>Gold In (grm)</th>
                      <th style={{ ...styles.thSub, textAlign: 'right' }}>Amount Out</th>
                      <th style={{ ...styles.thSub, textAlign: 'right' }}>Amount In</th>
                    </tr>
                  </thead>

                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">No entries found</td>
                      </tr>
                    ) : entries.map((e, idx) => {

                      // ── BALANCE B/F row ──────────────────────────────────
                      if (isBalanceBF(e)) {
                        return (
                          <tr key={idx} style={{ fontWeight: 600, background: '#f8f9fa' }}>
                            <td></td>
                            <td style={{ fontWeight: 700 }}>BALANCE B/F</td>
                            <td></td>
                            {renderCell(e.goldOut, true)}
                            {renderCell(e.goldIn, true)}
                            {renderCell(e.amountOut)}
                            {renderCell(e.amountIn)}
                          </tr>
                        );
                      }

                      // ── Total row ────────────────────────────────────────
                      if (isTotalRow(e)) {
                        return (
                          <tr key={idx} style={{ background: '#d0e4f7', fontWeight: 600 }}>
                            <td colSpan={3} style={{ textAlign: 'right', fontSize: 12 }}>Total</td>
                            <td style={{ textAlign: 'right'}}>{fmtGold(e.goldOut)}</td>
                            <td style={{ textAlign: 'right' }}>{fmtGold(e.goldIn)}</td>
                            <td style={{ textAlign: 'right' }}>
                              {e.amountOut !== null && e.amountOut !== undefined ? `${fmt(e.amountOut)}` : ''}
                            </td>
                            <td style={{ textAlign: 'right'}}>
                              {e.amountIn !== null && e.amountIn !== undefined ? `${fmt(e.amountIn)}` : ''}
                            </td>
                          </tr>
                        );
                      }

                      // ── BALANCE AMOUNT / BALANCE GOLD summary rows ───────
                      if (isSummaryRow(e)) {
                        const label    = e.Particular?.trim() ?? '';
                        const isGoldRow = isBalanceGold(e);
                        // value comes in amountOut or GoldOut — whichever is non-null
                        const rawVal   = e.amountOut ?? e.goldOut ?? e.amountIn ?? e.goldIn ?? 0;
                        const display  = isGoldRow ? `${Number(rawVal).toFixed(3)} ( In Hand )` : `₹${fmt(rawVal)} ( In Hand )`;
                        const color    = Number(rawVal) < 0 ? '#c00' : '#16a34a';
                        return (
                          <tr key={idx} style={styles.balanceRow}>
                            <td colSpan={5} style={{ textAlign: 'center', fontWeight: 700, letterSpacing: '0.5px' }}>
                              {label}
                            </td>
                            <td colSpan={2} style={{ textAlign: 'right', color, fontWeight: 700 }}>
                              {display}
                            </td>
                          </tr>
                        );
                      }

                      // ── Regular transaction row ──────────────────────────
                      return (
                        <tr key={idx}>
                          <td>{e.trans_Date ?? ''}</td>
                          <td>{e.voucher ?? ''}</td>
                          <td>{e.particular ?? ''}</td>
                          {renderCell(e.goldOut, true)}
                          {renderCell(e.goldIn, true)}
                          {renderCell(e.amountOut)}
                          {renderCell(e.amountIn)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <style>
{`
@media print {
body * {
    visibility: visible;
  }
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
    textAlign: 'center',
  },
  balanceRow: {
    background: '#fef08a',
    fontWeight: 700,
    fontSize: 13,
  },
};

export default CustomerLedgerReport;