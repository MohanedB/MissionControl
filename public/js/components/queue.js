async function renderQueue() {
  const queue = await API.queue.list();
  const grouped = { queued: [], 'in-progress': [], done: [] };
  queue.forEach(q => { if (grouped[q.status]) grouped[q.status].push(q); else grouped.queued.push(q); });

  return `
    <div class="section-header mb-24">
      <h2 class="section-title">OpenClaw Task Queue</h2>
      <button class="btn btn-primary" onclick="showNewQueueModal()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Task
      </button>
    </div>

    <div class="grid-3" style="gap:20px">
      ${[['queued','📋 Queued','badge-yellow'], ['in-progress','⚡ In Progress','badge-blue'], ['done','✅ Done','badge-green']].map(([status, label, badge]) => `
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
            <span class="section-title" style="font-size:.9rem">${label}</span>
            <span class="badge ${badge}">${grouped[status].length}</span>
          </div>
          ${grouped[status].length === 0
            ? `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:.83rem;border:1px dashed var(--border);border-radius:var(--radius-lg)">Empty</div>`
            : grouped[status].map(q => queueItemHTML(q)).join('')
          }
        </div>
      `).join('')}
    </div>
  `;
}

function queueItemHTML(q) {
  return `
    <div class="queue-item">
      <div class="queue-priority-dot priority-${q.priority}"></div>
      <div class="queue-info">
        <div class="queue-title">${q.title}</div>
        <div class="queue-meta">${q.project || 'General'} · ${timeAgo(q.createdAt)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
        <select class="form-select" style="font-size:.75rem;padding:3px 6px;width:auto" onchange="updateQueueStatus('${q.id}', this.value)">
          <option ${q.status==='queued'?'selected':''}>queued</option>
          <option ${q.status==='in-progress'?'selected':''}>in-progress</option>
          <option ${q.status==='done'?'selected':''}>done</option>
        </select>
        <button class="btn btn-icon btn-sm" style="color:var(--danger)" onclick="deleteQueueItem('${q.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>
    </div>
  `;
}

async function updateQueueStatus(id, status) {
  await API.queue.update(id, { status });
  toast('Status updated', 'success');
  Router.go('queue');
}

async function deleteQueueItem(id) {
  await API.queue.delete(id);
  toast('Removed from queue', 'success');
  Router.go('queue');
}

function showNewQueueModal() {
  API.projects.list().then(projects => {
    showModal('Add to Queue', `
      <div class="form-group"><label class="form-label">Task title</label><input class="form-input" id="nq-title" placeholder="What should OpenClaw do?"></div>
      <div class="form-group"><label class="form-label">Project</label>
        <select class="form-select" id="nq-project">
          <option value="">General</option>
          ${projects.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Priority</label>
        <select class="form-select" id="nq-priority">
          <option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option>
        </select>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="addQueueItem()">Add to Queue</button>
      </div>
    `);
  });
}

async function addQueueItem() {
  const title = document.getElementById('nq-title').value.trim();
  if (!title) { toast('Title required', 'error'); return; }
  await API.queue.create({
    title,
    project: document.getElementById('nq-project').value,
    priority: document.getElementById('nq-priority').value,
    status: 'queued'
  });
  closeModal();
  toast('Added to queue', 'success');
  Router.go('queue');
}
