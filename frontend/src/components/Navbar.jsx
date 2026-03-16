import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { markAllNotifAsRead, getMyNotifications } from '../services/api';
import { useEffect } from 'react';

const Navbar = ({ onMenuToggle }) => {
  const { user, logout, isAdmin, isFaculty, isStudent } = useAuth();
  const navigate  = useNavigate();
  const [unread,  setUnread]  = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [notifs,  setNotifs]  = useState([]);

  useEffect(() => {
    if (user) {
      getMyNotifications()
        .then(({ data }) => {
          setUnread(data.unreadCount);
          setNotifs(data.notifications.slice(0, 5));
        })
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    await markAllNotifAsRead();
    setUnread(0);
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const roleColor = {
    admin:   '#ff7e5f',
    faculty: '#2a9d8f',
    student: '#1e3c72',
    staff:   '#6f42c1',
  };

  const roleHome = {
    admin:   '/admin',
    faculty: '/faculty',
    student: '/student',
    staff:   '/admin',
  };

  return (
    <nav style={styles.nav}>

      {/* Left — hamburger + logo */}
      <div style={styles.left}>
        <button style={styles.menuBtn} onClick={onMenuToggle}>
          ☰
        </button>
        <Link to={user ? roleHome[user.role] : '/'} style={styles.logo}>
          <span style={styles.logoIcon}>🎓</span>
          <div>
            <span style={styles.logoText}>SmartUni</span>
            <span style={styles.logoSub}>Management System</span>
          </div>
        </Link>
      </div>

      {/* Right — notifications + user */}
      {user && (
        <div style={styles.right}>

          {/* Notification bell */}
          <div style={{ position: 'relative' }}>
            <button
              style={styles.iconBtn}
              onClick={() => setShowNotif(!showNotif)}
            >
              🔔
              {unread > 0 && (
                <span style={styles.badge}>{unread > 9 ? '9+' : unread}</span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotif && (
              <div style={styles.notifDropdown}>
                <div style={styles.notifHeader}>
                  <span style={styles.notifTitle}>Notifications</span>
                  {unread > 0 && (
                    <button style={styles.markReadBtn} onClick={handleMarkAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                {notifs.length === 0 ? (
                  <p style={styles.notifEmpty}>No notifications</p>
                ) : notifs.map(n => (
                  <div key={n._id} style={{
                    ...styles.notifItem,
                    background: n.isRead ? '#fff' : '#f0f7ff',
                  }}>
                    <p style={styles.notifItemTitle}>{n.title}</p>
                    <p style={styles.notifItemMsg}>{n.message}</p>
                    <p style={styles.notifItemTime}>
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User info */}
          <div style={styles.userArea}>
            <div style={{
              ...styles.avatar,
              background: roleColor[user.role] || '#1e3c72',
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={styles.userInfo}>
              <p style={styles.userName}>{user.name}</p>
              <span style={{
                ...styles.roleBadge,
                background: `${roleColor[user.role]}20`,
                color:       roleColor[user.role],
              }}>
                {user.role}
              </span>
            </div>
          </div>

          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>

        </div>
      )}
    </nav>
  );
};

const styles = {
  nav: {
    height:         'var(--navbar-h)',
    background:     'var(--white)',
    borderBottom:   '1px solid var(--border)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '0 24px',
    position:       'sticky',
    top:            0,
    zIndex:         100,
    boxShadow:      'var(--shadow-sm)',
  },
  left:     { display: 'flex', alignItems: 'center', gap: '16px' },
  menuBtn:  { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '6px' },
  logo:     { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' },
  logoIcon: { fontSize: '24px' },
  logoText: { display: 'block', fontSize: '17px', fontWeight: '800', color: 'var(--navy)', fontFamily: 'var(--font-serif)', lineHeight: 1 },
  logoSub:  { display: 'block', fontSize: '9px', color: 'var(--text-light)', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '2px' },

  right:    { display: 'flex', alignItems: 'center', gap: '12px' },
  iconBtn:  { position: 'relative', background: 'var(--bg)', border: 'none', fontSize: '18px', cursor: 'pointer', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badge:    { position: 'absolute', top: '-4px', right: '-4px', background: 'var(--danger)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '10px', minWidth: '16px', textAlign: 'center' },

  notifDropdown: { position: 'absolute', top: '48px', right: 0, width: '320px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 200, overflow: 'hidden' },
  notifHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' },
  notifTitle:    { fontSize: '13px', fontWeight: '700', color: 'var(--text)' },
  markReadBtn:   { fontSize: '11px', color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' },
  notifEmpty:    { padding: '24px', textAlign: 'center', color: 'var(--text-light)', fontSize: '13px' },
  notifItem:     { padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' },
  notifItemTitle:{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', marginBottom: '3px' },
  notifItemMsg:  { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', lineHeight: '1.4' },
  notifItemTime: { fontSize: '10px', color: 'var(--text-light)' },

  userArea:  { display: 'flex', alignItems: 'center', gap: '8px' },
  avatar:    { width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '14px', flexShrink: 0 },
  userInfo:  { display: 'flex', flexDirection: 'column' },
  userName:  { fontSize: '13px', fontWeight: '600', color: 'var(--text)', lineHeight: 1.2 },
  roleBadge: { fontSize: '10px', padding: '2px 7px', borderRadius: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px', display: 'inline-block' },
  logoutBtn: { background: 'transparent', border: '1px solid #fecaca', color: 'var(--danger)', padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: '500' },
};

export default Navbar;