import React, { useState } from 'react';
import api from '../../services/api';
import DynamicColumnTable, { exportRowsToCSV, OUTSTANDING_COLUMNS } from './DynamicColumnTable';

const COLUMNS = OUTSTANDING_COLUMNS;

// TODO: confirm this route against your Reports controller.
const ENDPOINT = 'https://api.jewelquote.in/api/SalesReport/GetCustomerwiseOutstandingReport';

const CustomerOutstandingReport = () => {
  const [asOfDate, setAsOfDate] = useState('');
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const load = async () => {
    if (!asOfDate) {
      setError('Date is required');
      return;
    }
    setError('');
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.post(ENDPOINT, { AsOfDate: asOfDate });
      setRows(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () =>
    exportRowsToCSV(rows, 'customer_outstanding_report.csv', 'LEDGER REPORT', COLUMNS, [
      ['AS OF DATE', asOfDate],
      [],
    ]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">Customer Outstanding Report</h5>
        <button className="btn btn-outline-success btn-sm" onClick={handleExport} disabled={!rows.length}>
          <i className="bi bi-file-earmark-excel me-1"></i>Export
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label fw-semibold small">AS OF DATE *</label>
              <input
                type="date"
                className={`form-control form-control-sm ${error ? 'is-invalid' : ''}`}
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
              />
              {error && <div className="invalid-feedback">{error}</div>}
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-primary btn-sm w-100" onClick={load}>
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {rows.length > 0 && (
            <div style={styles.banner}>
              <span style={{ fontWeight: 700 }}>LEDGER REPORT</span>
              <span style={{ fontSize: 13 }}>
                AS OF DATE: <strong>{asOfDate}</strong>
              </span>
            </div>
          )}
          <DynamicColumnTable
            columns={COLUMNS}
            rows={rows}
            loading={loading}
            emptyMessage={searched ? 'No entries found' : 'Select a date and click Search'}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  banner: {
    background: '#1a3a5c',
    color: '#fff',
    padding: '8px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
};

export default CustomerOutstandingReport;