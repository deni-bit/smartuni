import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getMyFees } from '../../services/api';

const statusColor = { paid: '#16a34a', partial: '#d97706', pending: '#64748b', overdue: '#dc2626', waived: '#6f42c1' };
const statusBg    = { paid: '#f0fdf4', partial: '#fffbeb', pending: '#f8fafc', overdue: '#fef2f2', waived: '#f5f3ff' };

const Fees = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyFees()
      .then(({ data: d }) => setData(d))
      .catch(() => toast.error('Failed to load fees'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div style={s.center}>⏳ Loading fees...</div></Layout>;

  const { fees = [], summary = {} } = data || {};

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.pageTitle}>💰 My Fees</h1>
        <p style={s.sub}>Fee payment status and history</p>
      </div>

      {/* Summary */}
      <div style={s.summaryRow}>
        {[
          { label: 'Total Invoiced', value: `TZS ${(summary.totalAmount || 0).toLocaleString()}`,  color: '#1e3c72' },
          { label: 'Total Paid',     value: `TZS ${(summary.totalPaid   || 0).toLocaleString()}`,  color: '#16a34a' },
          { label: 'Balance Due',    value: `TZS ${(summary.totalBalance|| 0).toLocaleString()}`,  color: summary.totalBalance > 0 ? '#dc2626' : '#16a34a' },
          { label: 'Overdue',        value: summary.overdue || 0,                                   color: summary.overdue > 0 ? '#dc2626' : '#94a3b8' },
        ].map(stat => (
          <div key={stat.label} style={s.statCard}>
            <p style={s.statLabel}>{stat.label}</p>
            <p style={{ ...s.statValue, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Payment progress */}
      {summary.totalAmount > 0 && (
        <div style={s.progressCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e3c72' }}>Overall Payment Progress</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e3c72' }}>
              {Math.round((summary.totalPaid || 0) / summary.totalAmount * 100)}%
            </span>
          </div>
          <div style={s.barBg}>
            <div style={{ ...s.barFill, width: `${Math.round((summary.totalPaid || 0) / summary.totalAmount * 100)}%` }} />
          </div>
          {summary.totalBalance === 0 && (
            <p style={s.clearedMsg}>✅ All fees paid — you're academically cleared!</p>
          )}
        </div>
      )}

      {/* Fee records */}
      {fees.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: '48px' }}>📭</p>
          <h3>No fee records</h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Fee records will appear here once added by admin</p>
        </div>
      ) : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Type','Semester','Academic Year','Amount (TZS)','Paid (TZS)','Balance (TZS)','Due Date','Status','Receipt'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fees.map(fee => (
                <tr key={fee._id} style={s.tr}>
                  <td style={s.td}><span style={s.feeType}>{fee.type}</span></td>
                  <td style={s.td}>Semester {fee.semester}</td>
                  <td style={s.td}>{fee.academicYear}</td>
                  <td style={s.td}><strong>{fee.amount.toLocaleString()}</strong></td>
                  <td style={s.td}>{fee.paid.toLocaleString()}</td>
                  <td style={{ ...s.td, color: fee.balance > 0 ? '#dc2626' : '#16a34a', fontWeight: '600' }}>
                    {fee.balance.toLocaleString()}
                  </td>
                  <td style={s.td}>
                    <span style={{ color: fee.isOverdue ? '#dc2626' : '#64748b' }}>
                      {new Date(fee.dueDate).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {fee.isOverdue && <span style={{ fontSize: '10px', display: 'block', color: '#dc2626' }}>{fee.daysOverdue}d overdue</span>}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: statusBg[fee.status], color: statusColor[fee.status] }}>
                      {fee.status}
                    </span>
                  </td>
                  <td style={s.td}>
                    {fee.receiptNumber
                      ? <span style={{ fontSize: '11px', color: '#2563eb', fontFamily: 'monospace' }}>{fee.receiptNumber}</span>
                      : <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

const s = {
  center:      { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#64748b' },
  header:      { marginBottom: '24px' },
  pageTitle:   { fontSize: '26px', fontWeight: '800', color: '#1e3c72', fontFamily: 'Georgia, serif' },
  sub:         { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  summaryRow:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '16px' },
  statCard:    { background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'center' },
  statLabel:   { fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' },
  statValue:   { fontSize: '18px', fontWeight: '800' },
  progressCard:{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px' },
  barBg:       { height: '10px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' },
  barFill:     { height: '100%', background: 'linear-gradient(90deg, #1e3c72, #2a9d8f)', borderRadius: '6px', transition: 'width 0.6s ease' },
  clearedMsg:  { marginTop: '10px', fontSize: '13px', color: '#16a34a', fontWeight: '600' },
  card:        { background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'auto' },
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  th:          { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#f8fafc', whiteSpace: 'nowrap' },
  tr:          { borderBottom: '1px solid #f1f5f9' },
  td:          { padding: '12px 14px', fontSize: '13px', color: '#334155', verticalAlign: 'middle' },
  feeType:     { background: '#f0f4ff', color: '#1e3c72', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' },
  empty:       { textAlign: 'center', padding: '80px 20px', color: '#1e3c72' },
};

export default Fees;