import React, { useState } from 'react';
import api from '../../services/api';
import DynamicColumnTable, { exportRowsToCSV, ARTICLEWISE_COLUMNS } from './DynamicColumnTable';

const COLUMNS = ARTICLEWISE_COLUMNS;

// TODO: confirm this route against your Reports controller.
const ENDPOINT = 'https://api.jewelquote.in/api/SalesReport/GetArticlewiseSalesReport';

const ArticlewiseDesignReport = () => {
  const [filters, setFilters] = useState({ from_Date: '', to_Date: '' });
  const [errors, setErrors] = useState({});
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const validate = () => {
    const e = {};
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
      const { data } = await api.post(ENDPOINT, {
        FromDate: filters.from_Date,
        ToDate: filters.to_Date,
      });
      setRows(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () =>
    exportRowsToCSV(rows, 'sale_report_article_wise.csv', 'SALE EPORT ARTICLE WISE', COLUMNS, [
      ['FROM DATE', filters.from_Date, 'TO DATE', filters.to_Date],
      [],
    ]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">Design Type wise Report</h5>
        <button className="btn btn-outline-success btn-sm" onClick={handleExport} disabled={!rows.length}>
          <i className="bi bi-file-earmark-excel me-1"></i>Export
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label fw-semibold small">FROM DATE *</label>
              <input
                type="date"
                className={`form-control form-control-sm ${errors.from_Date ? 'is-invalid' : ''}`}
                value={filters.from_Date}
                onChange={(e) => setFilters({ ...filters, from_Date: e.target.value })}
              />
              {errors.from_Date && <div className="invalid-feedback">{errors.from_Date}</div>}
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small">TO DATE *</label>
              <input
                type="date"
                className={`form-control form-control-sm ${errors.to_Date ? 'is-invalid' : ''}`}
                value={filters.to_Date}
                onChange={(e) => setFilters({ ...filters, to_Date: e.target.value })}
              />
              {errors.to_Date && <div className="invalid-feedback">{errors.to_Date}</div>}
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
              <span style={{ fontWeight: 700 }}>SALE REPORT ARTICLE WISE</span>
              <span style={{ fontSize: 13 }}>
                FROM DATE: <strong>{filters.from_Date}</strong> &nbsp; TO DATE: <strong>{filters.to_Date}</strong>
              </span>
            </div>
          )}
          <DynamicColumnTable
            columns={COLUMNS}
            rows={rows}
            loading={loading}
            emptyMessage={searched ? 'No entries found' : 'Select a date range and click Search'}
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

export default ArticlewiseDesignReport;