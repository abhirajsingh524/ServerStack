router.register('dashboard', async () => {
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="empty-state"><div class="spinner"></div></div>`;

  const [dataRes, usersRes] = await Promise.all([
    api.getAllData(),
    api.getUser()?.role === 'admin' ? api.getUsers() : Promise.resolve(null),
  ]);

  const records = dataRes?.data?.data || [];
  const users   = usersRes?.data?.data || [];
  const user    = api.getUser();
  const isAdmin = user?.role === 'admin';

  const privateCount = records.filter(r => r.accessLevel === 'private').length;
  const sharedCount  = records.filter(r => r.accessLevel === 'shared').length;
  const publicCount  = records.filter(r => r.accessLevel === 'public').length;

  content.innerHTML = `
    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(108,99,255,.15)">🗄️</div>
        <div>
          <div class="stat-value">${records.length}</div>
          <div class="stat-label">Total Records</div>
        </div>
      </div>
      ${isAdmin ? `
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(0,212,170,.15)">👥</div>
        <div>
          <div class="stat-value">${users.length}</div>
          <div class="stat-label">Total Users</div>
        </div>
      </div>` : ''}
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(255,77,109,.15)">🔒</div>
        <div>
          <div class="stat-value">${privateCount}</div>
          <div class="stat-label">Private Records</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(64,201,126,.15)">🌐</div>
        <div>
          <div class="stat-value">${sharedCount + publicCount}</div>
          <div class="stat-label">Shared / Public</div>
        </div>
      </div>
    </div>

    <!-- API Pipeline -->
    <div class="card mt-24">
      <div class="section-header">
        <h2>🔄 API Pipeline Flow</h2>
        <button class="btn btn-outline btn-sm" onclick="runPipelineDemo()">▶ Run Demo</button>
      </div>
      <p class="text-muted" style="margin-bottom:20px">Live visualization of the request lifecycle through CogniVault</p>
      <div class="pipeline" id="pipeline-flow">
        ${[
          { id:'step-client',  icon:'💻', label:'Client Request' },
          { id:'step-rate',    icon:'🛡️', label:'Rate Limiter' },
          { id:'step-helmet',  icon:'⛑️', label:'Helmet / CORS' },
          { id:'step-auth',    icon:'🔑', label:'JWT Auth' },
          { id:'step-rbac',    icon:'👮', label:'RBAC Check' },
          { id:'step-validate',icon:'✅', label:'Joi Validate' },
          { id:'step-service', icon:'⚙️', label:'Service Layer' },
          { id:'step-encrypt', icon:'🔐', label:'AES Encrypt' },
          { id:'step-db',      icon:'🗄️', label:'MongoDB' },
          { id:'step-log',     icon:'📋', label:'Audit Log' },
          { id:'step-res',     icon:'📤', label:'Response' },
        ].map((s, i, arr) => `
          <div class="pipeline-step">
            <div class="step-box" id="${s.id}">
              <span class="step-icon">${s.icon}</span>${s.label}
            </div>
          </div>
          ${i < arr.length - 1 ? '<div class="step-arrow"></div>' : ''}
        `).join('')}
      </div>
      <div id="pipeline-status" class="text-muted" style="font-size:13px;margin-top:8px;min-height:20px"></div>
    </div>

    <!-- Recent Records -->
    <div class="card mt-24">
      <div class="section-header">
        <h2>📁 Recent Data Records</h2>
        <button class="btn btn-primary btn-sm" onclick="router.navigate('data')">View All</button>
      </div>
      ${records.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>No records yet. <a href="#" onclick="router.navigate('data')" style="color:var(--accent)">Create one</a></p>
        </div>` : `
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Title</th><th>Access</th><th>Owner</th><th>Created</th>
          </tr></thead>
          <tbody>
            ${records.slice(0, 5).map(r => `
              <tr>
                <td><strong>${utils.truncate(r.title, 35)}</strong></td>
                <td>${utils.badge(r.accessLevel, {})}</td>
                <td class="text-muted">${r.ownerId?.name || '—'}</td>
                <td class="text-muted">${utils.timeAgo(r.createdAt)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    </div>

    <!-- Endpoint Reference -->
    <div class="card mt-24">
      <div class="section-header"><h2>📡 API Endpoint Reference</h2>
        <a href="http://localhost:5000/api/docs" target="_blank" class="btn btn-outline btn-sm">Open Swagger ↗</a>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Method</th><th>Endpoint</th><th>Auth</th><th>Description</th></tr></thead>
          <tbody>
            ${[
              ['POST','green','/api/auth/register','Public','Register new user'],
              ['POST','green','/api/auth/login','Public','Login & get tokens'],
              ['POST','green','/api/auth/refresh','Public','Refresh access token'],
              ['GET','blue','/api/auth/me','JWT','Current user info'],
              ['POST','green','/api/data','JWT','Create data record'],
              ['GET','blue','/api/data','JWT','List records (role-filtered)'],
              ['GET','blue','/api/data/:id','JWT','Get + decrypt record'],
              ['PUT','orange','/api/data/:id','JWT','Update record'],
              ['DELETE','red','/api/data/:id','JWT','Delete record'],
              ['GET','blue','/api/admin/users','Admin','List all users'],
              ['GET','blue','/api/logs','Admin','View audit logs'],
            ].map(([m,c,ep,auth,desc]) => `
              <tr>
                <td><span style="color:var(--${c==='green'?'success':c==='blue'?'accent':c==='orange'?'warn':'danger'});font-weight:700;font-size:11px">${m}</span></td>
                <td><code style="font-size:12px;color:var(--accent2)">${ep}</code></td>
                <td><span class="badge badge-${auth==='Public'?'public':auth==='Admin'?'admin':'researcher'}">${auth}</span></td>
                <td class="text-muted">${desc}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
});

// Pipeline demo animation
async function runPipelineDemo() {
  const steps = ['step-client','step-rate','step-helmet','step-auth','step-rbac','step-validate','step-service','step-encrypt','step-db','step-log','step-res'];
  const labels = ['Sending request...','Rate limit check...','Security headers applied...','Verifying JWT token...','Checking role permissions...','Validating input schema...','Processing business logic...','Encrypting sensitive data...','Writing to MongoDB...','Writing audit log...','✅ Response sent!'];

  // Reset
  steps.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = 'step-box';
  });

  const status = document.getElementById('pipeline-status');

  for (let i = 0; i < steps.length; i++) {
    const el = document.getElementById(steps[i]);
    if (!el) continue;
    el.classList.add('active');
    if (status) status.textContent = labels[i];
    await new Promise(r => setTimeout(r, 350));
    el.classList.remove('active');
    el.classList.add('success');
  }
  if (status) status.textContent = '🎉 Full pipeline completed successfully!';
}
