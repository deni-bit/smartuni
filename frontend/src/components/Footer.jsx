const Footer = () => (
  <footer style={styles.footer}>
    <div style={styles.inner}>
      <span style={styles.left}>
        🎓 SmartUni — University Management System
      </span>
      <span style={styles.credit}>
        Designed & Built by{' '}
        <span style={styles.name}>Denis Steven Daudi</span>
      </span>
    </div>
  </footer>
);

const styles = {
  footer: { background: 'var(--white)', borderTop: '1px solid var(--border)', padding: '14px 24px', marginTop: 'auto' },
  inner:  { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' },
  left:   { fontSize: '12px', color: 'var(--text-muted)' },
  credit: { fontSize: '12px', color: 'var(--text-muted)' },
  name:   { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: '600', color: 'var(--navy)', letterSpacing: '0.5px' },
};

export default Footer;
