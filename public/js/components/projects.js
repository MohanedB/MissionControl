let _projectsCache = [];
let _projectFilter = 'All';
let _projectSearch = '';

async function renderProjects() {
  _projectsCache = await API.projects.list();
  return buildProjectsHTML();
}

function refreshProjectGrid() {
  const grid = document.getElementById('projectGrid');
  const counter = document.getElementById('projectCount');
  if (!grid) return;
  const filtered = getFiltered();
  if (counter) counter.textContent = `(${_projectsCache.length})`;
  grid.innerHTML = filtered.length === 0
    ? `<div class="empty-state" style="grid-column:1/-1"><h3>Aucun projet trouvé</h3><p>Modifie tes filtres ou ajoute un projet.</p></div>`
    : filtered.map(p => projectCard(p)).join('');
  rebindProjects();
}

function getFiltered() {
  let f = _projectsCache;
  if (_projectFilter !== 'All') f = f.filter(p => p.status === _projectFilter);
  if (_projectSearch) f = f.filter(p =>
    p.name.toLowerCase().includes(_projectSearch) ||
    (p.description || '').toLowerCase().includes(_projectSearch) ||
    (p.tags || []).some(t => t.toLowerCase().includes(_projectSearch))
  );
  return f;
}

function buildProjectsHTML() {
  const statuses = ['All', 'Active', 'Paused', 'Complete', 'Archived'];
  return `
    <div class="section-header mb-16">
      <h2 class="section-title">Mes Projets <span id="projectCount" style="color:var(--text-muted);font-weight:400;font-size:.85rem">(${_projectsCache.length})</span></h2>
      <button class="btn btn-primary" onclick="showNewProjectModal()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouveau Projet
      </button>
    </div>
    <div class="filter-bar">
      <div class="search-input-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="search-input" id="projectSearch" placeholder="Rechercher..." value="${_projectSearch}"
          oninput="_projectSearch=this.value.toLowerCase();refreshProjectGrid()">
      </div>
      ${statuses.map(s => `<button class="filter-chip ${_projectFilter===s?'active':''}"
        onclick="_projectFilter='${s}';document.querySelectorAll('.filter-chip').forEach(b=>b.classList.remove('active'));this.classList.add('active');refreshProjectGrid()">${s}</button>`).join('')}
    </div>
    <div class="grid-auto" id="projectGrid">
      ${getFiltered().length === 0
        ? `<div class="empty-state" style="grid-column:1/-1"><h3>Aucun projet trouvé</h3><p>Modifie tes filtres ou ajoute un projet.</p></div>`
        : getFiltered().map(p => projectCard(p)).join('')}
    </div>`;
}

function rebindProjects() {
  document.querySelectorAll('[data-project-id]').forEach(el => {
    el.onclick = () => {
      const p = _projectsCache.find(x => x.id === el.dataset.projectId);
      if (p) Router.go('project', p);
    };
  });
}

