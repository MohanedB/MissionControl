let _queuePollInterval = null;
let _queueItemsMap = {}; // id → item, for safe onclick lookup

async function renderQueue() {
  const queue = await API.queue.list();
  const PRIO = { high: 0, medium: 1, low: 2 };
  const grouped = { queued: [], 'in-progress': [], done: [] };
  queue.forEach(q => { if (grouped[q.status]) grouped[q.status].push(q); else grouped.queued.push(q); });
  Object.values(grouped).forEach(arr => arr.sort((a, b) => (PRIO[a.priority] ?? 1) - (PRIO[b.priority] ?? 1)));

  // Store all items by id for safe onclick lookup
  queue.forEach(q => { _queueItemsMap[q.id] = q; });

  const hasInProgress = grouped['in-progress'].length > 0;

  if (_queuePollInterval) clearInterval(_queuePollInterval);
  if (hasInProgress) {
    _queuePollInterval = setInterval(async () => {
      if (Router.currentPage !== 'queue') { clearInterval(_queuePollInterval); return; }
      const fresh = await API.queue.list();
      const stillBusy = fresh.some(q => q.status === 'in-progress');
      if (!stillBusy) { clearInterval(_queuePollInterval); refreshPage(); }
      else {
        const freshGrouped = { queued: [], 'in-progress': [], done: [] };
        fresh.forEach(q => { if (freshGrouped[q.status]) freshGrouped[q.status].push(q); else freshGrouped.queued.push(q); });
        ['queued','in-progress','done'].forEach(s => {
          const col = document.getElementById('qcol-' + s);
          if (col) col.innerHTML = freshGrouped[s].length === 0
            ? `<div class="q-empty">Empty</div>`
            : freshGrouped[s].map(q => queueItemHTML(q)).join('');
        });
      }
    }, 5000);
  }

  return `
    <div class="section-header mb-24">
      <div>
        <h2 class="section-title">OpenClaw Task Queue</h2>
        ${grouped.done.length > 0 ? `<div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">${grouped.done.length} completed — click any to read the full output</div>` : ''}
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" onclick="dispatchNow()" id="dispatchBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Dispatch Now
        </button>
        <button class="btn btn-primary" onclick="showNewQueueModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Task
        </button>
      </div>
    </div>

    ${hasInProgress ? `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--accent-subtle);border:1px solid var(--accent);border-radius:var(--radius);margin-bottom:20px;font-size:.85rem;color:var(--accent)">
        <div class="status-dot online"></div>
        OpenClaw is processing a task — auto-refreshing every 5s…
      </div>
    ` : ''}

    <div class="grid-3" style="gap:20px">
      ${[['queued','📋 Queued','badge-yellow'], ['in-progress','⚡ In Progress','badge-blue'], ['done','✅ Done','badge-green']].map(([status, label, badge]) => `
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
            <span class="section-title" style="font-size:.9rem">${label}</span>
            <span class="badge ${badge}">${grouped[status].length}</span>
          </div>
          <div id="qcol-${status}">
            ${grouped[status].length === 0
              ? `<div class="q-empty">Empty</div>`
              : grouped[status].map(q => queueItemHTML(q)).join('')
            }
          </div>
        </div>
      `).join('')}
    </div>

    <style>
      .q-empty {
        padding:24px;text-align:center;color:var(--text-muted);font-size:.83rem;
        border:1px dashed var(--border);border-radius:var(--radius-lg);
      }
      .queue-item.clickable { cursor:pointer; }
      .queue-item.clickable:hover { border-color:var(--accent); }
    </style>
  `;
}

function queueItemHTML(q) {
  const isActive = q.status === 'in-progress';
  const isDone   = q.status === 'done' && q.result;

  return `
    <div class="queue-item ${isDone ? 'clickable' : ''}"
      style="${isActive ? 'border-color:var(--accent);' : ''}"
      ${isDone ? `onclick="openQueueResult('${q.id}')"` : ''}>
      <div class="queue-priority-dot priority-${q.priority}" style="${isActive ? 'animation:pulse 1.5s infinite' : ''}"></div>
      <div class="queue-info" style="flex:1;min-width:0">
        <div class="queue-title">${q.title}</div>
        <div class="queue-meta">${q.project || 'General'} · ${timeAgo(q.created_at||q.createdAt)}</div>
        ${isActive ? `<div style="font-size:.72rem;color:var(--accent);margin-top:4px">⚡ OpenClaw working…</div>` : ''}
        ${isDone ? (() => {
          const preview = q.result.replace(/[#*`_]/g, '').trim().slice(0, 120);
          return `
            <div style="margin-top:6px;font-size:.73rem;color:var(--text-muted);line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">
              ${preview}…
            </div>
            <div style="margin-top:6px;font-size:.71rem;color:var(--accent);font-weight:600;display:flex;align-items:center;gap:4px">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Read full output
            </div>
          `;
        })() : ''}
        ${q.result && q.status === 'queued' && q.result.startsWith('Error:') ? `
          <div style="margin-top:6px;font-size:.72rem;color:var(--danger)">${q.result}</div>
        ` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex-shrink:0" onclick="event.stopPropagation()">
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

// ─── Navigate to full result page ─────────────────────────────────────────────
function openQueueResult(id) {
  const q = _queueItemsMap[id];
  if (!q) return;
  Router.go('queue-result', q);
}

// ─── Full-page result reader ───────────────────────────────────────────────────
async function renderQueueResult(q) {
  // Fetch fresh data so result is always up to date
  const all  = await API.queue.list();
  // Keep map populated for copy/nav actions
  all.forEach(x => { _queueItemsMap[x.id] = x; });
  const done = all.filter(x => x.status === 'done' && x.result);
  // Use fresh data for this item
  q = _queueItemsMap[q.id] || q;
  const idx  = done.findIndex(x => x.id === q.id);
  const prev = done[idx - 1] || null;
  const next = done[idx + 1] || null;

  const result    = q.result || '';
  const wordCount = result.split(/\s+/).filter(Boolean).length;
  const readMin   = Math.max(1, Math.round(wordCount / 200));
  const date      = new Date(q.updated_at || q.created_at);
  const dateStr   = date.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' });

  const PRIO_COLOR = { high:'var(--danger)', medium:'var(--warning)', low:'var(--success)' };
  const PRIO_LABEL = { high:'High Priority', medium:'Medium Priority', low:'Low Priority' };

  return `
    <div style="max-width:760px;margin:0 auto;padding-bottom:60px">

      <!-- Back + nav -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px">
        <button class="back-btn" onclick="Router.go('queue')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Queue
        </button>
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn btn-ghost btn-sm" ${!prev?'disabled style="opacity:.3"':''} onclick="${prev?`openQueueResult('${prev.id}')`:''}"  >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            Prev
          </button>
          <span style="font-size:.75rem;color:var(--text-muted)">${idx+1} / ${done.length}</span>
          <button class="btn btn-ghost btn-sm" ${!next?'disabled style="opacity:.3"':''} onclick="${next?`openQueueResult('${next.id}')`:''}" >
            Next
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <!-- Hero -->
      <div style="margin-bottom:28px">
        <h1 style="font-size:1.5rem;font-weight:700;color:var(--text-primary);line-height:1.35;margin-bottom:16px">${escHtml(q.title)}</h1>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          ${q.project ? `<span style="display:inline-flex;align-items:center;gap:5px;font-size:.78rem;padding:3px 10px;border-radius:20px;background:var(--bg-tertiary);color:var(--text-secondary);border:1px solid var(--border)">📁 ${escHtml(q.project)}</span>` : ''}
          <span style="font-size:.78rem;color:${PRIO_COLOR[q.priority]||'var(--text-muted)'};font-weight:600">${PRIO_LABEL[q.priority]||''}</span>
          <span style="font-size:.78rem;color:var(--text-muted)">${dateStr}</span>
          <span style="font-size:.78rem;color:var(--text-muted)">${wordCount} words · ~${readMin} min read</span>
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:8px;margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid var(--border)">
        <button class="btn btn-secondary" onclick="copyQueueResult('${q.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy output
        </button>
        <button class="btn btn-secondary" onclick="requeueTask('${q.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.77"/></svg>
          Re-queue
        </button>
        <button class="btn btn-secondary" style="color:var(--danger)" onclick="deleteAndBack('${q.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          Delete
        </button>
      </div>

      <!-- Output -->
      <div style="font-size:.93rem;color:var(--text-secondary);line-height:1.8">
        ${result ? renderMarkdown(result) : '<p style="color:var(--text-muted);font-style:italic">No output recorded.</p>'}
      </div>

      <!-- Bottom nav -->
      <div style="display:flex;justify-content:space-between;margin-top:48px;padding-top:24px;border-top:1px solid var(--border-muted)">
        <div>
          ${prev ? `<button class="btn btn-ghost" onclick="openQueueResult('${prev.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            ${escHtml(prev.title.slice(0,40))}${prev.title.length>40?'…':''}
          </button>` : ''}
        </div>
        <div>
          ${next ? `<button class="btn btn-ghost" onclick="openQueueResult('${next.id}')">
            ${escHtml(next.title.slice(0,40))}${next.title.length>40?'…':''}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>` : ''}
        </div>
      </div>

    </div>
  `;
}

// ─── Result page actions ───────────────────────────────────────────────────────
async function copyQueueResult(id) {
  const q = _queueItemsMap[id];
  if (!q) return;
  try {
    await navigator.clipboard.writeText(q.result || '');
    toast('Copied to clipboard', 'success');
  } catch { toast('Copy failed', 'error'); }
}

async function requeueTask(id) {
  await API.queue.update(id, { status: 'queued', result: null });
  toast('Task re-queued', 'success');
  Router.go('queue');
}

async function deleteAndBack(id) {
  await API.queue.delete(id);
  toast('Deleted', 'success');
  Router.go('queue');
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────
async function dispatchNow() {
  const btn = document.getElementById('dispatchBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Dispatching…'; }
  try {
    const r = await fetch('/api/queue/dispatch', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('mc_token') }
    });
    if (!r.ok && r.headers.get('content-type')?.includes('text/html')) {
      throw new Error('Server unreachable — restart the Node.js server');
    }
    const data = await r.json();
    toast(data.ok ? (data.message || 'Dispatched ✓') : (data.message || 'Cannot dispatch'), data.ok ? 'success' : 'warning');
    if (data.ok) setTimeout(() => Router.go('queue'), 1500);
  } catch(e) {
    toast('Dispatch error: ' + e.message, 'error');
  } finally {
    setTimeout(() => {
      if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Dispatch Now'; }
    }, 2000);
  }
}

// ─── Status / delete ──────────────────────────────────────────────────────────
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

// ─── Add task modal ───────────────────────────────────────────────────────────
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
    setTimeout(() => document.getElementById('nq-title')?.focus(), 100);
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

