router.register('data', async () => {
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="empty-state"><div class="spinner"></div></div>`;

  const res = await api.getAllData();
  const records = res?.data?.data || [];

  content.innerHTML = `
    <div class="section-header">
      <h2>📁 Data Vault (${records.length} records)</h2>
      <button class="btn btn-primary" onclick="openCreateModal()">＋ New Record</button>
    </div>

    ${records.length === 0 ? `
      <div class="card">
        <div class="empty-state">
          <div class="empty-icon">🗄️</div>
          <p>No data records yet.</p>
          <button class="btn btn-primary mt-16" onclick="openCreateModal()">Create First Record</button>
        </div>
      </div>` : `
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Title</th><th>Description</th><th>Access</th>
            <th>Tags</th><th>Owner</th><th>Created</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${records.map(r => `
              <tr>
                <td><strong>${utils.truncate(r.title, 30)}</strong></td>
                <td class="text-muted">${utils.truncate(r.description || '—', 35)}</td>
                <td>${utils.badge(r.accessLevel, {})}</td>
                <td>${(r.tags || []).map(t => `<span class="tag">${t}</span>`).join('') || '—'}</td>
                <td class="text-muted">${r.ownerId?.name || '—'}</td>
                <td class="text-muted">${utils.timeAgo(r.createdAt)}</td>
                <td>
                  <div class="flex gap-8">
                    <button class="btn btn-outline btn-sm" onclick="viewRecord('${r._id}')">👁 View</button>
                    <button class="btn btn-outline btn-sm" onclick="openEditModal('${r._id}','${r.title}','${r.description||''}','${r.accessLevel}')">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRecord('${r._id}')">🗑</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`}

    <!-- Create Modal -->
    <div class="modal-overlay" id="create-modal">
      <div class="modal">
        <div class="modal-header">
          <h3>➕ Create Data Record</h3>
          <button class="modal-close" onclick="closeModal('create-modal')">✕</button>
        </div>
        <div class="form-group">
          <label>Title *</label>
          <input id="c-title" placeholder="e.g. Genome Study 2024" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="c-desc" rows="2" placeholder="Optional description"></textarea>
        </div>
        <div class="form-group">
          <label>JSON Data (optional)</label>
          <textarea id="c-json" rows="3" placeholder='{"key": "value"}'></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Access Level</label>
            <select id="c-access">
              <option value="private">🔒 Private</option>
              <option value="shared">🔗 Shared</option>
              <option value="public">🌐 Public</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tags (comma separated)</label>
            <input id="c-tags" placeholder="genomics, 2024" />
          </div>
        </div>
        <div class="form-group">
          <label>File Upload (optional)</label>
          <input type="file" id="c-file" style="padding:8px" />
        </div>
        <div class="flex gap-8 mt-16" style="justify-content:flex-end">
          <button class="btn btn-outline" onclick="closeModal('create-modal')">Cancel</button>
          <button class="btn btn-primary" id="btn-create-submit" onclick="submitCreate()">Create Record</button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div class="modal-overlay" id="edit-modal">
      <div class="modal">
        <div class="modal-header">
          <h3>✏️ Edit Record</h3>
          <button class="modal-close" onclick="closeModal('edit-modal')">✕</button>
        </div>
        <input type="hidden" id="e-id" />
        <div class="form-group">
          <label>Title</label>
          <input id="e-title" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="e-desc" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label>Access Level</label>
          <select id="e-access">
            <option value="private">🔒 Private</option>
            <option value="shared">🔗 Shared</option>
            <option value="public">🌐 Public</option>
          </select>
        </div>
        <div class="flex gap-8 mt-16" style="justify-content:flex-end">
          <button class="btn btn-outline" onclick="closeModal('edit-modal')">Cancel</button>
          <button class="btn btn-primary" onclick="submitEdit()">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- View Modal -->
    <div class="modal-overlay" id="view-modal">
      <div class="modal" style="max-width:560px">
        <div class="modal-header">
          <h3>👁 Record Details</h3>
          <button class="modal-close" onclick="closeModal('view-modal')">✕</button>
        </div>
        <div id="view-content"></div>
      </div>
    </div>
  `;
});

function openCreateModal() {
  document.getElementById('create-modal').classList.add('open');
}
function openEditModal(id, title, desc, access) {
  document.getElementById('e-id').value = id;
  document.getElementById('e-title').value = title;
  document.getElementById('e-desc').value = desc;
  document.getElementById('e-access').value = access;
  document.getElementById('edit-modal').classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

async function submitCreate() {
  const title  = document.getElementById('c-title').value.trim();
  const desc   = document.getElementById('c-desc').value.trim();
  const jsonRaw= document.getElementById('c-json').value.trim();
  const access = document.getElementById('c-access').value;
  const tags   = document.getElementById('c-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
  const file   = document.getElementById('c-file').files[0];

  if (!title) { toast.show('Title is required', 'error'); return; }

  const fd = new FormData();
  fd.append('title', title);
  if (desc)   fd.append('description', desc);
  if (jsonRaw) {
    try { JSON.parse(jsonRaw); fd.append('jsonData', jsonRaw); }
    catch { toast.show('Invalid JSON format', 'error'); return; }
  }
  fd.append('accessLevel', access);
  tags.forEach(t => fd.append('tags[]', t));
  if (file) fd.append('file', file);

  const btn = document.getElementById('btn-create-submit');
  btn.innerHTML = '<span class="spinner"></span> Creating...';
  btn.disabled = true;

  const res = await api.createData(fd);
  btn.innerHTML = 'Create Record'; btn.disabled = false;

  if (res?.ok) {
    toast.show('Record created successfully!', 'success');
    closeModal('create-modal');
    router.navigate('data');
  } else {
    toast.show(res?.data?.message || 'Failed to create record', 'error');
  }
}

async function submitEdit() {
  const id     = document.getElementById('e-id').value;
  const title  = document.getElementById('e-title').value.trim();
  const desc   = document.getElementById('e-desc').value.trim();
  const access = document.getElementById('e-access').value;

  const res = await api.updateData(id, { title, description: desc, accessLevel: access });
  if (res?.ok) {
    toast.show('Record updated!', 'success');
    closeModal('edit-modal');
    router.navigate('data');
  } else {
    toast.show(res?.data?.message || 'Update failed', 'error');
  }
}

async function viewRecord(id) {
  const res = await api.getDataById(id);
  if (!res?.ok) { toast.show('Failed to load record', 'error'); return; }
  const r = res.data.data;
  document.getElementById('view-content').innerHTML = `
    <div class="form-group">
      <label>Title</label>
      <div style="padding:10px 0;font-weight:600">${r.title}</div>
    </div>
    ${r.description ? `<div class="form-group"><label>Description</label><div class="text-muted" style="padding:6px 0">${r.description}</div></div>` : ''}
    <div class="form-row">
      <div class="form-group"><label>Access Level</label><div style="padding:6px 0">${utils.badge(r.accessLevel,{})}</div></div>
      <div class="form-group"><label>Created</label><div class="text-muted" style="padding:6px 0">${utils.formatDate(r.createdAt)}</div></div>
    </div>
    ${r.decryptedData ? `
    <div class="form-group">
      <label>🔓 Decrypted Data</label>
      <pre style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:12px;overflow:auto;max-height:200px;color:var(--accent2)">${JSON.stringify(r.decryptedData, null, 2)}</pre>
    </div>` : ''}
    ${r.fileUrl ? `<div class="form-group"><label>📎 File</label><div class="text-muted" style="padding:6px 0">${r.fileOriginalName || r.fileUrl}</div></div>` : ''}
    ${r.tags?.length ? `<div class="form-group"><label>Tags</label><div style="padding:6px 0">${r.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div></div>` : ''}
  `;
  document.getElementById('view-modal').classList.add('open');
}

async function deleteRecord(id) {
  if (!confirm('Delete this record? This cannot be undone.')) return;
  const res = await api.deleteData(id);
  if (res?.ok) {
    toast.show('Record deleted', 'success');
    router.navigate('data');
  } else {
    toast.show(res?.data?.message || 'Delete failed', 'error');
  }
}
