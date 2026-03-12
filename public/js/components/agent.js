async function renderAgent() {
  return `
    <div class="section-header mb-24">
      <div>
        <h2 class="section-title">Agent Status</h2>
        <p style="font-size:.8rem;color:var(--text-muted);margin-top:3px">Live stats from OpenClaw</p>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="reloadAgent()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Refresh
      </button>
    </div>

    <!-- TODAY'S USAGE — main card -->
    <div class="card mb-20" style="border-color:var(--accent);box-shadow:0 0 0 1px var(--accent-subtle)">
      <div class="card-header">
        <span class="card-title">📅 Aujourd'hui</span>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="status-dot" id="gwDot"></div>
          <span id="gwLabel" style="font-size:.78rem;color:var(--text-secondary)">Checking…</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
          <div class="status-dot" id="llmDot" style="background:#777"></div>
          <span id="llmLabel" style="font-size:.78rem;color:var(--text-secondary)">LLM: loading…</span>
        </div>
      </div>
      <div id="todayBlock"><div style="color:var(--text-muted);font-size:.85rem;padding:8px 0">Loading…</div></div>
    </div>

    <!-- Discord session context -->
    <div class="card mb-20">
      <div class="card-header"><span class="card-title">💬 Session Discord (contexte)</span></div>
      <div id="discordTokenBlock">
        <div style="color:var(--text-muted);font-size:.85rem;padding:8px 0">Loading…</div>
      </div>
    </div>

    <!-- APIs -->
    <div class="card mb-20" id="apisCard">
      <div class="card-header">
        <span class="card-title">🔑 APIs configurées</span>
        <span id="activeApiLabel" style="font-size:.75rem;color:var(--text-muted)"></span>
      </div>
      <div id="apisBlock"><div style="color:var(--text-muted);font-size:.85rem;padding:8px 0">Loading…</div></div>
    </div>

    <!-- Rate limit warning -->
    <div id="rateLimitCard" style="display:none" class="card mb-20">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:1.4rem">⚠️</span>
        <div style="flex:1">
          <div style="font-weight:600;color:var(--danger);margin-bottom:2px">Rate limit hit</div>
          <div style="font-size:.83rem;color:var(--text-secondary)" id="rateLimitMsg">Waiting for reset…</div>
        </div>
        <div style="text-align:center;background:var(--bg-tertiary);border-radius:var(--radius);padding:10px 16px">
          <div style="font-size:1.4rem;font-weight:700;color:var(--accent);font-variant-numeric:tabular-nums" id="resetTimer">—</div>
          <div style="font-size:.7rem;color:var(--text-muted);margin-top:2px">until reset</div>
        </div>
      </div>
    </div>

    <!-- All sessions -->
    <div class="card mb-20">
      <div class="card-header"><span class="card-title">📊 All Sessions</span></div>
      <div id="sessionsList"><div style="color:var(--text-muted);font-size:.85rem;padding:8px 0">Loading…</div></div>
    </div>

    <!-- OpenClaw controls -->
    <div class="card mb-20">
      <div class="card-header"><span class="card-title">🎮 Gateway Controls</span></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;padding:4px 0 8px">
        <button class="btn btn-primary" id="btnStart" onclick="controlGateway('start')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Start Gateway
        </button>
        <button class="btn btn-secondary" id="btnStop" onclick="controlGateway('stop')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12"/></svg>
          Stop Gateway
        </button>
        <button class="btn btn-ghost" onclick="controlGateway('status')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Status
        </button>
      </div>
      <pre id="controlOutput" style="display:none;font-size:.72rem;font-family:monospace;color:var(--text-secondary);background:var(--bg-primary);padding:10px;border-radius:var(--radius);margin-top:8px;max-height:120px;overflow-y:auto;white-space:pre-wrap;word-break:break-all"></pre>
    </div>

    <!-- Skills + Logs -->
    <div class="grid-2" style="gap:20px">
      <div class="card">
        <div class="card-header"><span class="card-title">Skills installés</span></div>
        ${['gemini','github','gog','discord','weather','coding-agent','healthcheck','mcporter','skill-creator'].map(s => `
          <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border-muted)">
            <div class="status-dot online"></div>
            <span style="font-size:.87rem">${s}</span>
          </div>`).join('')}
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">Live Logs</span>
          <button class="btn btn-ghost btn-sm" onclick="loadLogs()">↻</button>
        </div>
        <div id="liveLogs" style="font-family:monospace;font-size:.72rem;color:var(--text-secondary);line-height:1.7;max-height:280px;overflow-y:auto;background:var(--bg-primary);padding:10px;border-radius:var(--radius)">
          Loading…
        </div>
      </div>
    </div>
  `;
}

