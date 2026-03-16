const StatCard = ({ label, value, icon, color = '#1e3c72', bg, trend, sub }) => (
  <div style={{ background: bg || '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(30,60,114,0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</p>
      {icon && <span style={{ fontSize: '20px', width: '36px', height: '36px', background: `${color}12`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>}
    </div>
    <p style={{ fontSize: '28px', fontWeight: '800', color, lineHeight: 1 }}>{value}</p>
    {(sub || trend !== undefined) && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {trend !== undefined && <span style={{ fontSize: '11px', fontWeight: '600', color: trend >= 0 ? '#28a745' : '#dc3545' }}>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
        {sub && <span style={{ fontSize: '11px', color: '#94a3b8' }}>{sub}</span>}
      </div>
    )}
  </div>
);
export default StatCard;
