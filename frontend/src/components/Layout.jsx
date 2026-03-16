import { useState } from 'react';
import Navbar  from './Navbar';
import Sidebar from './Sidebar';
import Footer  from './Footer';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar open={sidebarOpen} />
        <main style={{
          flex:       1,
          marginLeft: sidebarOpen ? 'var(--sidebar-w)' : '0',
          transition: 'margin-left 0.25s ease',
          padding:    '28px',
          minHeight:  'calc(100vh - var(--navbar-h))',
          background: 'var(--bg)',
        }}>
          {children}
        </main>
      </div>
      <div style={{ marginLeft: sidebarOpen ? 'var(--sidebar-w)' : '0', transition: 'margin-left 0.25s ease' }}>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;