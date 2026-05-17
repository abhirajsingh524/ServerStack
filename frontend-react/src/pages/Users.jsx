import { useEffect, useState } from 'react';
import { adminService } from '../services/dataService';
import toast from 'react-hot-toast';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import styles from './Users.module.css';

const Users = () => {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setUsers(await adminService.getUsers()); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (user) => {
    try {
      if (user.isActive) {
        await adminService.deactivateUser(user._id);
        toast.success(`${user.name} deactivated`);
      } else {
        await adminService.activateUser(user._id);
        toast.success(`${user.name} activated`);
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  if (loading) return <div className={styles.center}><Spinner size={32} /></div>;

  return (
    <div>
      <div className={styles.header}>
        <h1>User Management</h1>
        <p>{users.length} registered users</p>
      </div>
      <div className={styles.card}>
        <table className={styles.table}>
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.avatar}>{u.name.charAt(0).toUpperCase()}</div>
                    <strong>{u.name}</strong>
                  </div>
                </td>
                <td className={styles.muted}>{u.email}</td>
                <td><Badge value={u.role} /></td>
                <td><Badge value={u.isActive ? 'active' : 'inactive'} /></td>
                <td className={styles.muted}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className={u.isActive ? styles.btnDanger : styles.btnSuccess}
                    onClick={() => toggle(u)}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
