let _projectsCache = [];
let _projectFilter = 'All';
let _projectSearch = '';

async function renderProjects() {
  _projectsCache = await API.projects.list();
  return buildProjectsHTML();
}

function buildProjectsHTML() {
  const engines = ['All', ...new Set(_projectsCache.map(p => p.engine))];
  const statuses = ['All', 'Active', 'Paused', 'Complete', 'Archived'];
  let filtered = _projectsCache;
  if (_projectFilter !== 'All') filtered = filtered.filter(p => p.status === _projectFilter || p.engine === _projectFilter);
  if (_projectSearch) filtered = filtered.filter(p =>
    p.name.toLowerCase().includes(_projectSearch) ||
    (p.description || '').toLowerCase().includes(_projectSearch) ||
    (p.tags || []).some(t => t.toLowerCase().includes(_projectSearch))
  );

  return `
    <div class="section-header mb-16">
      <h2 class="section-title">All Projects <span style="color:var(--text-muted);font-weight:400;font-size:.85rem">(${_projectsCache.length})</span></h2>
      <button class="btn btn-primary" onclick="showNewProjectModal()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Project
      </button>
    </div>

    <div class="filter-bar">
      <div class="search-input-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="search-input" placeholder="Search projects…" value="${_projectSearch}"
          oninput="_projectSearch=this.value.toLowerCase();document.getElementById('content').innerHTML=buildProjectsHTML();rebindProjects()">
      </div>
      ${statuses.map(s => `<button class="filter-chip ${_projectFilter===s?'active':''}" onclick="_projectFilter='${s}';document.getElementById('content').innerHTML=buildProjectsHTML();rebindProjects()">${s}</button>`).join('')}
    </div>

    <div class="grid-auto" id="projectGrid">
      ${filtered.length === 0
        ? `<div class="empty-state" style="grid-column:1/-1"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><h3>No projects found</h3><p>Try adjusting your filters</p></div>`
        : filtered.map(p => projectCard(p)).join('')
      }
    </div>
  `;
}

function rebindProjects() {
  document.querySelectorAll('[data-project-id]').forEach(el => {
    el.onclick = () => {
      const id = el.dataset.projectId;
      const p = _projectsCache.find(x => x.id === id);
      if (p) Router.go('project', p);
    };
  });
}

function projectCard(p) {
  const doneTasks = (p.tasks || []).filter(t => t.status === 'done').length;
  return `
    <div class="project-card" data-project-id="${p.id}">
      <div class="project-card-header">
        <div>
          <div class="project-name">${p.name}</div>
          <div class="project-engine">${p.engine}</div>
        </div>
        <span class="badge ${statusBadge(p.status)}">${p.status}</span>
      </div>
      <p class="project-desc">${p.description || 'No description yet.'}</p>
      <div class="project-tags">
        ${(p.tags || []).map(t => `<span class="badge badge-gray">${t}</span>`).join('')}
      </div>
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--text-muted);margin-bottom:5px">
          <span>${doneTasks}/${(p.tasks||[]).length} tasks</span>
          <span>${p.progress}%</span>
        </div>
        <div class="progress-wrap"><div class="progress-bar ${p.progress===100?'full':''}" style="width:${p.progress}%"></div></div>
      </div>
      <div class="project-footer">
        <span class="project-meta">Updated ${timeAgo(p.updatedAt)}</span>
        ${p.repoUrl ? `<a href="${p.repoUrl}" target="_blank" onclick="event.stopPropagation()" style="font-size:.75rem;color:var(--accent)">GitHub →</a>` : ''}
      </div>
    </div>
  `;
}

function showNewProjectModal() {
  showModal('New Project', `
    <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="np-name" placeholder="My Game"></div>
    <div class="form-group"><label class="form-label">Engine / Tech</label>
      <select class="form-select" id="np-engine">
        <option>Unreal Engine 5</option><option>Unity</option><option>C++</option><option>C++ / SFML</option><option>Other</option>
      </select>
    </div>
    <div class="form-group"><label class="form-label">Status</label>
      <select class="form-select" id="np-status">
        <option>Active</option><option>Paused</option><option>Complete</option><option>Archived</option>
      </select>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="np-desc" rows="3" placeholder="What is this project about?"></textarea></div>
    <div class="form-group"><label class="form-label">Tags (comma separated)</label><input class="form-input" id="np-tags" placeholder="school, ue5, personal"></div>
    <div class="form-group"><label class="form-label">GitHub / Repo URL</label><input class="form-input" id="np-repo" placeholder="https://github.com/..."></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createProject()">Create Project</button>
    </div>
  `);
}

async function createProject() {
  const name = document.getElementById('np-name').value.trim();
  if (!name) { toast('Project name required', 'error'); return; }
  const data = {
    name,
    engine: document.getElementById('np-engine').value,
    status: document.getElementById('np-status').value,
    description: document.getElementById('np-desc').value.trim(),
    tags: document.getElementById('np-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
    repoUrl: document.getElementById('np-repo').value.trim(),
  };
  await API.projects.create(data);
  closeModal();
  toast('Project created', 'success');
  Router.go('projects');
}
