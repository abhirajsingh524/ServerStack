import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import toast from 'react-hot-toast';
import { Lock, Upload as UploadIcon, FileText, Tag } from 'lucide-react';
import Spinner from '../components/Spinner';
import styles from './Upload.module.css';

const Upload = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', jsonData: '',
    accessLevel: 'private', tags: '', file: null,
  });
  const [loading, setLoading] = useState(false);
  const [jsonError, setJsonError] = useState('');

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validateJson = (val) => {
    if (!val.trim()) { setJsonError(''); return true; }
    try { JSON.parse(val); setJsonError(''); return true; }
    catch { setJsonError('Invalid JSON format'); return false; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (form.jsonData && !validateJson(form.jsonData)) return;

    setLoading(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const jsonData = form.jsonData.trim() ? JSON.parse(form.jsonData) : undefined;

      await dataService.uploadData({
        title:       form.title,
        description: form.description,
        jsonData,
        accessLevel: form.accessLevel,
        tags,
        file:        form.file,
      });

      toast.success('🔐 Data uploaded and encrypted successfully!');
      navigate('/vault');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Upload Secure Data</h1>
        <p>Your data is encrypted with AES-256-GCM before storage</p>
      </div>

      {/* Security indicator */}
      <div className={styles.securityBanner}>
        <Lock size={16} color="var(--success)" />
        <span>🔐 Secured Upload — data encrypted at rest · access controlled by RBAC · audit logged</span>
      </div>

      <div className={styles.grid}>
        {/* Form */}
        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label><FileText size={14} /> Title *</label>
            <input placeholder="e.g. Genome Study 2024" value={form.title} onChange={set('title')} />
          </div>

          <div className={styles.field}>
            <label>Description</label>
            <textarea rows={3} placeholder="Optional description..." value={form.description} onChange={set('description')} />
          </div>

          <div className={styles.field}>
            <label>JSON Data <span className={styles.hint}>(will be AES-256-GCM encrypted)</span></label>
            <textarea
              rows={5}
              placeholder={'{\n  "key": "value",\n  "data": [1, 2, 3]\n}'}
              value={form.jsonData}
              onChange={e => { set('jsonData')(e); validateJson(e.target.value); }}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
            {jsonError && <span className={styles.error}>{jsonError}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Access Level</label>
              <select value={form.accessLevel} onChange={set('accessLevel')}>
                <option value="private">🔒 Private</option>
                <option value="shared">🔗 Shared</option>
                <option value="public">🌐 Public</option>
              </select>
            </div>
            <div className={styles.field}>
              <label><Tag size={14} /> Tags (comma separated)</label>
              <input placeholder="genomics, 2024, research" value={form.tags} onChange={set('tags')} />
            </div>
          </div>

          <div className={styles.field}>
            <label>File Attachment <span className={styles.hint}>(optional, max 10MB)</span></label>
            <input
              type="file"
              accept=".pdf,.json,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
              onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))}
              style={{ padding: '8px' }}
            />
            {form.file && <span className={styles.fileName}>📎 {form.file.name}</span>}
          </div>

          <button className={styles.submitBtn} disabled={loading || !!jsonError}>
            {loading ? <Spinner size={16} /> : <><UploadIcon size={16} /> Upload & Encrypt</>}
          </button>
        </form>

        {/* Workflow info */}
        <div className={styles.workflow}>
          <h3>How it works</h3>
          {[
            { icon: '1️⃣', title: 'You submit data', desc: 'Title, JSON payload, or file attachment' },
            { icon: '2️⃣', title: 'JWT verified',    desc: 'Your token is validated server-side' },
            { icon: '3️⃣', title: 'Input validated', desc: 'Joi schema validation on all fields' },
            { icon: '4️⃣', title: 'AES-256-GCM',     desc: 'JSON data encrypted before DB write' },
            { icon: '5️⃣', title: 'Stored securely', desc: 'Saved to MongoDB with access controls' },
            { icon: '6️⃣', title: 'Audit logged',    desc: 'Action recorded with IP + timestamp' },
          ].map(s => (
            <div key={s.icon} className={styles.step}>
              <span className={styles.stepIcon}>{s.icon}</span>
              <div>
                <div className={styles.stepTitle}>{s.title}</div>
                <div className={styles.stepDesc}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Upload;
