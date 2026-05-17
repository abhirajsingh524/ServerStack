import { useEffect, useState, useCallback } from 'react';
import { dataService } from '../services/dataService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import styles from './DataVault.module.css';

const DataVault = () => {
  const navigate = useNavigate();
  const [data,    setData]    = useState({ records: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await dataService.fetchData({ limit: 20 });
      setData(result);
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleView = async (id) => {
    setViewLoading(true);
    try {
      const record = await dataService.fetchById(id);
      setViewing(record);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load record');
    } finally { setViewLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record? This cannot be undone.')) return;
    try {
      await dataService.deleteData(id);
      toast.success('Record deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <div className={styles.center}><Spinner size={32} /></div>;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1>Data Vault</h1>
          <p>{data.pagination?.total || 0} records</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => navigate('/upload')}>+ Upload</button>
      </div>

      {data.records.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.empty}>
            <div>🗄️</div>
            <p>No records yet.</p>
            <button className={styles.btnPrimary} onClick={() => navigate('/upload')}>Upload First Record</button>
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr><th>Title</th><th>Description</th><th>Access</th><th>Tags</th><th>Owner</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {data.records.map(r => (
                <tr key={r._id}>
                  <td><strong>{r.title}</strong></td>
                  <td className={styles.muted}>{r.description ? r.description.slice(0, 40) + (r.description.length > 40 ? '…' : '') : '—'}</td>
                  <td><Badge value={r.accessLevel} /></td>
                  <td>{(r.tags || []).map(t => <span key={t} className={styles.tag}>{t}</span>)}</td>
                  <td className={styles.muted}>{r.ownerId?.name || '—'}</td>
                  <td className={styles.muted}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.btnSm} onClick={() => handleView(r._id)} disabled={viewLoading}>
                        {viewLoading ? <Spinner size={12} /> : '👁'}
                      </button>
                      <button className={styles.btnSmDanger} onClick={() => handleDelete(r._id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {viewing && (
        <div className={styles.overlay} onClick={() => setViewing(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Record Details</h3>
              <button className={styles.closeBtn} onClick={() => setViewing(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailRow}><span>Title</span><strong>{viewing.title}</strong></div>
              {viewing.description && <div className={styles.detailRow}><span>Description</span><span>{viewing.description}</span></div>}
              <div className={styles.detailRow}><span>Access</span><Badge value={viewing.accessLevel} /></div>
              <div className={styles.detailRow}><span>Created</span><span>{new Date(viewing.createdAt).toLocaleString()}</span></div>
              {viewing.tags?.length > 0 && (
                <div className={styles.detailRow}>
                  <span>Tags</span>
                  <div>{viewing.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}</div>
                </div>
              )}
              {viewing.decryptedData && (
                <div className={styles.field}>
                  <span className={styles.decryptLabel}>🔓 Decrypted Data</span>
                  <pre className={styles.pre}>{JSON.stringify(viewing.decryptedData, null, 2)}</pre>
                </div>
              )}
              {viewing.fileUrl && (
                <div className={styles.detailRow}>
                  <span>📎 File</span>
                  <span>{viewing.fileOriginalName || viewing.fileUrl}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataVault;
