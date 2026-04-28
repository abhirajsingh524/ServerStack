/**
 * CogniVault Dashboard — App Shell
 */
function initApp() {
  const user = api.getUser();
  const isAdmin = user?.role === 'admin';

  document.getElementById('app').innerHTML = `
    <!-- Sidebar -->
    <nav id="sidebar">
      <div class="sidebar-logo">
        <h2>🔐 CogniVault</h2>
        <span>ServerStack v1.0</span>
      </div>

      <span class="nav-section">Main</span>
      <a class="nav-item" data-page="dashboard" onclick="router.navigate('dashboard')">
        <span class="icon">📊</span><span>Dashboard</span>
      </a>
      <a class="nav-item" data-page="data" onclick="router.navigate('data')">
        <span class="icon">🗄️</span><span>Data Vault</span>
      </a>

      ${isAdmin ? `
      <span class="nav-section">Admin</span>
      <a class="nav-item" data-page="users" onclick="router.navigate('users')">
        <span class="icon">👥</span><span>Users</span>
      </a>
      <a class="nav-item" data-page="logs" onclick="router.navigate('logs')">
        <span class="icon">📋</span><span>Audit Logs</span>
      </a>` : ''}

      <span class="nav-section">Account</span>
      <a class="nav-item" data-page="profile" onclick="router.navigate('profile')">
        <span class="icon">👤</span><span>Profile</span>
      </a>
      <a class="nav-item" onclick="window.open('http://localhost:5000/api/docs','_blank')">
        <span class="icon">📖</span><span>API Docs</span>
      </a>

      <div class="sidebar-footer">
        <div id="user-badge">
          <div class="avatar">${user?.name?.charAt(0).toUpperCase() || '?'}</div>
          <div class="info">
            <div class="name">${user?.name || 'User'}</div>
            <div class="role">${user?.role || 'researcher'}</div>
          </div>
          <button id="btn-logout" title="Logout" onclick="handleLogout()">⏻</button>
        </div>
      </div>
    </nav>

    <!-- Main -->
    <div id="main">
      <div id="topbar">
        <div>
          <h1>Dashboard</h1>
          <div class="breadcrumb">Overview & API Pipeline</div>
        </div>
        <div class="flex items-center gap-8">
          <span id="connection-status" style="font-size:12px;color:var(--success)">● Connected</span>
        </div>
      </div>
      <div id="page-content"></div>
    </div>

    <div id="toast-container"></div>
  `;

  // Start on dashboard
  router.navigate('dashboard');

  // Check server connection
  checkConnection();
}

async function checkConnection() {
  try {
    const res = await fetch('http://localhost:5000/health');
    const el = document.getElementById('connection-status');
    if (res.ok) {
      if (el) el.innerHTML = '● Connected';
    } else {
      if (el) { el.innerHTML = '● Server Error'; el.style.color = 'var(--danger)'; }
    }
  } catch {
    const el = document.getElementById('connection-status');
    if (el) { el.innerHTML = '● Offline'; el.style.color = 'var(--danger)'; }
  }
}

async function handleLogout() {
  await api.logout();
  api.clearTokens();
  toast.show('Logged out', 'info');
  setTimeout(() => location.reload(), 600);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (api.getToken()) {
    // Verify token is still valid
    api.getMe().then(res => {
      if (res?.ok) {
        api.setUser(res.data.data);
        initApp();
      } else {
        api.clearTokens();
        initAuth();
      }
    });
  } else {
    initAuth();
  }
});
