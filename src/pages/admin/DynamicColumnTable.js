import React from 'react';
const isNumeric = (v) =>
  v !== null && v !== undefined && v !== '' && !isNaN(Number(String(v).replace(/,/g, '')));

// Prettifies a camelCased/underscored key into a readable header.
// Used ONLY in derived-column mode.
const titleCase = (key) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const normalize = (s) => String(s).replace(/[\s_.]/g, '').toLowerCase();

// Reads a column's value from a row, trying each candidate key in order,
// then falling back to a case/space/punctuation-insensitive match so a
// column still resolves if the serializer mangles the alias unexpectedly.
const readValue = (row, keys) => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
  }
  const wanted = keys.map(normalize);
  const hit = Object.keys(row).find((k) => wanted.includes(normalize(k)));
  return hit !== undefined ? row[hit] : '';
};

export const CUSTOMERWISE_SALES_COLUMNS = [
  { label: 'CUSTOMER NAME', keys: ['Customer Name', 'customerName'], align: 'left' },
  { label: 'GR WT', keys: ['GR WT', 'grWT'], align: 'right' },
  { label: 'NET WT', keys: ['NET WT', 'netWT'], align: 'right' },
  { label: 'P.G WT', keys: ['P.G WT', 'pGWT', 'pgWT'], align: 'right' },
];

export const ARTICLEWISE_COLUMNS = [
  { label: 'DESIGN', keys: ['Design Name', 'designName'], align: 'left' },
  { label: 'QTY', keys: ['Quantity', 'quantity'], align: 'right' },
  { label: 'NETWT', keys: ['NET WT', 'netWT'], align: 'right' },
  { label: 'LABOUR', keys: ['Labour', 'labour'], align: 'right' },
  { label: 'WASTAGE P.G', keys: ['Wastage PG', 'wastagePG', 'wastage_PG'], align: 'right' },
  { label: 'DIAMOND CT', keys: ['Diamond_CT', 'diamond_CT', 'diamondCT'], align: 'right' },
  { label: 'DIAMOND AMT', keys: ['Diamond_AMT', 'diamond_AMT', 'diamondAMT'], align: 'right' },
  { label: 'COLST AMOUNT', keys: ['CLRStone_AMT', 'clrStone_AMT', 'clrStoneAMT'], align: 'right' },
  { label: 'OTHR AMT', keys: ['OTHER_AMT', 'other_AMT', 'otherAMT'], align: 'right' },
];

export const OUTSTANDING_COLUMNS = [
  { label: 'CUSTOMER', keys: ['CUSTOMER', 'customer_Name'], align: 'left' },
  { label: 'RECIVABLE GOLD 999', keys: ['RECIVEABLE GOLD 999', 'receivable_Gold_999'], align: 'right' },
  { label: 'PAYBLE GOLD 999', keys: ['PAYBLE GOLD 999', 'payable_Gold_999'], align: 'right' },
  { label: 'RECIVEABLE AMT', keys: ['RECIVEABLE AMT', 'receivable_Amt'], align: 'right' },
  { label: 'PAYABLE AMT', keys: ['PAYABLE AMT', 'payable_Amt'], align: 'right' },
];

/* ------------------------------------------------------------------ */

// Turns either an explicit `columns` prop or the first row's keys into a
// single uniform column list the render loop can walk.
const resolveColumns = (columns, rows) => {
  if (columns && columns.length) return columns;
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((k) => ({
    label: /[\sA-Z]/.test(k) && k === k.toUpperCase() ? k : titleCase(k),
    keys: [k],
    align: null, // null = decide per cell from the value type
  }));
};

const DynamicColumnTable = ({
  rows = [],
  columns = null,
  loading = false,
  emptyMessage = 'No data found',
  // Which column carries the 'TOTAL' marker from the SP's ROLLUP row.
  // Accepts a label, a key name, or an index. Defaults to the first column.
  totalRowColumn = null,
}) => {
  const cols = resolveColumns(columns, rows);

  const totalCol =
    typeof totalRowColumn === 'number'
      ? cols[totalRowColumn]
      : totalRowColumn
      ? cols.find((c) => c.label === totalRowColumn || c.keys.includes(totalRowColumn)) || cols[0]
      : cols[0];

  const isTotalRow = (row) => {
    if (!totalCol) return false;
    const v = readValue(row, totalCol.keys);
    return typeof v === 'string' && v.trim().toUpperCase() === 'TOTAL';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <span className="spinner-border" />
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-sm mb-0" style={{ fontSize: 13 }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.label} style={{ ...styles.th, textAlign: c.align === 'right' ? 'right' : 'left' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cols.length === 0 || rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length || 1} className="text-center py-4 text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => {
              const total = isTotalRow(row);
              return (
                <tr key={idx} style={total ? styles.totalRow : undefined}>
                  {cols.map((c) => {
                    const val = readValue(row, c.keys);
                    const align = c.align || (isNumeric(val) ? 'right' : 'left');
                    return (
                      <td key={c.label} style={{ textAlign: align }}>
                        {val === null || val === undefined ? '' : val}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

/**
 * CSV export.
 *
 * Backward compatible: exportRowsToCSV(rows, filename, title) still works
 * and derives its headers from the row keys. Pass `columns` as the 4th
 * argument to get the PDF labels in the file instead - do that for the
 * three First Phase reports so the export matches the screen.
 *
 * `headerLines` lets you prepend the PDF's FROM DATE / TO DATE band.
 */
export const exportRowsToCSV = (rows, filename, title, columns = null, headerLines = []) => {
  if (!rows.length) return;
  const cols = resolveColumns(columns, rows);

  const lines = [];
  if (title) lines.push([title]);
  headerLines.forEach((l) => lines.push(l));
  lines.push(cols.map((c) => c.label));
  rows.forEach((r) => lines.push(cols.map((c) => readValue(r, c.keys))));

  const csv = lines
    .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const styles = {
  th: {
    background: '#2b5a8c',
    color: '#fff',
    fontWeight: 500,
    fontSize: 12,
    padding: '6px 8px',
    whiteSpace: 'nowrap',
  },
  totalRow: { background: '#d0e4f7', fontWeight: 700 },
};

export { titleCase, readValue };
export default DynamicColumnTable;