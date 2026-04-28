router.register('profile', async () => {
  const user = api.getUser();
  const content = document.getElementById('page-content');

  content.innerHTML = `
    <div style="max-width:560px">
      <div class="card">
        <div class="flex items-center gap-12" style="margin-bottom:24px">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fff;flex-shrink:0">
            ${user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <div style="font-size:20px;font-weight:700">${user?.name || '—'}</div>
            <div class="text-muted">${user?.email || '—'}</div>
            <div style="margin-top:6px">${utils.badge(user?.role || 'researcher', {})}</div>
          </div>
        </div>

        <div style="border-top:1px solid var(--border);padding-top:20px">
          <h3 style="font-size:14px;font-weight:700;margin-bottom:16px">Account Info</h3>
          <div class="grid-2">
            <div class="form-group">
              <label>Full Name</label>
              <input value="${user?.name || ''}" disabled style="opacity:.7" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input value="${user?.email || ''}" disabled style="opacity:.7" />
            </div>
            <div class="form-group">
              <label>Role</label>
              <input value="${user?.role || ''}" disabled style="opacity:.7;text-transform:capitalize" />
            </div>
            <div class="form-group">
              <label>User ID</label>
              <input value="${user?.id || '—'}" disabled style="opacity:.7;font-size:11px" />
            </div>
          </div>
        </div>
      </div>

      <!-- Token Info -->
      <div class="card mt-24">
        <h3 style="font-size:14px;font-weight:700;margin-bottom:16px">🔑 Session Tokens</h3>
        <div class="form-group">
          <label>Access Token (expires in 15 min)</label>
          <div style="position:relative">
            <input id="token-display" value="${api.getToken() || ''}" readonly
              style="font-size:11px;padding-right:80px;font-family:monospace" />
            <button onclick="copyToken()" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:var(--accent);border:none;color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer">Copy</button>
          </div>
        </div>
        <div class="form-group">
          <label>Refresh Token (expires in 7 days)</label>
          <input value="${api.getRefreshToken() ? '••••••••••••••••••••••••' : '—'}" readonly
            style="font-size:11px;font-family:monospace;opacity:.7" />
        </div>
        <button class="btn btn-danger btn-sm mt-16" onclick="handleLogout()">🚪 Logout</button>
      </div>

      <!-- API Quick Test -->
      <div class="card mt-24">
        <h3 style="font-size:14px;font-weight:700;margin-bottom:16px">⚡ Quick API Test</h3>
        <p class="text-muted" style="margin-bottom:16px;font-size:13px">Test a live API call with your current token</p>
        <div class="flex gap-8">
          <button class="btn btn-outline btn-sm" onclick="testHealth()">🏥 Health Check</button>
          <button class="btn btn-outline btn-sm" onclick="testMe()">👤 GET /me</button>
          <button class="btn btn-outline btn-sm" onclick="testData()">📁 GET /data</button>
        </div>
        <pre id="api-test-result" style="margin-top:16px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:14px;font-size:12px;color:var(--accent2);min-height:60px;overflow:auto;display:none"></pre>
      </div>
    </div>
  `;
});

function copyToken() {
  const val = document.getElementById('token-display').value;
  navigator.clipboard.writeText(val).then(() => toast.show('Token copied!', 'success'));
}

async function testHealth() {
  const res = await fetch('http://localhost:5000/health');
  const data = await res.json();
  showResult(data);
}
async function testMe() {
  const res = await api.getMe();
  showResult(res?.data);
}
async function testData() {
  const res = await api.getAllData();
  showResult({ count: res?.data?.data?.length, records: res?.data?.data?.slice(0,2) });
}
function showResult(data) {
  const el = document.getElementById('api-test-result');
  el.style.display = 'block';
  el.textContent = JSON.stringify(data, null, 2);
}

async function handleLogout() {
  await api.logout();
  api.clearTokens();
  toast.show('Logged out successfully', 'info');
  setTimeout(() => location.reload(), 800);
}
