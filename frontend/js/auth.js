/**
 * Auth page logic — Login & Register
 */
function initAuth() {
  document.getElementById('app').innerHTML = `
    <div id="auth-page">
      <div class="auth-box">
        <div class="logo">
          <h1>🔐 CogniVault</h1>
          <p>Secure Research Data Vault</p>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab active" id="tab-login" onclick="switchTab('login')">Login</button>
          <button class="auth-tab" id="tab-register" onclick="switchTab('register')">Register</button>
        </div>

        <!-- Login Form -->
        <div id="form-login">
          <div class="form-group">
            <label>Email</label>
            <input id="login-email" type="email" placeholder="you@example.com" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input id="login-password" type="password" placeholder="••••••••" />
          </div>
          <button class="btn btn-primary" style="width:100%;margin-top:8px" id="btn-login" onclick="handleLogin()">
            Login
          </button>
          <p class="text-muted" style="text-align:center;margin-top:16px;font-size:12px">
            Demo: admin@test.com / Admin@1234
          </p>
        </div>

        <!-- Register Form -->
        <div id="form-register" style="display:none">
          <div class="form-group">
            <label>Full Name</label>
            <input id="reg-name" placeholder="Jane Doe" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input id="reg-email" type="email" placeholder="you@example.com" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input id="reg-password" type="password" placeholder="Min 8 chars, upper+lower+number+symbol" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select id="reg-role">
              <option value="researcher">Researcher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button class="btn btn-primary" style="width:100%;margin-top:8px" id="btn-register" onclick="handleRegister()">
            Create Account
          </button>
        </div>
      </div>
    </div>
    <div id="toast-container"></div>
  `;

  // Allow Enter key to submit
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const activeTab = document.getElementById('tab-login').classList.contains('active');
      activeTab ? handleLogin() : handleRegister();
    }
  });
}

function switchTab(tab) {
  document.getElementById('form-login').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active',    tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { toast.show('Email and password required', 'error'); return; }

  const btn = document.getElementById('btn-login');
  btn.innerHTML = '<span class="spinner"></span> Logging in...';
  btn.disabled = true;

  const res = await api.login({ email, password });
  btn.innerHTML = 'Login'; btn.disabled = false;

  if (res?.ok) {
    const { accessToken, refreshToken, user } = res.data.data;
    api.setTokens(accessToken, refreshToken);
    api.setUser(user);
    toast.show(`Welcome back, ${user.name}!`, 'success');
    setTimeout(() => initApp(), 500);
  } else {
    toast.show(res?.data?.message || 'Login failed', 'error');
  }
}

async function handleRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role     = document.getElementById('reg-role').value;

  if (!name || !email || !password) { toast.show('All fields required', 'error'); return; }

  const btn = document.getElementById('btn-register');
  btn.innerHTML = '<span class="spinner"></span> Creating...';
  btn.disabled = true;

  const res = await api.register({ name, email, password, role });
  btn.innerHTML = 'Create Account'; btn.disabled = false;

  if (res?.ok) {
    toast.show('Account created! Please login.', 'success');
    switchTab('login');
    document.getElementById('login-email').value = email;
  } else {
    toast.show(res?.data?.message || 'Registration failed', 'error');
  }
}
