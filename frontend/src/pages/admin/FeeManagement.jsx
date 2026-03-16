import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getAllFees, getFeeStats, recordPayment, waiveFee } from '../../services/api';

const statusColor = { paid: '#16a34a', partial: '#d97706', pending: '#64748b', overdue: '#dc2626', waived: '#6f42c1' };
const statusBg    = { paid: '#f0fdf4', partial: '#fffbeb', pending: '#f8fafc', overdue: '#fef2f2', waived: '#f5f3ff' };

const FeeManagement = () => {
  const [fees,    setFees]    = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [paying,  setPaying]  = useState(false);

  const load = () => {
    Promise.all([getAllFees(), getFeeStats()])
      .then(([{ data: f }, { data: s }]) => { setFees(f.fees || []); setStats(s); })
      .catch(() => toast.error('Failed to load fees'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePay = async () => {
    if (!payAmount || Number(payAmount) <= 0) { toast.error('Enter valid amount'); return; }
    try {
      setPaying(true);
      await recordPayment(payModal._id, { amount: Number(payAmount), paymentMethod: 'cash', receiptNumber: `RCP${Date.now()}` });
      toast.success('Payment recorded!');
      setPayModal(null);
      setPayAmount('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setPaying(false);
    }
  };

  const handleWaive = async (id) => {
    const reason = window.prompt('Reason for waiving:');
    if (!reason) return;
    try {
      await waiveFee(id, { reason });
      toast.success('Fee waived');
      load();
    } catch {
      toast.error('Failed to waive');
    }
  };

  const filtered = filter === 'all' ? fees : fees.filter(f => f.status === filter);

  if (loading) return <Layout><div style={s.center}>⏳ Loading...</div></Layout>;

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.pageTitle}>💰 Fee Management</h1>
        <p style={s.sub}>Fee collection in Tanzanian Shilling (TZS)</p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={s.statsRow}>
          {[
            { label: 'Total Invoiced',   value: stats.totalInvoicedFormatted,  color: '#1e3c72' },
            { label: 'Total Collected',  value: stats.totalCollectedFormatted, color: '#16a34a' },
            { label: 'Balance Due',      value: stats.totalBalanceFormatted,   color: '#dc2626' },
            { label: 'Collection Rate',  value: `${stats.collectionRate}%`,    color: stats.collectionRate >= 80 ? '#16a34a' : '#d97706' },
          ].map(stat => (
            <div key={stat.label} style={s.statCard}>
              <p style={s.statLabel}>{stat.label}</p>
              <p style={{ ...s.statValue, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div style={s.filterRow}>
        {['all','pending','partial','paid','overdue','waived'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span style={{ marginLeft: '4px', opacity: 0.7 }}>({f === 'all' ? fees.length : fees.filter(fee => fee.status === f).length})</span>
          </button>
        ))}
      </div>

      <div style={s.card}>
        <table style={s.table}>
          <thead>
            <tr>
              {['Student','Reg No.','Type','Semester','Amount (TZS)','Paid (TZS)','Balance (TZS)','Due Date','Status','Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No fee records found</td></tr>
            ) : filtered.map(fee => (
              <tr key={fee._id} style={s.tr}>
                <td style={s.td}><strong>{fee.student?.user?.name}</strong></td>
                <td style={s.td}><span style={s.regNo}>{fee.student?.studentId}</span></td>
                <td style={s.td}><span style={s.feeType}>{fee.type}</span></td>
                <td style={s.td}>Sem {fee.semester}</td>
                <td style={s.td}>{fee.amount.toLocaleString()}</td>
                <td style={s.td}>{fee.paid.toLocaleString()}</td>
                <td style={{ ...s.td, color: fee.balance > 0 ? '#dc2626' : '#16a34a', fontWeight: '600' }}>
                  {fee.balance.toLocaleString()}
                </td>
                <td style={s.td}>{new Date(fee.dueDate).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td style={s.td}>
                  <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: statusBg[fee.status], color: statusColor[fee.status] }}>
                    {fee.status}
                  </span>
                </td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {fee.status !== 'paid' && fee.status !== 'waived' && (
                      <button onClick={() => { setPayModal(fee); setPayAmount(fee.balance.toString()); }} style={s.payBtn}>Pay</button>
                    )}
                    {fee.status !== 'waived' && fee.status !== 'paid' && (
                      <button onClick={() => handleWaive(fee._id)} style={s.waiveBtn}>Waive</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment modal */}
      {payModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>Record Payment</h3>
            <p style={s.modalSub}>{payModal.student?.user?.name} · {payModal.type} fee</p>
            <p style={s.modalBalance}>Balance: <strong style={{ color: '#dc2626' }}>TZS {payModal.balance.toLocaleString()}</strong></p>
            <label style={s.label}>Payment Amount (TZS)</label>
            <input style={s.input} type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Enter amount" autoFocus />
            <div style={s.modalBtns}>
              <button onClick={() => setPayModal(null)} style={s.cancelBtn}>Cancel</button>
              <button onClick={handlePay} style={s.confirmBtn} disabled={paying}>{paying ? 'Processing...' : 'Confirm Payment'}</button>
            </div>
          </div>
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
  statsRow:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' },
  statCard:    { background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'center' },
  statLabel:   { fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' },
  statValue:   { fontSize: '18px', fontWeight: '800' },
  filterRow:   { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  filterBtn:   { padding: '7px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', color: '#64748b' },
  filterActive:{ background: '#1e3c72', color: '#fff', border: '1px solid #1e3c72' },
  card:        { background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'auto' },
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: '1000px' },
  th:          { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#f8fafc', whiteSpace: 'nowrap' },
  tr:          { borderBottom: '1px solid #f1f5f9' },
  td:          { padding: '11px 14px', fontSize: '13px', color: '#334155', verticalAlign: 'middle' },
  regNo:       { fontFamily: 'monospace', fontSize: '11px', background: '#f0f4ff', color: '#1e3c72', padding: '2px 7px', borderRadius: '5px', fontWeight: '600' },
  feeType:     { background: '#f0f4ff', color: '#1e3c72', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' },
  payBtn:      { padding: '5px 12px', background: '#e8f5e9', color: '#16a34a', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  waiveBtn:    { padding: '5px 12px', background: '#f5f3ff', color: '#6f42c1', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  overlay:     { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:       { background: '#fff', borderRadius: '16px', padding: '32px', width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle:  { fontSize: '18px', fontWeight: '800', color: '#1e3c72', marginBottom: '6px' },
  modalSub:    { fontSize: '13px', color: '#64748b', marginBottom: '8px' },
  modalBalance:{ fontSize: '14px', color: '#334155', marginBottom: '20px' },
  label:       { display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' },
  input:       { width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '20px', color: '#1e3c72' },
  modalBtns:   { display: 'flex', gap: '10px' },
  cancelBtn:   { flex: 1, padding: '11px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  confirmBtn:  { flex: 1, padding: '11px', background: '#1e3c72', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
};

export default FeeManagement;