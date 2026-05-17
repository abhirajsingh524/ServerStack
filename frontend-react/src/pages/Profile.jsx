import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Badge from '../components/Badge';
import { Copy, LogOut } from 'lucide-react';
import styles from './Profile.module.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const copyToken = () => {
    const t = localStorage.getItem('accessToken');
    if (t) { navigator.clipboard.writeText(t); toast.success('Token copied!'); }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const token = localStorage.getItem('accessToken') || '';

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Profile</h1>

      <div className={styles.card}>
        <div className={styles.userHeader}>
          <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
          <div>
            <div className={styles.name}>{user?.name}</div>
            <div className={styles.email}>{user?.email}</div>
            <div style={{ marginTop: 6 }}><Badge value={user?.role} /></div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.grid}>
          <div className={styles.field}><label>Full Name</label><input value={user?.name || ''} disabled /></div>
          <div className={styles.field}><label>Email</label><input value={user?.email || ''} disabled /></div>
          <div className={styles.field}><label>Role</label><input value={user?.role || ''} disabled /></div>
          <div className={styles.field}><label>User ID</label><input value={user?.id || ''} disabled style={{ fontSize: 11, fontFamily: 'monospace' }} /></div>
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: 20 }}>
        <h3>🔑 Session Token</h3>
        <p className={styles.hint}>Access token expires in 15 minutes. Refresh token rotates automatically.</p>
        <div className={styles.tokenWrap}>
          <input
            value={token ? token.slice(0, 60) + '...' : '—'}
            readOnly
            style={{ fontFamily: 'monospace', fontSize: 11 }}
          />
          <button className={styles.copyBtn} onClick={copyToken}><Copy size={14} /> Copy</button>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
