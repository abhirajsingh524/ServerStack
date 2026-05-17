import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import Login     from '../pages/Login';
import Register  from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Upload    from '../pages/Upload';
import DataVault from '../pages/DataVault';
import Users     from '../pages/Users';
import Logs      from '../pages/Logs';
import Profile   from '../pages/Profile';
import Layout    from '../components/Layout';

// ── Protected Route ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
};

// ── Public Route — redirect if already logged in ──────────────────────────────
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

    {/* Protected — inside Layout (sidebar + topbar) */}
    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index                element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard"     element={<Dashboard />} />
      <Route path="upload"        element={<Upload />} />
      <Route path="vault"         element={<DataVault />} />
      <Route path="profile"       element={<Profile />} />
      <Route path="users"         element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
      <Route path="logs"          element={<ProtectedRoute adminOnly><Logs /></ProtectedRoute>} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default AppRoutes;
