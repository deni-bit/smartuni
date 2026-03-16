import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = {
  student: [
    { label: 'Dashboard',  icon: '🏠', path: '/student'            },
    { label: 'My Courses', icon: '📚', path: '/student/courses'    },
    { label: 'Attendance', icon: '📋', path: '/student/attendance' },
    { label: 'Grades',     icon: '📊', path: '/student/grades'     },
    { label: 'Fees',       icon: '💰', path: '/student/fees'       },
  ],
  faculty: [
    { label: 'Dashboard',  icon: '🏠', path: '/faculty'            },
    { label: 'My Courses', icon: '📚', path: '/faculty/courses'    },
    { label: 'Attendance', icon: '📋', path: '/faculty/attendance' },
    { label: 'Grades',     icon: '✏️',  path: '/faculty/grades'    },
  ],
  admin: [
    { label: 'Dashboard',    icon: '🏠', path: '/admin'             },
    { label: 'Users',        icon: '👥', path: '/admin/users'       },
    { label: 'Departments',  icon: '🏛️', path: '/admin/departments' },
    { label: 'Courses',      icon: '📚', path: '/admin/courses'     },
    { label: 'Fee Management',icon: '💰',path: '/admin/fees'        },
    { label: 'Reports',      icon: '📊', path: '/admin/reports'     },
  ],
};

const roleColors = {
  admin:   { primary: '#ff7e5f', bg: '#fff4f2', text: '#c94a2a' },
  faculty: { primary: '#2a9d8f', bg: '#f0faf9', text: '#1d6b61' },
  student: { primary: '#1e3c72', bg: '#f0f4ff', text: '#1e3c72' },
};

const Sidebar = ({ open }) => {
  const { user } = useAuth();
  const location  = useLocation();

  if (!user) return null;

  const navItems = NAV[user.role] || [];
  const colors   = roleColors[user.role] || roleColors.student;

  return (
    <aside style={{
      ...styles.sidebar,
      transform: open ? 'translateX(0)' : 'translateX(-100%)',
    }}>

      {/* Role indicator */}
      <div style={{ ...styles.roleBar, background: colors.bg, borderBottom: `2px solid ${colors.primary}20` }}>
        <span style={{ ...styles.roleLabel, color: colors.text, background: `${colors.primary}15` }}>
          {user.role.toUpperCase()} PORTAL
        </span>
      </div>

      {/* Nav items */}
      <nav style={styles.nav}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                ...(isActive ? {
                  background: colors.bg,
                  color:      colors.primary,
                  borderLeft: `3px solid ${colors.primary}`,
                  fontWeight: '600',
                } : {}),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={styles.sidebarFooter}>
        <p style={styles.footerName}>Denis Steven Daudi</p>
        <p style={styles.footerSub}>SmartUni v1.0</p>
      </div>

    </aside>
  );
};

const styles = {
  sidebar: {
    position:   'fixed',
    top:        'var(--navbar-h)',
    left:       0,
    width:      'var(--sidebar-w)',
    height:     'calc(100vh - var(--navbar-h))',
    background: 'var(--white)',
    borderRight:'1px solid var(--border)',
    display:    'flex',
    flexDirection: 'column',
    transition: 'transform 0.25s ease',
    zIndex:     99,
    boxShadow:  '2px 0 8px rgba(30,60,114,0.06)',
    overflowY:  'auto',
  },
  roleBar:   { padding: '14px 20px' },
  roleLabel: { fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', padding: '4px 10px', borderRadius: '6px' },
  nav:       { flex: 1, padding: '10px 0' },
  navItem:   { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 20px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px', fontWeight: '500', borderLeft: '3px solid transparent', transition: 'all 0.15s' },
  navIcon:   { fontSize: '16px', width: '20px', textAlign: 'center' },
  navLabel:  { flex: 1 },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid var(--border)' },
  footerName:    { fontSize: '12px', fontWeight: '600', color: 'var(--text)', fontStyle: 'italic', fontFamily: 'var(--font-serif)' },
  footerSub:     { fontSize: '10px', color: 'var(--text-light)', marginTop: '2px' },
};

export default Sidebar;