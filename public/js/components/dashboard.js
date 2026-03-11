async function renderDashboard() {
  const [stats, projects, queue] = await Promise.all([
    API.stats(), API.projects.list(), API.queue.list()
  ]);

  const active = projects.filter(p => p.status === 'Active');
  const recentProjects = [...projects].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);
  const queuedItems = queue.filter(q => q.status === 'queued').slice(0, 5);

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Projects</div>
        <div class="stat-value">${stats.totalProjects}</div>
        <div class="stat-change">across all engines</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active</div>
        <div class="stat-value" style="color:var(--success)">${stats.activeProjects}</div>
        <div class="stat-change">in development</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Tasks Done</div>
        <div class="stat-value">${stats.doneTasks}<span style="font-size:1rem;color:var(--text-muted)">/${stats.totalTasks}</span></div>
        <div class="stat-change">${stats.totalTasks ? Math.round(stats.doneTasks/stats.totalTasks*100) : 0}% complete</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Queue</div>
        <div class="stat-value" style="color:var(--warning)">${stats.queuedItems}</div>
        <div class="stat-change">tasks waiting</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Dev Notes</div>
        <div class="stat-value">${stats.totalNotes}</div>
        <div class="stat-change">journal entries</div>
      </div>
    </div>

    <div class="grid-2" style="gap:24px">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Active Projects</span>
          <button class="btn btn-sm btn-ghost" onclick="Router.go('projects')">View all →</button>
        </div>
        ${active.length === 0 ? '<div class="empty-state"><p>No active projects</p></div>' : active.map(p => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-muted);cursor:pointer" onclick="openProject('${p.id}')">
            <div style="flex:1">
              <div style="font-weight:600;font-size:.9rem">${p.name}</div>
              <div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">${p.engine}</div>
            </div>
            <div style="width:80px">
              <div style="font-size:.75rem;color:var(--text-secondary);margin-bottom:4px;text-align:right">${p.progress}%</div>
              <div class="progress-wrap"><div class="progress-bar ${p.progress===100?'full':''}" style="width:${p.progress}%;height:4px"></div></div>
            </div>
            <span class="badge ${statusBadge(p.status)}">${p.status}</span>
          </div>
        `).join('')}
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">OpenClaw Queue</span>
          <button class="btn btn-sm btn-ghost" onclick="Router.go('queue')">View all →</button>
        </div>
        ${queuedItems.length === 0
          ? '<div class="empty-state" style="padding:20px"><p>Queue is empty — OpenClaw is idle</p></div>'
          : queuedItems.map(q => `
            <div class="activity-item">
              <div class="queue-priority-dot priority-${q.priority}"></div>
              <div class="flex-1">
                <div style="font-size:.85rem;font-weight:500">${q.title}</div>
                <div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">${q.project || 'General'} · ${timeAgo(q.createdAt)}</div>
              </div>
              <span class="badge badge-${q.status === 'queued' ? 'yellow' : 'green'}">${q.status}</span>
            </div>
          `).join('')
        }
      </div>
    </div>

    <div class="card mt-24">
      <div class="card-header">
        <span class="card-title">Recent Activity</span>
      </div>
      <div class="activity-feed">
        ${recentProjects.map(p => `
          <div class="activity-item" style="cursor:pointer" onclick="openProject('${p.id}')">
            <div class="activity-dot"></div>
            <div class="activity-text">
              <strong>${p.name}</strong> — ${p.description?.slice(0,80) || 'No description'}
            </div>
            <div class="activity-time">${timeAgo(p.updatedAt)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function statusBadge(status) {
  return { Active:'badge-green', Paused:'badge-yellow', Complete:'badge-blue', Archived:'badge-gray' }[status] || 'badge-gray';
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

function openProject(id) {
  API.projects.get(id).then(p => Router.go('project', p));
}