async function reloadAgent() {
  document.getElementById('content').innerHTML = await renderAgent();
  startAgentPolling();
}

let _resetInterval = null;

async function startAgentPolling() {
  await loadAgentStatus();
  await loadLogs();
}

let _localApiBase = null;
async function getLocalApiBase() {
  if (_localApiBase !== null) return _localApiBase;
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) { _localApiBase = ''; return ''; }
  // Try injected var first, then fetch config
  if (window.__LOCAL_API_URL__) { _localApiBase = window.__LOCAL_API_URL__; return _localApiBase; }
  try {
    const token = localStorage.getItem('mc_token') || '';
    const r = await fetch('/api/config', { headers: { 'Authorization': 'Bearer ' + token } });
    const cfg = await r.json();
    _localApiBase = cfg.localApiUrl || '';
  } catch { _localApiBase = ''; }
  return _localApiBase;
}

function _setCloudModePlaceholder() {
  const isCloud = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  if (!isCloud) return false;
  const dot = document.getElementById('gwDot');
  const lbl = document.getElementById('gwLabel');
  if (dot) { dot.classList.remove('online'); dot.classList.add('offline'); }
  if (lbl) lbl.textContent = '☁️ Cloud mode — gateway not reachable';
  const cloudMsg = `<div style="color:var(--text-muted);font-size:.85rem;padding:8px 0">☁️ Non disponible en mode cloud — utilise <strong>localhost:3000</strong> pour voir les données en direct</div>`;
  ['todayBlock','discordTokenBlock','apisBlock','sessionsList'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = cloudMsg;
  });
  const logsEl = document.getElementById('liveLogs');
  if (logsEl) logsEl.innerHTML = '<span style="color:var(--text-muted)">Logs only available on local dashboard</span>';
  // Disable gateway control buttons
  ['btnStart','btnStop'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) { btn.disabled = true; btn.title = 'Only available on localhost'; }
  });
  const outEl = document.getElementById('controlOutput');
  if (outEl) { outEl.style.display = 'block'; outEl.textContent = '⚠️ Gateway control not available in cloud mode.\nOpen localhost:3000 to start/stop the gateway.'; }
  return true;
}

