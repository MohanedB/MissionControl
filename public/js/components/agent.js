// ==========================================
// COMPOSANT : AGENT STATUS (VERSION ULTIME)
// ==========================================

async function renderAgent() {
  return `
    <div class="section-header mb-24" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h2 class="section-title">Centre de Commandement de l'Agent</h2>
        <p style="font-size:.85rem;color:var(--text-muted);margin-top:4px">Monitoring en temps réel des systèmes OpenClaw</p>
      </div>
      <div style="display:flex; gap:12px; align-items:center;">
        <div id="pollingIndicator" style="font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
          <div class="status-dot online" style="width:8px; height:8px;"></div> Live
        </div>
        <button class="btn btn-secondary btn-sm" onclick="reloadAgent()">↻ Force Sync</button>
      </div>
    </div>

    <div class="stats-grid mb-24" style="grid-template-columns: repeat(4, 1fr);">
      <div class="stat-card">
        <div class="stat-label">Statut Gateway</div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:5px;">
          <div id="gwLabel" style="font-weight:800; font-size:1.3rem">Vérification...</div>
          <div class="status-dot" id="gwDot" style="width:12px; height:12px;"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Modèle Actif (En cours)</div>
        <div id="activeModelDisplay" style="font-weight:800; font-size:1.1rem; color:var(--accent); margin-top:5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Chargement...</div>
        <div id="primaryConfigDisplay" style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">Configuré : --</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Latence API (Ping)</div>
        <div id="pingDisplay" style="font-weight:800; font-size:1.3rem; color:var(--text-primary); margin-top:5px;">-- ms</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Tokens Utilisés / Quota</div>
        <div id="tokenDisplay" style="font-weight:800; font-size:1.3rem; color:var(--success); margin-top:5px;">-- / --</div>
      </div>
    </div>

    <div class="grid-2" style="gap:24px; align-items: start;">
      <div class="flex-col gap-24">
        
        <div class="card" style="border-left: 4px solid var(--accent);">
          <div class="card-header"><span class="card-title">Matrice de Résolution LLM</span></div>
          <div id="llmListBlock" style="margin-top:10px;">
            <div style="color:var(--text-muted);font-size:.85rem">Fetch des configurations...</div>
          </div>
          <div style="margin-top:15px; padding-top:10px; border-top:1px dashed var(--border-muted); font-size:0.75rem; color:var(--text-muted);">
            <i class="fas fa-info-circle"></i> Si le modèle configuré échoue, OpenClaw descendra dans la liste. Le "Modèle Actif" indique celui qui a réellement répondu en dernier.
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Télémétrie des Tokens</span></div>
          <div id="todayBlock" style="margin-top:10px;">
            <div style="color:var(--text-muted);font-size:.85rem">Analyse des flux...</div>
          </div>
        </div>

        <div class="card" style="border: 1px solid var(--border-muted); background: rgba(0,0,0,0.1);">
          <div class="card-header"><span class="card-title">Contrôles d'Alimentation</span></div>
          <div style="display:flex; gap:12px; margin-top:15px">
            <button class="btn btn-primary flex-1" id="btnStart" onclick="controlGateway('start')" style="font-weight:bold;">INITIALISER</button>
            <button class="btn btn-danger flex-1" id="btnStop" onclick="controlGateway('stop')" style="font-weight:bold;">COUPER</button>
          </div>
          <pre id="controlOutput" style="display:none; font-family:'Cascadia Code', monospace; font-size:.75rem; background:#000; color:#0f0; padding:12px; border-radius:6px; margin-top:15px; border: 1px solid #333;"></pre>
        </div>
      </div>

      <div class="flex-col gap-24">
        <div class="card" style="height: 100%; display:flex; flex-direction:column; background:#0a0a0c; border: 1px solid #222;">
          <div class="card-header" style="border-bottom: 1px solid #222; padding-bottom:10px;">
            <span class="card-title" style="color:#fff; display:flex; justify-content:space-between; width:100%">
              <span>Terminal d'Activité</span>
              <span id="logCount" style="font-size:0.7rem; color:#666;">0 lignes</span>
            </span>
          </div>
          <div id="liveLogs" style="font-family:'Cascadia Code', Consolas, monospace; font-size:.75rem; height:600px; overflow-y:auto; padding:16px; line-height:1.7; word-break: break-all; color:#ccc;">
            <span style="color:#555;">&gt; Attente de la connexion au flux...</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// MOTEUR LOGIQUE
// ==========================================

let pollingInterval;
let _currentPrimary = 'Inconnu';

async function reloadAgent() {
  const content = document.getElementById('content');
  if (content) content.innerHTML = await renderAgent();
  
  if (pollingInterval) clearInterval(pollingInterval);
  
  await loadLLMInfo();
  await startAgentPolling();
  
  pollingInterval = setInterval(startAgentPolling, 5000);
}

async function startAgentPolling() {
  const startTime = Date.now();
  await loadAgentStatus();
  await loadLogs();
  
  const ping = Date.now() - startTime;
  const pingEl = document.getElementById('pingDisplay');
  if (pingEl) {
    pingEl.textContent = ping + ' ms';
    pingEl.style.color = ping < 200 ? 'var(--success)' : (ping < 800 ? 'var(--warning)' : 'var(--danger)');
  }
}

async function loadAgentStatus() {
  try {
    const token = localStorage.getItem('mc_token') || '';
    const res = await fetch('/api/agent-status', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) throw new Error('Status ' + res.status);
    const data = await res.json();

    // GATEWAY
    const dot = document.getElementById('gwDot');
    const lbl = document.getElementById('gwLabel');
    if (dot) { dot.className = 'status-dot'; dot.classList.add(data.gateway ? 'online' : 'offline'); }
    if (lbl) {
      lbl.textContent = data.gateway ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE';
      lbl.style.color = data.gateway ? 'var(--success)' : 'var(--danger)';
    }

    // MODÈLE ACTIF — lit le vrai modèle depuis les logs, pas les sessions
    
    const activeModel = data.activeModel || _currentPrimary;
    const isFallback  = data.model && data.lastSucceededModel && data.lastSucceededModel !== data.model;
    console.log('[DEBUG] activeModel from server:', data.activeModel); 


    // MAJ CARTE HAUTE
    const activeModelEl = document.getElementById('activeModelDisplay');
    if (activeModelEl) {
      activeModelEl.textContent = activeModel;
      activeModelEl.style.color = isFallback ? 'var(--warning)' : 'var(--accent)';
      activeModelEl.title = isFallback
        ? `Fallback actif ! Configuré: ${data.model}`
        : 'Primary en fonctionnement normal.';
    }

    // MAJ SIDEBAR
    const sidebarLbl = document.getElementById('llmLabel');
    const sidebarDot = document.getElementById('llmDot');
    if (sidebarLbl) sidebarLbl.textContent = `LLM: ${activeModel}`;
    if (sidebarDot) {
      sidebarDot.style.display = 'inline-block';
      sidebarDot.style.background = isFallback ? 'var(--warning)' : 'var(--success)';
    }

    // TOKENS
    const tokenDisp = document.getElementById('tokenDisplay');
    if (tokenDisp) {
      tokenDisp.innerHTML = data.today
        ? `${fmtNum(data.today.freshTokens)} <span style="font-size:0.85rem; color:var(--text-muted);">/ ${fmtNum(data.today.budget)}</span>`
        : `0 <span style="font-size:0.85rem; color:var(--text-muted);">/ 0</span>`;
    }

    // QUOTA
    const todayEl = document.getElementById('todayBlock');
    if (todayEl && data.today) {
      const td = data.today;
      const barColor = td.pct > 90 ? 'var(--danger)' : (td.pct > 75 ? 'var(--warning)' : 'var(--accent)');
      todayEl.innerHTML = `
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:.85rem;margin-bottom:6px">
            <span>Utilisation Journalière</span><span style="color:${barColor}">${td.pct}%</span>
          </div>
          <div class="progress-wrap" style="background:var(--bg-modifier-hover); border-radius:4px;">
            <div class="progress-bar" style="width:${td.pct}%;height:8px; background:${barColor}; border-radius:4px;"></div>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:.75rem; color:var(--text-secondary); padding-top:8px; border-top:1px solid var(--border-muted);">
          <span>Tokens consommés :</span>
          <span style="font-family:monospace; font-weight:bold;">${fmtNum(td.freshTokens)}</span>
        </div>
      `;
    }
 } catch(e) {
  console.error("Erreur Agent Status:", e);
  const lbl = document.getElementById('gwLabel');
  const dot = document.getElementById('gwDot');
  if (lbl) { lbl.textContent = 'ERREUR API'; lbl.style.color = 'var(--danger)'; }
  if (dot) { dot.className = 'status-dot offline'; }
  const activeModelEl = document.getElementById('activeModelDisplay');
  if (activeModelEl) { activeModelEl.textContent = e.message; activeModelEl.style.color = 'var(--danger)'; }
}
}

async function loadLLMInfo() {
  try {
    const token = localStorage.getItem('mc_token') || '';
    const res = await fetch('/api/llm', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await res.json();
    
    _currentPrimary = data.primary || 'Non assigné';
    const fallbacks = data.fallbacks || [];
    
    const primaryConfigEl = document.getElementById('primaryConfigDisplay');
    if (primaryConfigEl) primaryConfigEl.textContent = `Configuré : ${_currentPrimary}`;

    const listBlock = document.getElementById('llmListBlock');
    if (listBlock) {
      let html = `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border-muted)">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="background:var(--accent); color:#fff; padding:3px 8px; border-radius:4px; font-size:0.7rem; font-weight:900; letter-spacing:1px;">PRIMARY</span>
            <span style="font-weight:700; font-size:0.95rem; color:var(--text-primary)">${_currentPrimary}</span>
          </div>
        </div>
      `;
      
      if (fallbacks.length > 0) {
        fallbacks.forEach((fb, idx) => {
          html += `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
              <div style="display:flex; align-items:center; gap:12px;">
                <span style="background:var(--bg-modifier-hover); color:var(--text-secondary); padding:2px 6px; border-radius:4px; font-size:0.65rem; font-weight:bold;">BACKUP ${idx + 1}</span>
                <span style="color:var(--text-secondary); font-size:0.85rem;">${fb}</span>
              </div>
            </div>
          `;
        });
      }
      listBlock.innerHTML = html;
    }
  } catch(e) { console.error("Erreur Configuration LLM:", e); }
}

async function loadLogs() {
  try {
    const token = localStorage.getItem('mc_token') || '';
    const res = await fetch('/api/logs', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await res.json();
    const el = document.getElementById('liveLogs');
    const counter = document.getElementById('logCount');
    
    if (el && data.lines) {
      if (counter) counter.textContent = `${data.lines.length} events`;
      
      el.innerHTML = data.lines.map(l => {
        let color = '#8892b0';
        let prefix = '<span style="color:#4d5bce;">[INFO]</span>';
        
        if (l.toLowerCase().includes('rate_limit') || l.includes('429')) {
          color = '#ff6b6b'; prefix = '<span style="color:#ff6b6b; font-weight:bold;">[RATE LIMIT]</span>';
        } else if (l.toLowerCase().includes('erreur') || l.includes('error') || l.includes('fail')) {
          color = '#ff4757'; prefix = '<span style="color:#ff4757; font-weight:bold;">[ERROR]</span>';
        } else if (l.toLowerCase().includes('fallback') || l.includes('warn')) {
          color = '#ffa502'; prefix = '<span style="color:#ffa502; font-weight:bold;">[WARN]</span>';
        } else if (l.toLowerCase().includes('success') || l.includes('succeeded') || l.includes('start')) {
          color = '#2ed573'; prefix = '<span style="color:#2ed573;">[OK]</span>';
        }
        
        let formattedLine = l.replace(/(gemini-[\w.-]+|claude-[\w.-]+|gpt-[\w.-]+)/gi, '<span style="color:#eccc68; font-weight:bold;">$1</span>');
        return `<div style="margin-bottom:8px; color:${color}; padding-left:10px; border-left:2px solid rgba(255,255,255,0.05); hover:background:rgba(255,255,255,0.02);">${prefix} ${formattedLine}</div>`;
      }).join('');
      el.scrollTop = el.scrollHeight;
    }
  } catch(e) {}
}

async function controlGateway(action) {
  const outEl = document.getElementById('controlOutput');
  const btnStart = document.getElementById('btnStart');
  const btnStop  = document.getElementById('btnStop');

  // Disable buttons during execution
  if (btnStart) btnStart.disabled = true;
  if (btnStop)  btnStop.disabled  = true;

  if (outEl) {
    outEl.style.display = 'block';
    outEl.innerHTML = `<span style="color:var(--accent)">></span> Executing: <span style="color:#fff;font-weight:600">${action.toUpperCase()}</span>...\n`;
  }

  const label = { start: 'INITIALISER', stop: 'COUPER' };
  const re = (msg, isErr) => {
    if (outEl) outEl.innerHTML += `\n<span style="color:${isErr?'var(--danger)':'var(--success)'}">> ${msg}</span>`;
    setTimeout(() => {
      if (btnStart) btnStart.disabled = false;
      if (btnStop)  btnStop.disabled  = false;
      loadAgentStatus();
      setTimeout(() => { if (outEl) outEl.style.display = 'none'; }, 3000);
    }, 1200);
  };

  try {
    const token = localStorage.getItem('mc_token') || '';
    const res = await fetch('/api/openclaw/control', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });

    if (!res.ok) {
      const txt = await res.text();
      re('Server error ' + res.status + ': ' + txt, true);
      return;
    }

    const data = await res.json();
    const out = (data.output || '').replace(/&/g,'&amp;').replace(/</g,'&lt;');

    if (outEl && out) {
      out.split('\n').forEach(line => {
        if (!line.trim()) return;
        const color = line.toLowerCase().includes('error') ? 'var(--danger)'
                    : line.toLowerCase().includes('warn')  ? 'var(--warning)'
                    : 'var(--text-secondary)';
        outEl.innerHTML += `\n<span style="color:${color}">  ${line}</span>`;
      });
    }

    re(data.ok ? `${action.toUpperCase()} — OK` : (data.output || 'Completed'), !data.ok);

  } catch(e) {
    // Network-level failure — server unreachable or crashed
    const hint = e.message === 'Failed to fetch'
      ? 'Serveur inaccessible. Vérifie que node server.js tourne sur localhost:3000.'
      : e.message;
    re('ERREUR: ' + hint, true);
    if (btnStart) btnStart.disabled = false;
    if (btnStop)  btnStop.disabled  = false;
  }
}

function fmtNum(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n/1000000).toFixed(2)+'M';
  if (n >= 1000) return (n/1000).toFixed(1)+'k';
  return String(n);
}

window.addEventListener('hashchange', () => {
  if (window.location.hash !== '#agent' && pollingInterval) {
    clearInterval(pollingInterval);
  }
});