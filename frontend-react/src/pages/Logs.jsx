import { useEffect, useState } from 'react';
import { logService } from '../services/dataService';
import toast from 'react-hot-toast';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import styles from './Logs.module.css';

const ACTIONS = ['LOGIN_SUCCESS','LOGIN_FAILED','REGISTER','LOGOUT','TOKEN_REFRESH',
  'DATA_CREATE','DATA_READ','DATA_UPDATE','DATA_DELETE','UNAUTHORIZED_ACCESS','DECRYPT_ACCESS'];

const timeAgo = (d) => {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
};

const Logs = () => {
  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');

  const load = async (action = '') => {
    setLoading(true);
    try {
      const params = { limit: 50, page: 1 };
      if (action) params.action = action;
      const result = await logService.getLogs(params);
      setLogs(result.logs || []);
      setTotal(result.pagination?.total || 0);
    } catch { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (e) => {
    setFilter(e.target.value);
    load(e.target.value);
  };

  const severityColor = { info: 'purple', warn: 'orange', error: 'red' };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1>Audit Logs</h1>
          <p>{total} total entries · auto-deleted after 90 days</p>
        </div>
        <select value={filter} onChange={handleFilter} style={{ width: 200 }}>
          <option value="">All Actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div className={styles.center}><Spinner size={28} /></div>
        ) : logs.length === 0 ? (
          <div className={styles.empty}><div>📋</div><p>No logs found</p></div>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>Action</th><th>Severity</th><th>User</th><th>IP</th><th>Metadata</th><th>Time</th></tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l._id}>
                  <td><span className={styles.action}>{l.action.replace(/_/g,' ')}</span></td>
                  <td><Badge value={l.severity || 'info'} /></td>
                  <td>
                    {l.userId ? (
                      <div>
                        <div className={styles.userName}>{l.userId.name}</div>
                        <div className={styles.muted}>{l.userId.email}</div>
                      </div>
                    ) : <span className={styles.muted}>Anonymous</span>}
                  </td>
                  <td className={styles.muted}>{l.ipAddress || '—'}</td>
                  <td>
                    {Object.keys(l.metadata || {}).length > 0
                      ? <code className={styles.meta}>{JSON.stringify(l.metadata).slice(0, 60)}</code>
                      : <span className={styles.muted}>—</span>}
                  </td>
                  <td className={styles.muted}>{timeAgo(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Logs;
