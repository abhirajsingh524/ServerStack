import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Upload, Database, Users,
  ScrollText, User, BookOpen, LogOut, Shield,
} from 'lucide-react';
import styles from './Layout.module.css';

const NavItem = ({ to, icon: Icon, label, adminOnly, isAdmin }) => {
  if (adminOnly && !isAdmin) return null;
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${styles.navItem} ${isActive ? styles.active : ''}`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
};

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <nav className={styles.sidebar}>
        <div className={styles.logo}>
          <Shield size={22} color="var(--accent)" />
          <div>
            <div className={styles.logoTitle}>CogniVault</div>
            <div className={styles.logoSub}>ServerStack v1</div>
          </div>
        </div>

        <div className={styles.navSection}>Main</div>
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" isAdmin={isAdmin} />
        <NavItem to="/upload"    icon={Upload}          label="Upload Data" isAdmin={isAdmin} />
        <NavItem to="/vault"     icon={Database}        label="Data Vault"  isAdmin={isAdmin} />

        {isAdmin && <div className={styles.navSection}>Admin</div>}
        <NavItem to="/users" icon={Users}      label="Users"      adminOnly isAdmin={isAdmin} />
        <NavItem to="/logs"  icon={ScrollText} label="Audit Logs" adminOnly isAdmin={isAdmin} />

        <div className={styles.navSection}>Account</div>
        <NavItem to="/profile" icon={User} label="Profile" isAdmin={isAdmin} />
        <a
          href="/api/v1/docs"
          target="_blank"
          rel="noreferrer"
          className={styles.navItem}
        >
          <BookOpen size={18} />
          <span>API Docs</span>
        </a>

        <div className={styles.sidebarFooter}>
          <div className={styles.userBadge}>
            <div className={styles.avatar}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userRole}>{user?.role}</div>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
