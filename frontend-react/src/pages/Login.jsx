import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Shield, Eye, EyeOff } from 'lucide-react';
import styles from './Auth.module.css';
import Spinner from '../components/Spinner';

const Login = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Shield size={32} color="var(--accent)" />
          <h1>CogniVault</h1>
          <p>Secure Research Data Vault</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label>Password</label>
            <div className={styles.pwWrap}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className={styles.submitBtn} disabled={loading}>
            {loading ? <Spinner size={16} /> : 'Login'}
          </button>
        </form>

        <p className={styles.switchText}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        <div className={styles.demo}>
          <span>Demo credentials:</span>
          <code>admin@test.com / Admin@1234</code>
        </div>
      </div>
    </div>
  );
};

export default Login;
