router.register('logs', async () => {
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="empty-state"><div class="spinner"></div></div>`;

  const res = await api.getLogs({ limit: 50, page: 1 });
  const { logs = [], pagination = {} } = res?.data?.data || {};

  const actionColors = {
    LOGIN_SUCCESS:      'success',
    LOGIN_FAILED:       'error',
    REGISTER:           'researcher',
    DATA_CREATE:        'admin',
    DATA_READ:          'public',
    DATA_UPDATE:        'shared',
    DATA_DELETE:        'error',
    UNAUTHORIZED_ACCESS:'error',
  };

  content.innerHTML = `
    <div class="section-header">
      <h2>📋 Audit Logs</h2>
      <div class="flex gap-8">
        <select id="log-filter-action" onchange="filterLogs()" style="width:180px">
          <option value="">All Actions</option>
          ${['LOGIN_SUCCESS','LOGIN_FAILED','REGISTER','DATA_CREATE','DATA_READ','DATA_UPDATE','DATA_DELETE','UNAUTHORIZED_ACCESS']
            .map(a => `<option value="${a}">${a.replace(/_/g,' ')}</option>`).join('')}
        </select>
        <button class="btn btn-outline btn-sm" onclick="filterLogs()">🔄 Refresh</button>
      </div>
    </div>

    <div class="card">
      <div class="flex items-center justify-between" style="margin-bottom:16px">
        <span class="text-muted">Showing ${logs.length} of ${pagination.total || 0} entries</span>
      </div>
      ${logs.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>No audit logs found</p>
        </div>` : `
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Action</th><th>User</th><th>IP Address</th><th>Metadata</th><th>Time</th>
          </tr></thead>
          <tbody id="logs-tbody">
            ${renderLogRows(logs, actionColors)}
          </tbody>
        </table>
      </div>`}
    </div>
  `;
});

function renderLogRows(logs, actionColors) {
  return logs.map(l => `
    <tr>
      <td><span class="badge badge-${actionColors[l.action] || 'public'}">${l.action.replace(/_/g,' ')}</span></td>
      <td>
        ${l.userId ? `
          <div>
            <div style="font-weight:600;font-size:13px">${l.userId.name || '—'}</div>
            <div class="text-muted">${l.userId.email || ''}</div>
          </div>` : '<span class="text-muted">Anonymous</span>'}
      </td>
      <td class="text-muted" style="font-size:12px">${l.ipAddress || '—'}</td>
      <td>
        ${Object.keys(l.metadata || {}).length > 0
          ? `<code style="font-size:11px;color:var(--accent2)">${utils.truncate(JSON.stringify(l.metadata), 50)}</code>`
          : '<span class="text-muted">—</span>'}
      </td>
      <td class="text-muted">${utils.timeAgo(l.createdAt)}</td>
    </tr>`).join('');
}

async function filterLogs() {
  const action = document.getElementById('log-filter-action')?.value;
  const params = { limit: 50, page: 1 };
  if (action) params.action = action;

  const res = await api.getLogs(params);
  const { logs = [] } = res?.data?.data || {};
  const tbody = document.getElementById('logs-tbody');
  if (tbody) {
    const actionColors = {
      LOGIN_SUCCESS:'success', LOGIN_FAILED:'error', REGISTER:'researcher',
      DATA_CREATE:'admin', DATA_READ:'public', DATA_UPDATE:'shared',
      DATA_DELETE:'error', UNAUTHORIZED_ACCESS:'error',
    };
    tbody.innerHTML = renderLogRows(logs, actionColors);
  }
}
