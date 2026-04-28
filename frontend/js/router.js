/**
 * CogniVault Client-Side Router
 */
const router = {
  routes: {},
  currentPage: null,

  register(name, fn) { this.routes[name] = fn; },

  navigate(page, params = {}) {
    if (!api.getToken() && page !== 'login') {
      page = 'login';
    }
    if (api.getToken() && page === 'login') {
      page = 'dashboard';
    }

    const user = api.getUser();
    // Restrict admin-only pages
    if (['users', 'logs'].includes(page) && user?.role !== 'admin') {
      page = 'dashboard';
      toast.show('Admin access required', 'error');
    }

    this.currentPage = page;
    this.updateNav(page);
    this.updateTopbar(page);

    const fn = this.routes[page];
    if (fn) fn(params);
    else document.getElementById('page-content').innerHTML =
      `<div class="empty-state"><div class="empty-icon">🔍</div><p>Page not found</p></div>`;
  },

  updateNav(page) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
  },

  updateTopbar(page) {
    const titles = {
      dashboard: ['Dashboard', 'Overview & API Pipeline'],
      data:      ['Data Vault', 'Manage research records'],
      users:     ['User Management', 'Admin — manage researchers'],
      logs:      ['Audit Logs', 'Admin — activity tracking'],
      profile:   ['My Profile', 'Account settings'],
    };
    const [title, sub] = titles[page] || [page, ''];
    const el = document.getElementById('topbar');
    if (el) {
      el.querySelector('h1').textContent = title;
      el.querySelector('.breadcrumb').textContent = sub;
    }
  },
};

// ── Toast Notifications ───────────────────────────────────────────────────
const toast = {
  show(message, type = 'info', duration = 3500) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), duration);
  },
};

// ── Utility Helpers ───────────────────────────────────────────────────────
const utils = {
  timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr);
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  },
  truncate(str, n = 40) {
    return str && str.length > n ? str.slice(0, n) + '…' : str;
  },
  badge(value, map) {
    return `<span class="badge badge-${map[value] || value}">${value}</span>`;
  },
  formatDate(d) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },
};
