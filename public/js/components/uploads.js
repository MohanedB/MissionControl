async function renderUploads() {
  return `
    <div class="section-header mb-24">
      <h2 class="section-title">File Uploads</h2>
      <p style="font-size:.85rem;color:var(--text-secondary);margin-top:4px">Upload PDFs and documents for OpenClaw to process and learn from</p>
    </div>

    <div class="detail-section mb-24">
      <div class="upload-zone" id="uploadZone" onclick="document.getElementById('fileInput').click()"
        ondragover="event.preventDefault();this.classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over')"
        ondrop="handleFileDrop(event)">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <p><strong style="color:var(--text-primary)">Click to upload</strong> or drag & drop</p>
        <p style="font-size:.75rem;margin-top:4px">PDF, TXT, MD — any file for OpenClaw</p>
        <input type="file" id="fileInput" style="display:none" multiple onchange="handleFileSelect(event)">
      </div>
    </div>

    <div class="section-header mb-16">
      <span class="section-title">Uploaded Files</span>
    </div>
    <div id="uploadsList">
      <div class="loading-spinner"><div class="spinner"></div></div>
    </div>
  `;
}

async function loadUploadsList() {
  const el = document.getElementById('uploadsList');
  if (!el) return;
  try {
    const files = await API.get('/api/uploads');
    if (!files.length) {
      el.innerHTML = `<div class="empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <h3>No files uploaded</h3>
        <p>Upload PDFs for OpenClaw to read and learn from</p>
      </div>`;
      return;
    }
    el.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Filename</th>
            <th>Size</th>
            <th>Added</th>
            <th style="text-align:right">Actions</th>
          </tr></thead>
          <tbody>
            ${files.map(f => `
              <tr>
                <td style="font-weight:500">${f.name}</td>
                <td style="color:var(--text-muted)">${formatBytes(f.size)}</td>
                <td style="color:var(--text-muted);font-size:.8rem">${formatDate(f.createdAt)}</td>
                <td style="text-align:right;display:flex;gap:8px;justify-content:flex-end">
                  <a href="/api/uploads/${encodeURIComponent(f.name)}" 
                     download="${f.name}"
                     onclick="addAuthToDownload(event, '${f.name}')"
                     style="background:var(--bg-hover);border:1px solid var(--border);color:var(--text-secondary);padding:4px 10px;border-radius:5px;font-size:.78rem;cursor:pointer;text-decoration:none">
                    ↓ Download
                  </a>
                  <button onclick="deleteUpload('${f.name}')"
                    style="background:transparent;border:1px solid var(--danger);color:var(--danger);padding:4px 10px;border-radius:5px;font-size:.78rem;cursor:pointer">
                    🗑 Delete
                  </button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch { 
    el.innerHTML = '<p style="color:var(--danger)">Failed to load files</p>'; 
  }
}

async function deleteUpload(filename) {
  if (!confirm(`Delete "${filename}" ?`)) return;
  try {
    await fetch(`/api/uploads/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('mc_token') || '') }
    });
    toast(`Deleted: ${filename}`, 'success');
    loadUploadsList();
  } catch(e) {
    toast('Delete failed: ' + e.message, 'error');
  }
}

async function addAuthToDownload(e, filename) {
  e.preventDefault();
  try {
    const res = await fetch(`/api/uploads/${encodeURIComponent(filename)}`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('mc_token') || '') }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch(e) {
    toast('Download failed: ' + e.message, 'error');
  }
}

function formatDate(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
async function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  await uploadFiles(files);
}

async function handleFileDrop(event) {
  event.preventDefault();
  document.getElementById('uploadZone')?.classList.remove('drag-over');
  const files = Array.from(event.dataTransfer.files);
  await uploadFiles(files);
}

async function uploadFiles(files) {
  for (const file of files) {
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/upload', { 
        method: 'POST', 
        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('mc_token') || '') },
        body: form 
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      toast(`Uploaded: ${file.name}`, 'success');
    } catch(e) {
      toast(`Failed: ${file.name} — ${e.message}`, 'error');
    }
  }
  await new Promise(r => setTimeout(r, 300));
  loadUploadsList();
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1048576).toFixed(1) + ' MB';
}
