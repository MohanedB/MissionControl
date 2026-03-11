// ─── Clock ──────────────────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('clock');
  if (el) el.textContent = new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ─── Toast ──────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  el.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(100%)'; el.style.transition = '.3s'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function showModal(title, bodyHTML) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('modalOverlay').classList.remove('hidden');
  setTimeout(() => document.querySelector('.modal-body input, .modal-body textarea')?.focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const wrapper = document.getElementById('mainWrapper');
  sidebar.classList.toggle('collapsed');
  wrapper.classList.toggle('collapsed');
}

// ─── Refresh ──────────────────────────────────────────────────────────────────
function refreshPage() {
  App.render(Router.currentPage, Router.currentProject);
}

// ─── Project detail ───────────────────────────────────────────────────────────
async function renderProjectDetail(p) {
  const project = await API.projects.get(p.id);
  const tasks = project.tasks || [];
  const done = tasks.filter(t => t.status === 'done').length;

  return `
    <button class="back-btn" onclick="Router.go('projects')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      Back to Projects
    </button>

    <div class="detail-hero">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <div class="detail-title">${project.name}</div>
          <div class="detail-meta">
            <span class="badge ${statusBadge(project.status)}">${project.status}</span>
            <span style="color:var(--text-muted);font-size:.85rem">${project.engine}</span>
            <span style="color:var(--text-muted);font-size:.85rem">Updated ${timeAgo(project.updatedAt)}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="editProjectModal('${project.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProject('${project.id}')">Delete</button>
        </div>
      </div>

      <p style="color:var(--text-secondary);margin:16px 0;line-height:1.6">${project.description || 'No description.'}</p>

      <div class="project-tags" style="margin-bottom:16px">
        ${(project.tags||[]).map(t=>`<span class="badge badge-gray">${t}</span>`).join('')}
      </div>

      ${project.repoUrl ? `<a href="${project.repoUrl}" target="_blank" class="btn btn-secondary btn-sm">GitHub →</a>` : ''}

      <div style="margin-top:20px">
        <div style="display:flex;justify-content:space-between;font-size:.82rem;color:var(--text-secondary);margin-bottom:6px">
          <span>${done}/${tasks.length} tasks complete</span>
          <span style="font-weight:700;color:var(--accent)">${project.progress}%</span>
        </div>
        <div class="progress-wrap"><div class="progress-bar ${project.progress===100?'full':''}" style="width:${project.progress}%;height:8px"></div></div>
      </div>
    </div>

    <div class="detail-section">
      <div class="section-header mb-16">
        <span class="section-title">Tasks</span>
        <button class="btn btn-primary btn-sm" onclick="showAddTaskModal('${project.id}')">+ Add Task</button>
      </div>
      <div id="taskList">
        ${tasks.length === 0
          ? `<div class="empty-state" style="padding:24px"><h3>No tasks yet</h3><p>Break down your project into small tasks</p></div>`
          : tasks.map(t => taskItemHTML(project.id, t)).join('')
        }
      </div>
    </div>

    <div class="detail-section">
      <div class="section-header mb-16">
        <span class="section-title">Project Notes</span>
        <button class="btn btn-secondary btn-sm" onclick="showAddProjectNote('${project.id}')">+ Note</button>
      </div>
      ${(project.notes||[]).length === 0
        ? `<div style="color:var(--text-muted);font-size:.85rem;text-align:center;padding:20px">No notes yet</div>`
        : (project.notes||[]).map(n => `
          <div style="padding:14px;border:1px solid var(--border-muted);border-radius:var(--radius);margin-bottom:8px">
            <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:6px">${new Date(n.createdAt).toLocaleString()}</div>
            <div style="font-size:.88rem;color:var(--text-secondary);white-space:pre-wrap;line-height:1.6">${n.content}</div>
          </div>
        `).join('')
      }
    </div>
  `;
}

function taskItemHTML(projectId, t) {
  const cycleStatus = () => {
    const next = { 'todo': 'in-progress', 'in-progress': 'done', 'done': 'todo' };
    API.projects.updateTask(projectId, t.id, { status: next[t.status] || 'todo' }).then(() => {
      API.projects.get(projectId).then(p => Router.go('project', p));
    });
  };
  return `
    <div class="task-item">
      <div class="task-check ${t.status}" onclick="(${cycleStatus.toString()})()" style="cursor:pointer">
        ${t.status==='done' ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        ${t.status==='in-progress' ? '<div style="width:6px;height:6px;border-radius:50%;background:var(--warning)"></div>' : ''}
      </div>
      <div class="flex-1">
        <div class="task-title ${t.status==='done'?'done-text':''}">${t.title}</div>
      </div>
      <span class="badge priority-badge-${t.priority}">${priorityBadge(t.priority)}</span>
      <div class="task-actions">
        <button class="btn btn-icon btn-sm" style="color:var(--danger)" onclick="deleteTask('${projectId}','${t.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    </div>
  `;
}

function priorityBadge(p) {
  return { high: '<span class="badge badge-red">high</span>', medium: '<span class="badge badge-yellow">medium</span>', low: '<span class="badge badge-green">low</span>' }[p] || '';
}

async function deleteTask(projectId, taskId) {
  await API.projects.deleteTask(projectId, taskId);
  toast('Task deleted', 'success');
  API.projects.get(projectId).then(p => Router.go('project', p));
}