async function loadAgentStatus() {
  // On cloud: disable gateway controls, but still fetch data via server-side Tailscale proxy
  const isCloud = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  if (isCloud) {
    ['btnStart','btnStop'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) { btn.disabled = true; btn.title = 'Only available on localhost'; }
    });
    const outEl = document.getElementById('controlOutput');
    if (outEl) { outEl.style.display = 'block'; outEl.textContent = '⚠️ Gateway control not available in cloud mode.\nOpen localhost:3000 to start/stop the gateway.'; }
  }
  try {
    // Always use relative URL — on Vercel the server proxies to local via Tailscale
    const url = '/api/agent-status';
    const token = localStorage.getItem('mc_token') || '';
    const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
    if (res.status === 401) {
      // Stale token — send to login
      localStorage.removeItem('mc_token');
      window.location.replace('/login.html');
      return;
    }
    if (!res.ok) throw new Error('Status ' + res.status);
    const data = await res.json();

    // If proxy failed (Tailscale unreachable), show error
    if (data._error) {
      const dot = document.getElementById('gwDot');
      const lbl = document.getElementById('gwLabel');
      if (dot) { dot.classList.remove('online'); dot.classList.add('offline'); }
      if (lbl) lbl.textContent = '☁️ Local unreachable — ' + data._error;
      ['todayBlock','discordTokenBlock','apisBlock','sessionsList'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<div style="color:var(--text-muted);font-size:.85rem;padding:8px 0">⚠️ Can't reach local machine: ${data._error}</div>`;
      });
      return;
    }

    // Stale warning (cloud mode, data > 2 min old)
    if (data._stale) {
      const lbl = document.getElementById('gwLabel');
      if (lbl) lbl.textContent = `⚠️ Stale data (${data._ageSeconds}s ago) — is local server running?`;
    }

    // Gateway indicator
    const dot   = document.getElementById('gwDot');
    const label = document.getElementById('gwLabel');
    if (dot)   { dot.classList.toggle('online', data.gateway); dot.classList.toggle('offline', !data.gateway); }
    if (!data._stale && label) label.textContent = data.gateway ? `🟢 Online ${data.gatewayMs ? '· ' + data.gatewayMs + 'ms' : ''}` : '🔴 Offline';

    // ─── LLM indicator ───────────────────────────────────────────────────────
    try {
      // Use the active API profile's model (the one actually used for the last request)
      const apis = data.apis;
      let currentModel = 'unknown';
      if (apis && apis.activeProfile && apis.profiles && apis.profiles[apis.activeProfile]) {
        currentModel = apis.profiles[apis.activeProfile].model || apis.profiles[apis.activeProfile].provider || currentModel;
      }
      const llmDot = document.getElementById('llmDot');
      const llmLbl = document.getElementById('llmLabel');
      if (llmDot && llmLbl) {
        llmDot.style.background = '#4caf50';
        llmLbl.textContent = `LLM: ${currentModel}`;
      }
    } catch(e) { console.error('LLM display error', e); }


    // TODAY block
    const todayEl = document.getElementById('todayBlock');
    if (todayEl && data.today) {
      const td = data.today;
      const pct = td.pct || 0;
      const barColor = pct >= 80 ? 'var(--danger)' : pct >= 50 ? 'var(--warning)' : 'var(--accent)';
      todayEl.innerHTML = `
        <div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
            <span style="font-size:.85rem;color:var(--text-secondary)">Tokens frais utilisés aujourd'hui</span>
            <span style="font-size:1.6rem;font-weight:700;color:${barColor};font-variant-numeric:tabular-nums">${pct}%</span>
          </div>
          <div style="background:var(--bg-primary);border-radius:6px;height:12px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${barColor};border-radius:6px;transition:.4s"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:.75rem;color:var(--text-muted)">
            <span>${fmtNum(td.freshTokens)} tokens utilisés</span>
            <span style="color:${pct>=80?'var(--danger)':'var(--text-muted)'}"><strong style="color:var(--text-primary)">${fmtNum(td.remaining)}</strong> restants</span>
          </div>
        </div>
        <div style="display:flex;gap:20px;flex-wrap:wrap">
          <div>
            <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:2px">Input frais</div>
            <div style="font-weight:600">${fmtNum(td.inputFresh)}</div>
          </div>
          <div>
            <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:2px">Output</div>
            <div style="font-weight:600">${fmtNum(td.outputFresh)}</div>
          </div>
          <div>
            <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:2px">Cache lu</div>
            <div style="font-weight:600;color:var(--success)">${fmtNum(td.cacheRead)}</div>
          </div>
          <div>
            <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:2px">Valeur équivalente</div>
            <div style="font-weight:600;color:var(--text-secondary)">~$${td.cost}</div>
          </div>
          <div>
            <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:2px">Quota/jour</div>
            <div style="font-weight:600;color:var(--text-secondary)">${fmtNum(td.budget)} <span style="font-size:.7rem;font-weight:400">(configurable)</span></div>
          </div>
        </div>
        ${pct >= 80 ? `<div style="margin-top:12px;background:rgba(248,81,73,.08);border:1px solid rgba(248,81,73,.25);border-radius:var(--radius);padding:8px 12px;font-size:.8rem;color:var(--danger)">⚠️ Proche de la limite — si tu vois une erreur 429, attends ~1h avant de continuer.</div>` : ''}
      `;
    } else if (todayEl) {
      todayEl.innerHTML = '<div style="color:var(--text-muted);font-size:.85rem;padding:8px 0">Aucune donnée pour aujourd\'hui</div>';
    }

    // Discord session block
    const discordEl = document.getElementById('discordTokenBlock');
    if (discordEl) {
      if (data.discord) {
        const d = data.discord;
        const pct = d.pct || 0;
        const barColor = pct >= 85 ? 'var(--danger)' : pct >= 60 ? 'var(--warning)' : 'var(--accent)';
        discordEl.innerHTML = `
          <div style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
              <span style="font-size:.85rem;color:var(--text-secondary)">Context window used</span>
              <span style="font-size:1.4rem;font-weight:700;color:${barColor}">${pct}%</span>
            </div>
            <div style="background:var(--bg-primary);border-radius:6px;height:10px;overflow:hidden">
              <div style="width:${pct}%;height:100%;background:${barColor};border-radius:6px;transition:.4s"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:.75rem;color:var(--text-muted)">
              <span>${fmtNum(d.tokensUsed)} tokens used</span>
              <span>${fmtNum(d.tokensTotal)} max</span>
            </div>
          </div>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <div><div style="font-size:.72rem;color:var(--text-muted);margin-bottom:2px">Cache hit rate</div>
              <div style="font-weight:600;color:var(--success)">${d.cacheHitRate !== null ? d.cacheHitRate + '%' : '—'}</div></div>
            <div><div style="font-size:.72rem;color:var(--text-muted);margin-bottom:2px">Session age</div>
              <div style="font-weight:600">${d.age || '—'}</div></div>
            <div><div style="font-size:.72rem;color:var(--text-muted);margin-bottom:2px">Model</div>
              <div style="font-weight:600;color:var(--accent)">claude-sonnet-4-6</div></div>
            ${pct >= 80 ? `<div style="background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.3);border-radius:var(--radius);padding:6px 12px;font-size:.78rem;color:var(--danger)">⚠️ Context almost full — will auto-compact at 100%</div>` : ''}
          </div>
        `;
      } else {
        discordEl.innerHTML = '<div style="color:var(--text-muted);font-size:.85rem;padding:8px 0">No active Discord session</div>';
      }
    }

    // APIs card
    const apisEl = document.getElementById('apisBlock');
    const activeApiLbl = document.getElementById('activeApiLabel');
    if (apisEl && data.apis) {
      const { profiles, activeProfile } = data.apis;

      const PROVIDER_META = {
        anthropic: { name: 'Anthropic', icon: '🧠', color: '#c084fc', model: 'claude-sonnet-4-6' },
        google:    { name: 'Google',    icon: '🌐', color: '#4ade80', model: 'gemini-2.0-flash' },
      };

      if (activeApiLbl) {
        const ap = profiles[activeProfile];
        const pm = ap ? PROVIDER_META[ap.provider] : null;
        activeApiLbl.textContent = activeProfile
          ? `Active: ${pm?.name || ap.provider} (${activeProfile})`
          : 'No active profile';
      }

      // Deduplicate: prefer "anthropic:default" over "anthropic:claude" if they're the same provider+key
      const seen = new Map();
      for (const [name, p] of Object.entries(profiles)) {
        const key = p.provider + ':' + p.masked;
        if (!seen.has(key) || name === activeProfile) seen.set(key, [name, p]);
      }
      const displayProfiles = [...seen.values()];

      apisEl.innerHTML = displayProfiles.map(([name, p]) => {
        const pm          = PROVIDER_META[p.provider] || { name: p.provider, icon: '🔌', color: 'var(--text-muted)', model: '—' };
        const isActive    = name === activeProfile;
        const isFallback  = !isActive && p.lastUsed;
        const rateLimits  = p.failureCounts?.rate_limit || 0;
        const lastUsedStr = p.lastUsedAgo !== null
          ? (p.lastUsedAgo < 1 ? 'just now' : p.lastUsedAgo < 60 ? p.lastUsedAgo + 'm ago' : Math.round(p.lastUsedAgo/60) + 'h ago')
          : 'never';

        const statusBadge = p.onCooldown
          ? `<span style="background:rgba(248,81,73,.15);color:var(--danger);border:1px solid rgba(248,81,73,.3);border-radius:4px;padding:2px 8px;font-size:.7rem;font-weight:600">⏳ Cooldown ${p.cooldownSecs}s</span>`
          : isActive
          ? `<span style="background:rgba(88,166,255,.15);color:var(--accent);border:1px solid rgba(88,166,255,.3);border-radius:4px;padding:2px 8px;font-size:.7rem;font-weight:600">✅ Actif</span>`
          : `<span style="background:var(--bg-tertiary);color:var(--text-muted);border:1px solid var(--border-muted);border-radius:4px;padding:2px 8px;font-size:.7rem;font-weight:600">💤 Fallback</span>`;

        return `
          <div style="display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid var(--border-muted);${isActive ? 'opacity:1' : 'opacity:.85'}">
            <div style="font-size:1.7rem;line-height:1;padding-top:2px">${pm.icon}</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
                <span style="font-size:.92rem;font-weight:700;color:${pm.color}">${pm.name}</span>
                ${statusBadge}
              </div>
              <div style="display:flex;gap:16px;flex-wrap:wrap">
                <div>
                  <div style="font-size:.68rem;color:var(--text-muted);margin-bottom:2px">Modèle</div>
                  <div style="font-size:.82rem;font-weight:600">${pm.model}</div>
                </div>
                <div>
                  <div style="font-size:.68rem;color:var(--text-muted);margin-bottom:2px">Clé</div>
                  <div style="font-size:.8rem;font-family:monospace;color:var(--text-secondary)">${p.masked}</div>
                </div>
                <div>
                  <div style="font-size:.68rem;color:var(--text-muted);margin-bottom:2px">Dernier appel</div>
                  <div style="font-size:.82rem;font-weight:600">${lastUsedStr}</div>
                </div>
                <div>
                  <div style="font-size:.68rem;color:var(--text-muted);margin-bottom:2px">Rate limits</div>
                  <div style="font-size:.82rem;font-weight:600;color:${rateLimits > 0 ? 'var(--warning)' : 'var(--success)'}">${rateLimits > 0 ? '⚠️ ' + rateLimits : '✅ 0'}</div>
                </div>
                <div>
                  <div style="font-size:.68rem;color:var(--text-muted);margin-bottom:2px">Erreurs total</div>
                  <div style="font-size:.82rem;font-weight:600;color:${p.errorCount > 0 ? 'var(--warning)' : 'var(--success)'}">${p.errorCount}</div>
                </div>
              </div>
            </div>
          </div>`;
      }).join('');

      // Append cost note
      apisEl.innerHTML += `
        <div style="margin-top:10px;padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius);font-size:.75rem;color:var(--text-muted)">
          💡 Coût estimé aujourd'hui (session) : <strong style="color:var(--text-secondary)">$${data.estimatedCost || '0.0000'}</strong>
          &nbsp;·&nbsp; Pour le solde exact, consulte <a href="https://console.anthropic.com" target="_blank" style="color:var(--accent);text-decoration:none">console.anthropic.com</a>
        </div>`;
    } else if (apisEl) {
      apisEl.innerHTML = '<div style="color:var(--text-muted);font-size:.85rem;padding:8px 0">Profils non disponibles</div>';
    }

    // Rate limit card
    const rlCard = document.getElementById('rateLimitCard');
    const rlMsg  = document.getElementById('rateLimitMsg');
    if (rlCard) {
      if (data.rateLimitAt && data.resetInSeconds > 0) {
        rlCard.style.display = 'block';
        if (rlMsg) rlMsg.textContent = `Rate limit hit at ${new Date(data.rateLimitAt).toLocaleTimeString()}`;
        startResetTimer(data.resetInSeconds);
      } else {
        rlCard.style.display = 'none';
        if (_resetInterval) { clearInterval(_resetInterval); _resetInterval = null; }
      }
    }

    // Sessions list
    const sessEl = document.getElementById('sessionsList');
    if (sessEl && data.sessions?.length) {
      sessEl.innerHTML = data.sessions.map(s => {
        const channelLabel = { discord: '💬 Discord', 'mission-control': '🖥️ Mission Control', api: '🔌 API', other: '📦 Other' }[s.channel] || s.channel;
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-muted)">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
                <span style="font-size:.85rem;font-weight:600">${channelLabel}</span>
                <span class="badge badge-gray" style="font-size:.68rem">${s.age}</span>
              </div>
              <div style="font-size:.75rem;color:var(--text-muted)">${s.raw}</div>
            </div>
            ${s.pct !== null ? `<div style="text-align:right;flex-shrink:0">
              <div style="font-weight:700;color:${s.pct>=80?'var(--danger)':s.pct>=60?'var(--warning)':'var(--text-primary)'}">${s.pct}%</div>
              <div style="font-size:.7rem;color:var(--text-muted)">ctx</div>
            </div>` : ''}
          </div>`;
      }).join('');
    } else if (sessEl) {
      sessEl.innerHTML = '<div style="color:var(--text-muted);font-size:.85rem;padding:8px 0">No active sessions</div>';
    }

  } catch(e) {
    const dot = document.getElementById('gwDot');
    const lbl = document.getElementById('gwLabel');
    if (dot) { dot.classList.remove('online'); dot.classList.add('offline'); }
    if (lbl) lbl.textContent = '🔴 Offline';
    const errMsg = `<div style="color:var(--danger);font-size:.85rem;padding:8px 0">⚠️ Erreur: ${e.message}</div>`;
    ['todayBlock','discordTokenBlock','apisBlock','sessionsList'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.textContent.trim() === 'Loading…') el.innerHTML = errMsg;
    });
    const logsEl = document.getElementById('liveLogs');
    if (logsEl && logsEl.textContent.trim() === 'Loading…') logsEl.innerHTML = '<span style="color:var(--danger)">Failed to load logs</span>';
    console.error(e);
  }
}

function startResetTimer(seconds) {
  if (_resetInterval) clearInterval(_resetInterval);
  let remaining = Math.round(seconds);
  const el = document.getElementById('resetTimer');
  function tick() {
    if (!el || remaining <= 0) { clearInterval(_resetInterval); if (el) el.textContent = 'Ready!'; return; }
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    el.textContent = `${m}:${String(s).padStart(2,'0')}`;
    remaining--;
  }
  tick();
  _resetInterval = setInterval(tick, 1000);
}

async function loadLogs() {
  try {
    const base = await getLocalApiBase();
    const url = base ? base + '/api/logs' : '/api/logs';
    const token = localStorage.getItem('mc_token') || '';
    const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await res.json();
    const el = document.getElementById('liveLogs');
    if (!el) return;
    if (!data.lines?.length) { el.innerHTML = '<span style="color:var(--text-muted)">No recent logs</span>'; return; }
    el.innerHTML = data.lines.map(l =>
      `<div style="color:${l.match(/error|ERROR/i)?'var(--danger)':l.match(/warn|WARN/i)?'var(--warning)':'var(--text-secondary)'}">${escHtml(l)}</div>`
    ).join('');
    el.scrollTop = el.scrollHeight;
  } catch {}
}

async function controlGateway(action) {
  const btn = document.getElementById(action==='start'?'btnStart':'btnStop');
  if (btn) { btn.disabled = true; }
  const outEl = document.getElementById('controlOutput');
  if (outEl) { outEl.style.display='block'; outEl.textContent='Running…'; }
  try {
    const base = await getLocalApiBase();
    const url = base ? base + '/api/openclaw/control' : '/api/openclaw/control';
    const token = localStorage.getItem('mc_token') || '';
    const res2 = await fetch(url, { method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    const data = await res2.json();
    if (outEl) outEl.textContent = data.output || (data.ok ? 'Done.' : data.error || 'Error');
    toast(data.ok ? 'Done' : (data.error || 'Error'), data.ok ? 'success' : 'error');
    setTimeout(() => loadAgentStatus(), 2000);
  } catch(e) {
    if (outEl) outEl.textContent = 'Error: ' + e.message;
    toast(e.message, 'error');
  }
  if (btn) btn.disabled = false;
}

function fmtNum(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M';
  if (n >= 1_000) return Math.round(n/1_000)+'k';
  return String(n);
}
// ─── LLM Info ─────────────────────────────────────────────────────────────────
async function loadLLMInfo() {
  try {
    const token = localStorage.getItem('mc_token') || '';
    const res = await fetch('/api/llm', { headers: { 'Authorization': 'Bearer ' + token } });
    if (res.status === 401) { localStorage.removeItem('mc_token'); window.location.replace('/login.html'); return; }
    const data = await res.json();
    const dot = document.getElementById('llmDot');
    const lbl = document.getElementById('llmLabel');
    if (!dot || !lbl) return;
    if (data.error) { dot.style.background = '#777'; lbl.textContent = `LLM: ${data.error}`; return; }
    const primary = data.primary || 'unknown';
    const fallbacks = (data.fallbacks || []).join(', ');
    const label = fallbacks ? `${primary} (fallbacks: ${fallbacks})` : primary;
    dot.style.background = '#4caf50'; // green
    lbl.textContent = `LLM: ${label}`;
  } catch(e) {
    const dot = document.getElementById('llmDot');
    const lbl = document.getElementById('llmLabel');
    if (dot) dot.style.background = '#777';
    if (lbl) lbl.textContent = 'LLM: error';
    console.error('loadLLMInfo error', e);
  }
}