function projectCard(p) {
  const tasks    = p.tasks || [];
  const total    = tasks.length;
  const done     = tasks.filter(t => t.status === 'done').length;
  const inProg   = tasks.filter(t => t.status === 'in-progress').length;
  const todo     = tasks.filter(t => t.status === 'todo').length;
  const hasTasks = total > 0;
  const progress = hasTasks ? Math.round((done / total) * 100) : null;
  const nextTask = tasks.find(t => t.status === 'in-progress') || tasks.find(t => t.status === 'todo');

  // Language: stored from GitHub/local import, fallback to engine field
  const lang = p.language || p.engine || null;

  const desc = (p.description || '').trim();

  return `
    <div class="project-card" data-project-id="${p.id}" style="display:flex;flex-direction:column;gap:0">

      <!-- Header: name + status -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
        <div style="min-width:0">
          <div class="project-name">${p.name}</div>
          <div style="font-size:.73rem;color:var(--accent);font-weight:500;margin-top:1px">${lang}</div>
        </div>
        <span class="badge ${statusBadge(p.status)}" style="flex-shrink:0;margin-left:8px">${p.status}</span>
      </div>

      <!-- Description — only if set -->
      ${desc ? `<p style="font-size:.8rem;color:var(--text-secondary);line-height:1.5;margin:8px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${desc}</p>` : ''}

      <!-- Tags -->
      ${(p.tags||[]).length ? `
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin:6px 0">
          ${p.tags.map(t=>`<span class="badge badge-gray" style="font-size:.68rem">${t}</span>`).join('')}
        </div>` : ''}

      <!-- Task stats — only factual if tasks exist -->
      <div style="margin-top:auto;padding-top:10px;border-top:1px solid var(--border-muted)">
        ${hasTasks ? `
          <div style="display:flex;gap:10px;font-size:.73rem;margin-bottom:8px">
            <span style="color:var(--success)">✓ ${done}</span>
            ${inProg ? `<span style="color:var(--warning)">⚡ ${inProg}</span>` : ''}
            ${todo   ? `<span style="color:var(--text-muted)">○ ${todo}</span>`  : ''}
            <span style="color:var(--text-muted);margin-left:auto">${total} tâche${total!==1?'s':''}</span>
          </div>
          <!-- Next task -->
          ${nextTask ? `
            <div style="font-size:.73rem;color:var(--text-secondary);background:var(--bg-tertiary);border-radius:4px;padding:5px 8px;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              <span style="color:${nextTask.status==='in-progress'?'var(--warning)':'var(--text-muted)'}">${nextTask.status==='in-progress'?'⚡':'→'}</span> ${nextTask.title}
            </div>` : ''}
          <!-- Progress bar — calculated from tasks -->
          <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--text-muted);margin-bottom:4px">
            <span>${done}/${total} done</span>
            <span style="font-weight:700;color:${progress===100?'var(--success)':progress>=50?'var(--accent)':'var(--warning)'}">${progress}%</span>
          </div>
          <div class="progress-wrap">
            <div class="progress-bar ${progress===100?'full':''}" style="width:${progress}%;background:${progress===100?'var(--success)':progress>=50?'var(--accent)':'var(--warning)'}"></div>
          </div>
        ` : `<div style="font-size:.73rem;color:var(--text-muted);font-style:italic">Aucune tâche — ajoute des tâches pour tracker la progression</div>`}

        <!-- GitHub link -->
        ${p.repoUrl ? `
          <div style="margin-top:8px">
            <a href="${p.repoUrl}" target="_blank" onclick="event.stopPropagation()" style="font-size:.73rem;color:var(--accent)">GitHub ↗</a>
          </div>` : ''}
      </div>
    </div>`;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function showNewProjectModal() {
  showModal('Ajouter un Projet', `
    <div style="display:flex;gap:8px;border-bottom:1px solid var(--border-muted);padding-bottom:12px;margin-bottom:16px">
      <button class="btn btn-sm btn-primary" id="tab-manual" onclick="switchTab('manual')">Manuel</button>
      <button class="btn btn-sm btn-ghost"   id="tab-github" onclick="switchTab('github')">GitHub</button>
      <button class="btn btn-sm btn-ghost"   id="tab-local"  onclick="switchTab('local')">PC Local</button>
    </div>

    <div id="pane-manual">
      <div class="form-group"><label class="form-label">Nom</label>
        <input class="form-input" id="np-name" placeholder="Mon Super Jeu"></div>
      <div class="form-group"><label class="form-label">Moteur / Tech</label>
        <select class="form-select" id="np-engine">
          <option>Unreal Engine 5</option><option>Unity</option><option>C++</option>
          <option>C++ / SFML</option><option>JavaScript</option><option>Python</option><option>Autre</option>
        </select></div>
      <div class="form-group"><label class="form-label">Statut</label>
        <select class="form-select" id="np-status">
          <option>Active</option><option>Paused</option><option>Complete</option><option>Archived</option>
        </select></div>
      <div class="form-group"><label class="form-label">Description</label>
        <textarea class="form-textarea" id="np-desc" rows="3"></textarea></div>
      <div class="form-group"><label class="form-label">Tags (virgules)</label>
        <input class="form-input" id="np-tags" placeholder="school, ue5, team"></div>
      <div class="form-group"><label class="form-label">URL GitHub</label>
        <input class="form-input" id="np-repo" placeholder="https://github.com/..."></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="createProject()">Créer</button>
      </div>
    </div>

    <div id="pane-github" style="display:none">
      <div class="form-group">
        <label class="form-label">URL de ton profil GitHub</label>
        <div style="display:flex;gap:8px">
          <input class="form-input" id="gh-url" value="https://github.com/shadow9887" placeholder="https://github.com/username">
          <button class="btn btn-secondary" onclick="fetchGitHubRepos()">Chercher</button>
        </div>
        <div style="font-size:.73rem;color:var(--text-muted);margin-top:4px">Repos publics seulement. Language détecté automatiquement.</div>
      </div>
      <div id="gh-results" style="max-height:320px;overflow-y:auto;background:var(--bg-primary);border-radius:6px;padding:8px;border:1px solid var(--border-muted)">
        <div style="color:var(--text-muted);font-size:.8rem;text-align:center;padding:24px">Entre ton URL et clique Chercher.</div>
      </div>
    </div>

    <div id="pane-local" style="display:none">
      <div class="form-group">
        <label class="form-label">Chemin du dossier</label>
        <div style="display:flex;gap:8px">
          <input class="form-input" id="local-path" value="C:\\GITHUB" placeholder="C:\\GITHUB">
          <button class="btn btn-secondary" onclick="scanLocalFolders()">Scanner</button>
        </div>
        <div style="font-size:.73rem;color:var(--text-muted);margin-top:4px">Language détecté depuis les fichiers. Date = vrai mtime Windows.</div>
      </div>
      <div id="local-results" style="max-height:320px;overflow-y:auto;background:var(--bg-primary);border-radius:6px;padding:8px;border:1px solid var(--border-muted)">
        <div style="color:var(--text-muted);font-size:.8rem;text-align:center;padding:24px">Entrez un chemin et cliquez Scanner.</div>
      </div>
    </div>
  `);
}

window.switchTab = function(tab) {
  ['manual','github','local'].forEach(t => {
    document.getElementById('tab-'+t).className = 'btn btn-sm '+(tab===t?'btn-primary':'btn-ghost');
    document.getElementById('pane-'+t).style.display = tab===t?'block':'none';
  });
};

window.fetchGitHubRepos = async function() {
  const raw   = (document.getElementById('gh-url').value || '').trim();
  const resEl = document.getElementById('gh-results');
  const user  = raw.replace(/^https?:\/\/github\.com\//i,'').replace(/\/.*$/,'').trim();
  if (!user) { resEl.innerHTML = '<div style="color:var(--danger);padding:12px">URL invalide.</div>'; return; }

  resEl.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted)">Chargement…</div>';
  try {
    const r = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=pushed&per_page=50`);
    if (r.status === 404) { resEl.innerHTML = `<div style="color:var(--danger);padding:12px">Utilisateur <strong>${user}</strong> introuvable.</div>`; return; }
    if (!r.ok) throw new Error(`GitHub API ${r.status}`);
    const repos = await r.json();
    if (!repos.length) { resEl.innerHTML = '<div style="color:var(--warning);padding:12px">Aucun repo public trouvé.</div>'; return; }

    const existing = new Set(_projectsCache.map(p => p.repoUrl));
    resEl.innerHTML = repos.map(repo => {
      const already = existing.has(repo.html_url);
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 8px;border-bottom:1px solid var(--border-muted)">
          <div style="min-width:0;flex:1">
            <div style="font-weight:600;font-size:.88rem;color:var(--text-primary)">${repo.name}
              ${already?'<span style="font-size:.68rem;color:var(--success);margin-left:6px">✓ importé</span>':''}
            </div>
            <div style="font-size:.72rem;color:var(--text-muted);margin-top:2px">
              ${repo.language?`<span style="color:var(--accent)">${repo.language}</span> · `:''}${repo.stargazers_count}⭐ · push ${timeAgo(repo.pushed_at)}
            </div>
            ${repo.description?`<div style="font-size:.72rem;color:var(--text-secondary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px">${repo.description}</div>`:''}
          </div>
          <button class="btn btn-sm ${already?'btn-ghost':'btn-secondary'}" style="margin-left:10px;flex-shrink:0" ${already?'disabled':''}
            onclick="importProject(${JSON.stringify(repo.name)},${JSON.stringify(repo.language||'Autre')},${JSON.stringify(repo.description||'')},${JSON.stringify(repo.html_url)},${JSON.stringify(repo.language||null)})">
            ${already?'Importé':'Importer'}
          </button>
        </div>`;
    }).join('');
  } catch(e) {
    resEl.innerHTML = `<div style="color:var(--danger);padding:12px">Erreur : ${e.message}</div>`;
  }
};

window.scanLocalFolders = async function() {
  const folderPath = (document.getElementById('local-path').value||'').trim();
  const resEl = document.getElementById('local-results');
  if (!folderPath) { resEl.innerHTML = '<div style="color:var(--danger);padding:12px">Entrez un chemin.</div>'; return; }

  resEl.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted)">Scan en cours…</div>';
  try {
    const r = await fetch('/api/local/scan', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('mc_token'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: folderPath })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    if (!data.folders || !data.folders.length) {
      resEl.innerHTML = '<div style="color:var(--warning);padding:12px">Aucun dossier trouvé. Vérifie le chemin.</div>';
      return;
    }
    const existing = new Set(_projectsCache.map(p => p.name.toLowerCase()));
    resEl.innerHTML = data.folders.map(f => {
      const already = existing.has(f.name.toLowerCase());
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 8px;border-bottom:1px solid var(--border-muted)">
          <div style="min-width:0;flex:1;overflow:hidden">
            <div style="font-weight:600;font-size:.88rem;color:var(--text-primary)">${f.name}
              ${already?'<span style="font-size:.68rem;color:var(--success);margin-left:6px">✓ importé</span>':''}
            </div>
            <div style="font-size:.72rem;color:var(--text-muted);margin-top:2px">
              ${f.detectedLang?`<span style="color:var(--accent)">${f.detectedLang}</span> · `:''}${f.lastModified?`modifié ${timeAgo(f.lastModified)}`:''}
            </div>
          </div>
          <button class="btn btn-sm ${already?'btn-ghost':'btn-secondary'}" style="margin-left:10px;flex-shrink:0" ${already?'disabled':''}
            onclick="importProject(${JSON.stringify(f.name)},${JSON.stringify(f.detectedLang||'Autre')},${JSON.stringify('Local: '+f.path)},'',${JSON.stringify(f.detectedLang||null)})">
            ${already?'Importé':'Importer'}
          </button>
        </div>`;
    }).join('');
  } catch(e) {
    resEl.innerHTML = `<div style="color:var(--danger);padding:12px">Erreur : ${e.message}</div>`;
  }
};

window.importProject = async function(name, engine, desc, url, language) {
  try {
    await API.projects.create({ name, engine, status: 'Active', description: desc, tags: ['imported'], repoUrl: url, language: language || null });
    closeModal();
    toast(`${name} importé ✓`, 'success');
    Router.go('projects');
  } catch(e) { toast('Erreur : ' + e.message, 'error'); }
};

async function createProject() {
  const name = document.getElementById('np-name').value.trim();
  if (!name) { toast('Le nom est requis', 'error'); return; }
  try {
    await API.projects.create({
      name,
      engine:      document.getElementById('np-engine').value,
      status:      document.getElementById('np-status').value,
      description: document.getElementById('np-desc').value.trim(),
      tags:        document.getElementById('np-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
      repoUrl:     document.getElementById('np-repo').value.trim(),
    });
    closeModal();
    toast('Projet créé ✓', 'success');
    Router.go('projects');
  } catch(e) { toast('Erreur : ' + e.message, 'error'); }
}