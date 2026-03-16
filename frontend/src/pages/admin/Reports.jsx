import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getReportSummary, getEnrollByDept, getGradeDistribution, getFeeCollection, getTopStudents, getFinancialOverview } from '../../services/api';

const Reports = () => {
  const [summary,  setSummary]  = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [gradeData,setGradeData]= useState([]);
  const [feeData,  setFeeData]  = useState(null);
  const [topStuds, setTopStuds] = useState([]);
  const [finData,  setFinData]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('overview');

  useEffect(() => {
    Promise.all([
      getReportSummary(),
      getEnrollByDept(),
      getGradeDistribution(),
      getFeeCollection(),
      getTopStudents({ limit: 10 }),
      getFinancialOverview(),
    ])
      .then(([{ data: s }, { data: d }, { data: g }, { data: f }, { data: t }, { data: fin }]) => {
        setSummary(s); setDeptData(d);
        setGradeData(g.distribution || []);
        setFeeData(f); setTopStuds(t);
        setFinData(fin);
      })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div style={s.center}>⏳ Loading reports...</div></Layout>;

  const tabs = ['overview','enrollment','grades','finance','students'];

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.pageTitle}>📊 Reports & Analytics</h1>
        <p style={s.sub}>Comprehensive institutional data — Academic Year 2025/2026</p>
      </div>

      {/* Tabs */}
      <div style={s.tabRow}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...s.tabBtn, ...(tab === t ? s.tabActive : {}) }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && summary && (
        <div>
          <div style={s.statsGrid}>
            {[
              { label: 'Total Students',  value: summary.totalStudents,             color: '#1e3c72', icon: '👨‍🎓' },
              { label: 'Total Faculty',   value: summary.totalFaculty,              color: '#2a9d8f', icon: '👨‍🏫' },
              { label: 'Active Courses',  value: summary.totalCourses,              color: '#ff7e5f', icon: '📚' },
              { label: 'Departments',     value: summary.totalDepartments,          color: '#6f42c1', icon: '🏛️' },
              { label: 'Avg GPA',         value: summary.avgGpa.toFixed(2),         color: '#16a34a', icon: '📊' },
              { label: 'Attendance Rate', value: `${summary.attendanceRate}%`,      color: '#00838f', icon: '✅' },
              { label: 'Total Invoiced',  value: summary.totalInvoicedFormatted,    color: '#1e3c72', icon: '🧾' },
              { label: 'Total Collected', value: summary.totalCollectedFormatted,   color: '#16a34a', icon: '💵' },
              { label: 'Balance Due',     value: summary.totalBalanceFormatted,     color: '#dc2626', icon: '⚠️' },
              { label: 'Collection Rate', value: `${summary.collectionRate}%`,      color: '#c9a227', icon: '💰' },
              { label: 'Pass Rate',       value: `${summary.passRate}%`,            color: '#16a34a', icon: '🎓' },
              { label: 'Overdue Fees',    value: summary.overdueFees,               color: summary.overdueFees > 0 ? '#dc2626' : '#94a3b8', icon: '🔴' },
            ].map(stat => (
              <div key={stat.label} style={s.statCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={s.statLabel}>{stat.label}</p>
                  <span style={{ fontSize: '18px' }}>{stat.icon}</span>
                </div>
                <p style={{ ...s.statValue, color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Enrollment ── */}
      {tab === 'enrollment' && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Students by Department</h3>
          <table style={s.table}>
            <thead>
              <tr>{['Department','Code','Students','Avg GPA','Share'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {deptData.map(dept => {
                const total = deptData.reduce((s, d) => s + d.count, 0);
                const pct   = total > 0 ? Math.round(dept.count / total * 100) : 0;
                return (
                  <tr key={dept._id} style={s.tr}>
                    <td style={s.td}><strong>{dept.name}</strong></td>
                    <td style={s.td}><span style={s.codeTag}>{dept.code}</span></td>
                    <td style={s.td}><strong style={{ fontSize: '16px', color: '#1e3c72' }}>{dept.count}</strong></td>
                    <td style={s.td}>{dept.avgGpa}</td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#1e3c72', borderRadius: '6px' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e3c72', minWidth: '36px' }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Grades ── */}
      {tab === 'grades' && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Grade Distribution</h3>
          {gradeData.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No approved grades yet</p>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>{['Grade','Count','Percentage','Avg Marks','Distribution'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {gradeData.map(item => (
                  <tr key={item._id} style={s.tr}>
                    <td style={s.td}><span style={{ fontWeight: '800', fontSize: '16px', color: ['A+','A','A-'].includes(item.grade) ? '#16a34a' : ['B+','B','B-'].includes(item.grade) ? '#2563eb' : ['C+','C','C-'].includes(item.grade) ? '#d97706' : '#dc2626' }}>{item.grade || item._id}</span></td>
                    <td style={s.td}>{item.count}</td>
                    <td style={s.td}><strong style={{ color: '#1e3c72' }}>{item.percentage}%</strong></td>
                    <td style={s.td}>{item.avgMarks}</td>
                    <td style={s.td}>
                      <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.percentage}%`, height: '100%', background: '#2a9d8f', borderRadius: '6px' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Finance ── */}
      {tab === 'finance' && feeData && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

            {/* By department */}
            <div style={s.card}>
              <h3 style={s.cardTitle}>Fee Collection by Department</h3>
              <table style={s.table}>
                <thead>
                  <tr>{['Dept','Invoiced','Collected','Rate'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {feeData.byDepartment?.map(dept => (
                    <tr key={dept._id} style={s.tr}>
                      <td style={s.td}><strong>{dept.code}</strong><br/><span style={{ fontSize: '11px', color: '#94a3b8' }}>{dept.name}</span></td>
                      <td style={s.td}>{dept.invoicedFormatted}</td>
                      <td style={s.td}>{dept.collectedFormatted}</td>
                      <td style={s.td}>
                        <span style={{ fontWeight: '700', color: dept.rate >= 80 ? '#16a34a' : '#d97706' }}>{dept.rate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* By month */}
            <div style={s.card}>
              <h3 style={s.cardTitle}>Monthly Collection</h3>
              {feeData.byMonth?.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '13px' }}>No payment data yet</p>
              ) : (
                <table style={s.table}>
                  <thead>
                    <tr>{['Month','Year','Collected','Count'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {feeData.byMonth?.map((m, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.td}>{['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m._id?.month]}</td>
                        <td style={s.td}>{m._id?.year}</td>
                        <td style={s.td}><strong style={{ color: '#16a34a' }}>{m.collectedFormatted}</strong></td>
                        <td style={s.td}>{m.count} payments</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Financial overview by status */}
          {finData && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>Financial Overview by Status</h3>
              <table style={s.table}>
                <thead>
                  <tr>{['Status','Count','Total (TZS)','Paid (TZS)','Balance (TZS)'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {Object.entries(finData.byStatus).map(([status, data]) => data.count > 0 && (
                    <tr key={status} style={s.tr}>
                      <td style={s.td}>
                        <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: { paid: '#f0fdf4', partial: '#fffbeb', pending: '#f8fafc', overdue: '#fef2f2', waived: '#f5f3ff' }[status], color: { paid: '#16a34a', partial: '#d97706', pending: '#64748b', overdue: '#dc2626', waived: '#6f42c1' }[status] }}>
                          {status}
                        </span>
                      </td>
                      <td style={s.td}><strong>{data.count}</strong></td>
                      <td style={s.td}>{data.amountFormatted}</td>
                      <td style={s.td}>{data.paidFormatted}</td>
                      <td style={{ ...s.td, color: data.balance > 0 ? '#dc2626' : '#16a34a', fontWeight: '600' }}>{data.balanceFormatted}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f8fafc', fontWeight: '700' }}>
                    <td style={s.td}><strong>TOTAL</strong></td>
                    <td style={s.td}><strong>{finData.totals.count}</strong></td>
                    <td style={s.td}><strong>{finData.totals.amountFormatted}</strong></td>
                    <td style={{ ...s.td, color: '#16a34a' }}><strong>{finData.totals.paidFormatted}</strong></td>
                    <td style={{ ...s.td, color: '#dc2626' }}><strong>{finData.totals.balanceFormatted}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Top Students ── */}
      {tab === 'students' && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>🏆 Top Students by GPA</h3>
          <table style={s.table}>
            <thead>
              <tr>{['Rank','Reg No.','Name','Department','Year','GPA','Class'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {topStuds.map((student, i) => (
                <tr key={student._id} style={s.tr}>
                  <td style={s.td}>
                    <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: i === 0 ? '#c9a227' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#f1f5f9', color: i < 3 ? '#fff' : '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                      {i + 1}
                    </span>
                  </td>
                  <td style={s.td}><span style={s.regNo}>{student.studentId}</span></td>
                  <td style={s.td}><strong>{student.user?.name}</strong></td>
                  <td style={s.td}>{student.department?.name}</td>
                  <td style={s.td}>{student.yearLabel}</td>
                  <td style={s.td}><strong style={{ fontSize: '16px', color: student.gpa >= 3.5 ? '#16a34a' : student.gpa >= 3.0 ? '#2563eb' : '#d97706' }}>{student.gpa.toFixed(2)}</strong></td>
                  <td style={s.td}>{student.gpaClass}</td>
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
  center:    { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#64748b' },
  header:    { marginBottom: '24px' },
  pageTitle: { fontSize: '26px', fontWeight: '800', color: '#1e3c72', fontFamily: 'Georgia, serif' },
  sub:       { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  tabRow:    { display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '0' },
  tabBtn:    { padding: '10px 20px', background: 'none', border: 'none', fontSize: '14px', fontWeight: '500', color: '#64748b', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: '-2px' },
  tabActive: { color: '#1e3c72', fontWeight: '700', borderBottom: '2px solid #1e3c72' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' },
  statCard:  { background: '#fff', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' },
  statLabel: { fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' },
  statValue: { fontSize: '22px', fontWeight: '800', marginTop: '4px' },
  card:      { background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'auto', marginBottom: '20px' },
  cardTitle: { fontSize: '15px', fontWeight: '700', color: '#1e3c72', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#f8fafc' },
  tr:        { borderBottom: '1px solid #f1f5f9' },
  td:        { padding: '12px 14px', fontSize: '13px', color: '#334155' },
  codeTag:   { fontFamily: 'monospace', fontSize: '11px', background: '#f0f4ff', color: '#1e3c72', padding: '2px 7px', borderRadius: '5px', fontWeight: '700' },
  regNo:     { fontFamily: 'monospace', fontSize: '11px', background: '#f0f4ff', color: '#1e3c72', padding: '2px 7px', borderRadius: '5px', fontWeight: '600' },
};

export default Reports;