function showAddTaskModal(projectId) {
  showModal('Add Task', `
    <div class="form-group"><label class="form-label">Task</label><input class="form-input" id="at-title" placeholder="What needs to be done?"></div>
    <div class="form-group"><label class="form-label">Priority</label>
      <select class="form-select" id="at-priority">
        <option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option>
      </select>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="addTask('${projectId}')">Add Task</button>
    </div>
  `);
}

async function addTask(projectId) {
  const title = document.getElementById('at-title').value.trim();
  if (!title) { toast('Task title required', 'error'); return; }
  await API.projects.addTask(projectId, { title, priority: document.getElementById('at-priority').value, status: 'todo' });
  closeModal();
  toast('Task added', 'success');
  API.projects.get(projectId).then(p => Router.go('project', p));
}

async function showAddProjectNote(projectId) {
  showModal('Add Note', `
    <div class="form-group"><label class="form-label">Note</label><textarea class="form-textarea" id="pn-content" rows="5" placeholder="Write a note for this project…"></textarea></div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="addProjectNote('${projectId}')">Save Note</button>
    </div>
  `);
}

async function addProjectNote(projectId) {
  const content = document.getElementById('pn-content').value.trim();
  if (!content) { toast('Note content required', 'error'); return; }
  const p = await API.projects.get(projectId);
  const notes = p.notes || [];
  notes.push({ content, createdAt: new Date().toISOString() });
  await API.projects.update(projectId, { notes });
  closeModal();
  toast('Note added', 'success');
  API.projects.get(projectId).then(proj => Router.go('project', proj));
}

async function editProjectModal(id) {
  const p = await API.projects.get(id);
  showModal('Edit Project', `
    <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="ep-name" value="${p.name}"></div>
    <div class="form-group"><label class="form-label">Engine</label>
      <select class="form-select" id="ep-engine">
        ${['Unreal Engine 5','Unity','C++','C++ / SFML','Other'].map(e=>`<option ${p.engine===e?'selected':''}>${e}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label class="form-label">Status</label>
      <select class="form-select" id="ep-status">
        ${['Active','Paused','Complete','Archived'].map(s=>`<option ${p.status===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="ep-desc">${p.description||''}</textarea></div>
    <div class="form-group"><label class="form-label">Tags</label><input class="form-input" id="ep-tags" value="${(p.tags||[]).join(', ')}"></div>
    <div class="form-group"><label class="form-label">Repo URL</label><input class="form-input" id="ep-repo" value="${p.repoUrl||''}"></div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveProject('${id}')">Save</button>
    </div>
  `);
}

async function saveProject(id) {
  await API.projects.update(id, {
    name:        document.getElementById('ep-name').value.trim(),
    engine:      document.getElementById('ep-engine').value,
    status:      document.getElementById('ep-status').value,
    description: document.getElementById('ep-desc').value.trim(),
    tags:        document.getElementById('ep-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
    repoUrl:     document.getElementById('ep-repo').value.trim(),
  });
  closeModal();
  toast('Project saved', 'success');
  API.projects.get(id).then(p => Router.go('project', p));
}

async function deleteProject(id) {
  if (!confirm('Delete this project? This cannot be undone.')) return;
  await API.projects.delete(id);
  toast('Project deleted', 'success');
  Router.go('projects');
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const App = {
  async render(page, data) {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    try {
      let html = '';
      if (page === 'dashboard') html = await renderDashboard();
      else if (page === 'projects') html = await renderProjects();
      else if (page === 'project') html = await renderProjectDetail(data);
      else if (page === 'chat') html = await renderChat();
      else if (page === 'tasks') html = await renderTasks();
      else if (page === 'agent') html = await renderAgent();
      else if (page === 'notes') html = await renderNotes();
      else if (page === 'uploads') html = await renderUploads();
      else if (page === 'settings') html = await renderSettings();
      content.innerHTML = html;
      if (page === 'uploads') loadUploadsList();
      if (page === 'projects') rebindProjects();
      if (page === 'agent') startAgentPolling();
      if (page === 'chat') setTimeout(() => document.getElementById('chatInput')?.focus(), 100);
    } catch(e) {
      content.innerHTML = `<div class="empty-state"><h3>Error loading page</h3><p>${e.message}</p><button class="btn btn-secondary" onclick="refreshPage()">Retry</button></div>`;
    }
  }
};

// Nav links
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    Router.go(link.dataset.page);
  });
});

// Apply saved theme, accent, language, compact mode
API.settings.get().then(s => {
  if (s.theme) document.documentElement.setAttribute('data-theme', s.theme);
  if (s.accentColor) document.documentElement.style.setProperty('--accent', s.accentColor);
  if (s.compactMode) document.body.classList.add('compact');
  if (s.ownerName) {
    const subtitle = document.getElementById('pageSubtitle');
    if (subtitle) subtitle.textContent = `Welcome back, ${s.ownerName}`;
  }
  // Init i18n
  if (typeof initLang === 'function') initLang(s);
  if (typeof _dateFormat !== 'undefined') window._dateFormat = s.dateFormat || 'relative';
  // Boot to default page
  Router.go(s.defaultPage || 'dashboard');
}).catch(() => {
  Router.go('dashboard');
});
