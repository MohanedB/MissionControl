async function renderTasks() {
  const tasks = await API.get('/api/tasks');

  const active   = tasks.filter(t => t.status === 'active');
  const queued   = tasks.filter(t => t.status === 'queued');
  const done     = tasks.filter(t => t.status === 'done').slice(0, 10);

  return `
    <div class="section-header mb-8">
      <h2 class="section-title">Task Queue</h2>
      <button class="btn btn-primary" onclick="showNewTaskModal()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Task
      </button>
    </div>
    <p style="color:var(--text-muted);font-size:.83rem;margin-bottom:24px">Donne-moi des tâches à faire. Je les travaille dans l'ordre et je mets à jour le statut.</p>

    ${active.length > 0 ? `
      <div class="card mb-20" style="border-color:var(--accent);box-shadow:0 0 0 1px var(--accent-subtle)">
        <div class="card-header">
          <span class="card-title" style="color:var(--accent)">⚡ En cours</span>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="status-dot online"></div>
            <span style="font-size:.78rem;color:var(--text-secondary)">OpenClaw travaille</span>
          </div>
        </div>
        ${active.map(t => taskRow(t, true)).join('')}
      </div>
    ` : ''}

    <div class="card mb-20">
      <div class="card-header">
        <span class="card-title">📋 File d'attente <span class="badge badge-yellow" style="margin-left:6px">${queued.length}</span></span>
      </div>
      ${queued.length === 0
        ? `<div class="empty-state" style="padding:24px"><h3>Aucune tâche en attente</h3><p>Ajoute une tâche — je m'en occupe</p></div>`
        : queued.map(t => taskRow(t, false)).join('')
      }
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">✅ Terminées (10 dernières)</span>
        <button class="btn btn-ghost btn-sm" onclick="clearDoneTasks()">Effacer</button>
      </div>
      ${done.length === 0
        ? `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:.83rem">Aucune tâche terminée</div>`
        : done.map(t => taskRow(t, false)).join('')
      }
    </div>
  `;
}

function taskRow(t, isActive) {
  const priorityColor = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' }[t.priority] || 'var(--text-muted)';
  return `
    <div style="display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid var(--border-muted)" id="task-${t.id}">
      <div style="width:10px;height:10px;border-radius:50%;background:${priorityColor};margin-top:5px;flex-shrink:0"></div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:.9rem;${t.status==='done'?'text-decoration:line-through;color:var(--text-muted)':''}">${t.title}</div>
        ${t.description ? `<div style="font-size:.8rem;color:var(--text-secondary);margin-top:4px;line-height:1.5">${t.description}</div>` : ''}
        ${t.progress ? `
          <div style="margin-top:8px">
            <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--text-muted);margin-bottom:3px">
              <span>${t.progressNote || 'En cours...'}</span><span>${t.progress}%</span>
            </div>
            <div class="progress-wrap"><div class="progress-bar" style="width:${t.progress}%;height:4px"></div></div>
          </div>
        ` : ''}
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
          <span class="badge badge-gray" style="font-size:.7rem">${t.priority || 'medium'}</span>
          ${t.project ? `<span class="badge badge-blue" style="font-size:.7rem">${t.project}</span>` : ''}
          <span style="font-size:.72rem;color:var(--text-muted)">${timeAgo(t.createdAt)}</span>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        ${t.status !== 'done' ? `
          <button class="btn btn-ghost btn-sm" onclick="markTaskDone('${t.id}')" title="Marquer terminé">✓</button>
        ` : ''}
        <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteTask2('${t.id}')" title="Supprimer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    </div>
  `;
}

function showNewTaskModal() {
  API.projects.list().then(projects => {
    showModal('Nouvelle tâche pour OpenClaw', `
      <div class="form-group">
        <label class="form-label">Titre de la tâche</label>
        <input class="form-input" id="nt-title" placeholder="Ex: Fix le bug dans TazMovementComponent.cpp">
      </div>
      <div class="form-group">
        <label class="form-label">Description (optionnel)</label>
        <textarea class="form-textarea" id="nt-desc" rows="3" placeholder="Détails, contexte, fichiers concernés…"></textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">Priorité</label>
          <select class="form-select" id="nt-priority">
            <option value="high">🔴 Haute</option>
            <option value="medium" selected>🟡 Moyenne</option>
            <option value="low">🟢 Basse</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Projet</label>
          <select class="form-select" id="nt-project">
            <option value="">Général</option>
            ${projects.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="createTask()">Ajouter à la queue</button>
      </div>
    `);
    setTimeout(() => document.getElementById('nt-title')?.focus(), 100);
  });
}

async function createTask() {
  const title = document.getElementById('nt-title').value.trim();
  if (!title) { toast('Titre requis', 'error'); return; }
  await API.post('/api/tasks', {
    title,
    description: document.getElementById('nt-desc').value.trim(),
    priority: document.getElementById('nt-priority').value,
    project: document.getElementById('nt-project').value,
    status: 'queued'
  });
  closeModal();
  toast('Tâche ajoutée à la queue', 'success');
  Router.go('tasks');
}

async function markTaskDone(id) {
  await API.put(`/api/tasks/${id}`, { status: 'done', progress: 100, progressNote: 'Terminé' });
  toast('Tâche marquée terminée', 'success');
  Router.go('tasks');
}

async function deleteTask2(id) {
  await API.del(`/api/tasks/${id}`);
  toast('Tâche supprimée', 'success');
  Router.go('tasks');
}

async function clearDoneTasks() {
  const tasks = await API.get('/api/tasks');
  const done = tasks.filter(t => t.status === 'done');
  for (const t of done) await API.del(`/api/tasks/${t.id}`);
  toast('Tâches terminées effacées', 'success');
  Router.go('tasks');
}
