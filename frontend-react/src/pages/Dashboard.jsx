import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService, adminService } from '../services/dataService';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import styles from './Dashboard.module.css';

const StatCard = ({ icon, value, label, color }) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon} style={{ background: color }}>{icon}</div>
    <div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  </div>
);

const PIPELINE_STEPS = [
  { id: 'client',   icon: '💻', label: 'Client' },
  { id: 'rate',     icon: '🛡️', label: 'Rate Limit' },
  { id: 'helmet',   icon: '⛑️', label: 'Helmet' },
  { id: 'auth',     icon: '🔑', label: 'JWT Auth' },
  { id: 'rbac',     icon: '👮', label: 'RBAC' },
  { id: 'validate', icon: '✅', label: 'Validate' },
  { id: 'service',  icon: '⚙️', label: 'Service' },
  { id: 'encrypt',  icon: '🔐', label: 'AES-256' },
  { id: 'db',       icon: '🗄️', label: 'MongoDB' },
  { id: 'log',      icon: '📋', label: 'Audit Log' },
  { id: 'res',      icon: '📤', label: 'Response' },
];

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState({});
  const [pipelineMsg, setPipelineMsg] = useState('Click "Run Demo" to visualize the API pipeline');

  useEffect(() => {
    const load = async () => {
      try {
        const [d, u] = await Promise.all([
          dataService.fetchData({ limit: 5 }),
          isAdmin ? adminService.getUsers() : Promise.resolve([]),
        ]);
        setData(d);
        setUsers(u);
      } catch { /* handled by interceptor */ }
      finally { setLoading(false); }
    };
    load();
  }, [isAdmin]);

  const runPipeline = async () => {
    setPipeline({});
    const msgs = [
      'Sending request...', 'Rate limit check passed ✓', 'Security headers applied ✓',
      'JWT token verified ✓', 'Role permissions checked ✓', 'Input schema validated ✓',
      'Business logic executed ✓', 'Data encrypted with AES-256-GCM ✓',
      'Written to MongoDB ✓', 'Audit log recorded ✓', '✅ Response sent!',
    ];
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 320));
      setPipeline(p => ({ ...p, [PIPELINE_STEPS[i].id]: 'active' }));
      setPipelineMsg(msgs[i]);
      await new Promise(r => setTimeout(r, 100));
      setPipeline(p => ({ ...p, [PIPELINE_STEPS[i].id]: 'done' }));
    }
    setPipelineMsg('🎉 Full pipeline completed successfully!');
  };

  if (loading) return <div className={styles.center}><Spinner size={32} /></div>;

  const records = data?.records || [];
  const total   = data?.pagination?.total || 0;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.sub}>Welcome back, <strong>{user?.name}</strong> · <Badge value={user?.role} /></p>
        </div>
        <button className={styles.btnPrimary} onClick={() => navigate('/upload')}>
          + Upload Data
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard icon="🗄️" value={total}        label="Total Records"   color="rgba(108,99,255,.15)" />
        <StatCard icon="🔒" value={records.filter(r=>r.accessLevel==='private').length} label="Private" color="rgba(255,77,109,.15)" />
        <StatCard icon="🔗" value={records.filter(r=>r.accessLevel==='shared').length}  label="Shared"  color="rgba(255,169,77,.15)" />
        <StatCard icon="🌐" value={records.filter(r=>r.accessLevel==='public').length}  label="Public"  color="rgba(64,201,126,.15)" />
        {isAdmin && <StatCard icon="👥" value={users.length} label="Total Users" color="rgba(0,212,170,.15)" />}
      </div>

      {/* Pipeline */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>🔄 API Pipeline Flow</h2>
          <button className={styles.btnOutline} onClick={runPipeline}>▶ Run Demo</button>
        </div>
        <p className={styles.pipelineMsg}>{pipelineMsg}</p>
        <div className={styles.pipeline}>
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.id} className={styles.pipelineStep}>
              <div className={`${styles.stepBox} ${pipeline[step.id] === 'active' ? styles.stepActive : ''} ${pipeline[step.id] === 'done' ? styles.stepDone : ''}`}>
                <span>{step.icon}</span>
                <span>{step.label}</span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && <div className={styles.arrow}>›</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Records */}
      <div className={styles.card} style={{ marginTop: 20 }}>
        <div className={styles.cardHeader}>
          <h2>📁 Recent Records</h2>
          <button className={styles.btnOutline} onClick={() => navigate('/vault')}>View All</button>
        </div>
        {records.length === 0 ? (
          <div className={styles.empty}>
            <div>📭</div>
            <p>No records yet. <button className={styles.link} onClick={() => navigate('/upload')}>Upload your first record</button></p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>Title</th><th>Access</th><th>Owner</th><th>Created</th></tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r._id}>
                  <td><strong>{r.title}</strong></td>
                  <td><Badge value={r.accessLevel} /></td>
                  <td className={styles.muted}>{r.ownerId?.name || '—'}</td>
                  <td className={styles.muted}>{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
