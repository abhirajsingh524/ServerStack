import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Shield } from 'lucide-react';
import styles from './Auth.module.css';
import Spinner from '../components/Spinner';

const Register = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'researcher' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Shield size={32} color="var(--accent)" />
          <h1>CogniVault</h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Full Name</label>
            <input placeholder="Jane Doe" value={form.name} onChange={set('name')} />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Min 8 chars, upper+lower+number+symbol"
              value={form.password}
              onChange={set('password')}
            />
          </div>
          <div className={styles.field}>
            <label>Role</label>
            <select value={form.role} onChange={set('role')}>
              <option value="researcher">Researcher</option>
            </select>
          </div>

          <button className={styles.submitBtn} disabled={loading}>
            {loading ? <Spinner size={16} /> : 'Create Account'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
