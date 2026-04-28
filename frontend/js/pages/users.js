router.register('users', async () => {
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="empty-state"><div class="spinner"></div></div>`;

  const res = await api.getUsers();
  const users = res?.data?.data || [];

  content.innerHTML = `
    <div class="section-header">
      <h2>👥 User Management (${users.length} users)</h2>
    </div>
    <div class="card">
      ${users.length === 0 ? `<div class="empty-state"><div class="empty-icon">👤</div><p>No users found</p></div>` : `
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>
                  <div class="flex items-center gap-8">
                    <div style="width:32px;height:32px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">
                      ${u.name.charAt(0).toUpperCase()}
                    </div>
                    <strong>${u.name}</strong>
                  </div>
                </td>
                <td class="text-muted">${u.email}</td>
                <td>${utils.badge(u.role, {})}</td>
                <td>
                  <span class="badge ${u.isActive ? 'badge-success' : 'badge-error'}">
                    ${u.isActive ? '● Active' : '● Inactive'}
                  </span>
                </td>
                <td class="text-muted">${utils.formatDate(u.createdAt)}</td>
                <td>
                  ${u.isActive
                    ? `<button class="btn btn-danger btn-sm" onclick="toggleUser('${u._id}', false)">Deactivate</button>`
                    : `<button class="btn btn-success btn-sm" onclick="toggleUser('${u._id}', true)">Activate</button>`
                  }
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  `;
});

async function toggleUser(id, activate) {
  const action = activate ? 'activate' : 'deactivate';
  if (!confirm(`${activate ? 'Activate' : 'Deactivate'} this user?`)) return;
  const res = activate ? await api.activateUser(id) : await api.deactivateUser(id);
  if (res?.ok) {
    toast.show(`User ${action}d successfully`, 'success');
    router.navigate('users');
  } else {
    toast.show(res?.data?.message || `Failed to ${action} user`, 'error');
  }
}
