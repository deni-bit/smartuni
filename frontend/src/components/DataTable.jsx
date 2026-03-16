const DataTable = ({ columns = [], data = [], emptyMessage = 'No data found' }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '13px' }}>{emptyMessage}</td></tr>
        ) : data.map((row, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
            {columns.map(col => (
              <td key={col.key} style={{ padding: '12px 14px', fontSize: '13px', color: '#334155' }}>
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
export default DataTable;
