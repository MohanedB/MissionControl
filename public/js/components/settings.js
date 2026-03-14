// ─── Settings Page ────────────────────────────────────────────────────────────
// Auto-saves toggles/selects instantly. Profile requires explicit save.

let _s = {};  // live settings cache for this page

async function renderSettings() {
  _s = await API.settings.get();
  const pages = ['dashboard','projects','chat','tasks','agent','notes','uploads'];
  const accents = ['#58a6ff','#39d353','#f78166','#e3b341','#bc8cff','#ff7b72','#79c0ff','#a5d6ff'];

  return `
    <div style="max-width:680px;margin:0 auto">

      <!-- Page Title -->
      <div class="section-header mb-24">
        <div>
          <h2 class="section-title">Settings</h2>
          <div style="font-size:.8rem;color:var(--text-muted);margin-top:2px">Tout est sauvegardé sur Supabase — sync sur tous tes appareils</div>
        </div>
      </div>

      <!-- ── PROFILE ─────────────────────────────────────────────────────── -->
      <div class="settings-card" id="sec-profile">
        <div class="settings-card-header">
          <div class="settings-icon">👤</div>
          <div>
            <div class="settings-card-title">Profil</div>
            <div class="settings-card-sub">Nom affiché dans le dashboard</div>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
          <div id="avatarPreview" style="width:56px;height:56px;border-radius:50%;background:var(--accent-muted);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:700;color:#fff;flex-shrink:0">
            ${(_s.ownerName||'?')[0].toUpperCase()}
          </div>
          <div style="flex:1">
            <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:4px">Initiale calculée depuis ton nom</div>
            <div style="font-size:.85rem;color:var(--text-secondary)">${_s.ownerName || '—'} <span style="color:var(--text-muted)">@${_s.ownerHandle || '—'}</span></div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
          <div class="form-group" style="margin:0">
            <label class="form-label">Nom</label>
            <input class="form-input" id="s-name" value="${_s.ownerName||''}" placeholder="Shadow"
              oninput="document.getElementById('avatarPreview').textContent=(this.value[0]||'?').toUpperCase()">
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label">Handle GitHub</label>
            <input class="form-input" id="s-handle" value="${_s.ownerHandle||''}" placeholder="shadow9887">
          </div>
        </div>
        <button class="btn btn-primary" onclick="saveProfile()">Sauvegarder le profil</button>
      </div>

      <!-- ── APPARENCE ───────────────────────────────────────────────────── -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon">🎨</div>
          <div>
            <div class="settings-card-title">Apparence</div>
            <div class="settings-card-sub">Thème, couleur d'accent, densité</div>
          </div>
        </div>

        <!-- Theme toggle -->
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Thème</div>
            <div class="settings-row-sub">Dark ou light mode</div>
          </div>
          <div style="display:flex;gap:8px">
            <button id="theme-dark"  class="theme-btn ${(_s.theme||'dark')==='dark'?'active':''}"  onclick="setTheme('dark')">🌙 Dark</button>
            <button id="theme-light" class="theme-btn ${_s.theme==='light'?'active':''}" onclick="setTheme('light')">☀️ Light</button>
          </div>
        </div>

        <!-- Accent color -->
        <div class="settings-row" style="align-items:flex-start">
          <div>
            <div class="settings-row-label">Couleur d'accent</div>
            <div class="settings-row-sub">Appliquée instantanément</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px">
            <div style="display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end">
              ${accents.map(c => `
                <button onclick="pickAccent('${c}')" title="${c}"
                  style="width:28px;height:28px;border-radius:50%;background:${c};border:2px solid ${c===(_s.accentColor||'#58a6ff')?'#fff':'transparent'};cursor:pointer;transition:.15s;flex-shrink:0"
                  id="accentBtn-${c.replace('#','')}"></button>
              `).join('')}
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <input type="color" id="s-accent" value="${_s.accentColor||'#58a6ff'}"
                style="width:32px;height:32px;border:none;background:none;cursor:pointer;border-radius:6px;padding:0"
                oninput="pickAccent(this.value)">
              <span style="font-size:.75rem;color:var(--text-muted)" id="accentHex">${_s.accentColor||'#58a6ff'}</span>
            </div>
          </div>
        </div>

        <!-- Compact mode -->
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Mode compact</div>
            <div class="settings-row-sub">Réduit le padding et la taille du texte</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="s-compact" ${_s.compactMode?'checked':''}
              onchange="autoSave('compactMode', this.checked); document.body.classList.toggle('compact', this.checked)">
            <span class="toggle-knob"></span>
          </label>
        </div>
      </div>

      <!-- ── NAVIGATION ──────────────────────────────────────────────────── -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon">🧭</div>
          <div>
            <div class="settings-card-title">Navigation</div>
            <div class="settings-card-sub">Page de démarrage et sidebar</div>
          </div>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-row-label">Page par défaut</div>
            <div class="settings-row-sub">Ouverte au lancement</div>
          </div>
          <select class="form-select" style="width:160px" id="s-defaultPage"
            onchange="autoSave('defaultPage', this.value)">
            ${pages.map(p => `<option value="${p}" ${_s.defaultPage===p?'selected':''}>${p.charAt(0).toUpperCase()+p.slice(1)}</option>`).join('')}
          </select>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-row-label">Sidebar fermée au démarrage</div>
            <div class="settings-row-sub">Tu peux toujours l'ouvrir manuellement</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="s-sidebarCollapsed" ${_s.sidebarCollapsed?'checked':''}
              onchange="autoSave('sidebarCollapsed', this.checked)">
            <span class="toggle-knob"></span>
          </label>
        </div>
      </div>

      <!-- ── LANGUE & FORMAT ─────────────────────────────────────────────── -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon">🌐</div>
          <div>
            <div class="settings-card-title">Langue & Format</div>
            <div class="settings-card-sub">Interface et affichage des dates</div>
          </div>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-row-label">Langue de l'interface</div>
          </div>
          <div style="display:flex;gap:8px">
            <button id="lang-en" class="theme-btn ${(_s.language||'en')==='en'?'active':''}" onclick="changeLang('en')">🇬🇧 EN</button>
            <button id="lang-fr" class="theme-btn ${_s.language==='fr'?'active':''}"           onclick="changeLang('fr')">🇫🇷 FR</button>
          </div>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-row-label">Format des dates</div>
            <div class="settings-row-sub">Relatif = "il y a 2h" · Absolu = "12 mars 2025"</div>
          </div>
          <div style="display:flex;gap:8px">
            <button id="datefmt-relative" class="theme-btn ${(_s.dateFormat||'relative')==='relative'?'active':''}" onclick="setDateFmt('relative')">Relatif</button>
            <button id="datefmt-absolute" class="theme-btn ${_s.dateFormat==='absolute'?'active':''}"               onclick="setDateFmt('absolute')">Absolu</button>
          </div>
        </div>
      </div>

      <!-- ── PERFORMANCE ─────────────────────────────────────────────────── -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon">⚡</div>
          <div>
            <div class="settings-card-title">Performance</div>
            <div class="settings-card-sub">Auto-refresh des données</div>
          </div>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-row-label">Auto-refresh</div>
            <div class="settings-row-sub">Recharge les données automatiquement</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="s-autoRefresh" ${_s.autoRefresh!==false?'checked':''}
              onchange="autoSave('autoRefresh', this.checked); toggleIntervalRow(this.checked)">
            <span class="toggle-knob"></span>
          </label>
        </div>

        <div class="settings-row" id="intervalRow" style="${_s.autoRefresh===false?'opacity:.4;pointer-events:none':''}">
          <div>
            <div class="settings-row-label">Intervalle</div>
            <div class="settings-row-sub">Fréquence de rafraîchissement</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <input type="range" id="s-interval" min="10" max="120" step="10"
              value="${_s.autoRefreshInterval||30}"
              style="width:120px;accent-color:var(--accent)"
              oninput="document.getElementById('intervalVal').textContent=this.value+'s'"
              onchange="autoSave('autoRefreshInterval', parseInt(this.value))">
            <span id="intervalVal" style="font-size:.85rem;color:var(--accent);width:36px;text-align:right">${_s.autoRefreshInterval||30}s</span>
          </div>
        </div>
      </div>

      <!-- ── CHAT ────────────────────────────────────────────────────────── -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon">💬</div>
          <div>
            <div class="settings-card-title">Chat & Agent</div>
            <div class="settings-card-sub">Options du chat AI et budget tokens</div>
          </div>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-row-label">Upload de fichiers dans le chat</div>
            <div class="settings-row-sub">Permet d'envoyer des images et PDFs</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="s-chatUpload" ${_s.chatUploadEnabled!==false?'checked':''}
              onchange="autoSave('chatUploadEnabled', this.checked)">
            <span class="toggle-knob"></span>
          </label>
        </div>

        <!-- Token Budget -->
        <div class="settings-row" style="align-items:flex-start;padding-top:16px;border-top:1px solid var(--border-muted)">
          <div>
            <div class="settings-row-label">🔋 Budget tokens / jour</div>
            <div class="settings-row-sub">Utilisé pour calculer le % dans Agent Status.<br>Ajuste selon ton plan Anthropic.</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
            <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
              ${[100000,250000,500000,1000000].map(v => `
                <button onclick="document.getElementById('s-budget').value='${v}';autoSave('dailyTokenBudget',${v})"
                  style="background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.75rem;color:var(--text-secondary);transition:.12s"
                  onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)'">${fmtNum2(v)}</button>
              `).join('')}
            </div>
            <input class="form-input" id="s-budget" type="number" value="${_s.dailyTokenBudget||500000}"
              style="max-width:140px;text-align:right"
              onchange="autoSave('dailyTokenBudget', parseInt(this.value)||500000)">
            <div style="font-size:.72rem;color:var(--text-muted);text-align:right">Sonnet: ~40k tokens/min</div>
          </div>
        </div>
      </div>

      <!-- ── DONNÉES ─────────────────────────────────────────────────────── -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon">🗄️</div>
          <div>
            <div class="settings-card-title">Données</div>
            <div class="settings-card-sub">Supabase · Tout est synchronisé en cloud</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px" id="dataStats">
          <div class="mini-stat-card" onclick="Router.go('projects')">
            <div class="mini-stat-val" id="stat-projects">—</div>
            <div class="mini-stat-label">Projets</div>
          </div>
          <div class="mini-stat-card" onclick="Router.go('tasks')">
            <div class="mini-stat-val" id="stat-tasks">—</div>
            <div class="mini-stat-label">Tâches</div>
          </div>
          <div class="mini-stat-card" onclick="Router.go('notes')">
            <div class="mini-stat-val" id="stat-notes">—</div>
            <div class="mini-stat-label">Notes</div>
          </div>
        </div>

        <div class="settings-row" style="border-top:1px solid var(--border-muted);padding-top:16px">
          <div>
            <div class="settings-row-label">Exporter les settings</div>
            <div class="settings-row-sub">JSON téléchargeable — backup de ta config</div>
          </div>
          <button class="btn btn-secondary" onclick="exportSettings()">⬇ Export</button>
        </div>
      </div>

      <!-- ── ABOUT ───────────────────────────────────────────────────────── -->
      <div class="settings-card" style="margin-bottom:40px">
        <div class="settings-card-header">
          <div class="settings-icon">🚀</div>
          <div>
            <div class="settings-card-title">Mission Control</div>
            <div class="settings-card-sub">v2.0 · Built by Shadow</div>
          </div>
        </div>
        <div style="font-size:.82rem;color:var(--text-muted);line-height:2">
          <div>Stack: Node.js · Express · Supabase · Vanilla JS</div>
          <div>Hébergement: Vercel (cloud) + local (Node)</div>
          <div style="margin-top:8px;padding:10px 12px;background:var(--bg-tertiary);border-radius:6px;font-family:monospace;font-size:.78rem;color:var(--success)">
            ● Connecté à Supabase — settings synced
          </div>
        </div>
      </div>

    </div>

    <!-- Inline styles for settings components -->
    <style>
      .settings-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 20px 24px;
        margin-bottom: 16px;
        transition: border-color .2s;
      }
      .settings-card:hover { border-color: var(--text-muted); }

      .settings-card-header {
        display: flex; align-items: center; gap: 14px;
        margin-bottom: 20px; padding-bottom: 16px;
        border-bottom: 1px solid var(--border-muted);
      }
      .settings-icon {
        width: 40px; height: 40px; border-radius: 10px;
        background: var(--accent-subtle); display: flex;
        align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;
      }
      .settings-card-title { font-size: .95rem; font-weight: 700; color: var(--text-primary); }
      .settings-card-sub   { font-size: .75rem; color: var(--text-muted); margin-top: 1px; }

      .settings-row {
        display: flex; align-items: center; justify-content: space-between;
        gap: 16px; padding: 12px 0;
        border-bottom: 1px solid var(--border-muted);
      }
      .settings-row:last-child { border-bottom: none; padding-bottom: 0; }
      .settings-row-label { font-size: .85rem; font-weight: 600; color: var(--text-primary); }
      .settings-row-sub   { font-size: .75rem; color: var(--text-muted); margin-top: 2px; line-height: 1.4; }

      /* Toggle switch */
      .toggle-switch { position: relative; display: inline-block; width: 46px; height: 26px; flex-shrink: 0; }
      .toggle-switch input { opacity: 0; width: 0; height: 0; }
      .toggle-knob {
        position: absolute; cursor: pointer; inset: 0;
        background: var(--border); border-radius: 26px; transition: .25s;
      }
      .toggle-knob::before {
        content: ''; position: absolute;
        width: 20px; height: 20px; border-radius: 50%;
        left: 3px; bottom: 3px; background: #fff;
        transition: .25s; box-shadow: 0 1px 3px rgba(0,0,0,.4);
      }
      .toggle-switch input:checked + .toggle-knob { background: var(--accent); }
      .toggle-switch input:checked + .toggle-knob::before { transform: translateX(20px); }

      /* Theme / lang buttons */
      .theme-btn {
        padding: 6px 14px; border-radius: 7px; font-size: .82rem; font-weight: 500;
        cursor: pointer; border: 1px solid var(--border); background: var(--bg-tertiary);
        color: var(--text-secondary); transition: .15s;
      }
      .theme-btn:hover, .theme-btn.active {
        border-color: var(--accent); color: var(--accent); background: var(--accent-subtle);
      }

      /* Mini stat cards */
      .mini-stat-card {
        background: var(--bg-tertiary); border: 1px solid var(--border-muted);
        border-radius: 8px; padding: 12px; text-align: center; cursor: pointer; transition: .15s;
      }
      .mini-stat-card:hover { border-color: var(--accent); }
      .mini-stat-val   { font-size: 1.5rem; font-weight: 700; color: var(--accent); }
      .mini-stat-label { font-size: .72rem; color: var(--text-muted); margin-top: 2px; }
    </style>
  `;
}

// ─── Auto-save single setting ─────────────────────────────────────────────────
async function autoSave(key, value) {
  try {
    await API.settings.update({ [key]: value });
    _s[key] = value;
    showSavedPulse();
  } catch(e) { toast('Erreur sauvegarde : ' + e.message, 'error'); }
}

function showSavedPulse() {
  let el = document.getElementById('savedPulse');
  if (!el) {
    el = document.createElement('div');
    el.id = 'savedPulse';
    el.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--success);color:#fff;padding:8px 16px;border-radius:8px;font-size:.82rem;font-weight:600;z-index:9999;opacity:0;transition:opacity .2s;pointer-events:none';
    el.textContent = '✓ Sauvegardé';
    document.body.appendChild(el);
  }
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.opacity = '0', 1400);
}

// ─── Profile save ─────────────────────────────────────────────────────────────
async function saveProfile() {
  const name   = document.getElementById('s-name').value.trim();
  const handle = document.getElementById('s-handle').value.trim();
  await API.settings.update({ ownerName: name, ownerHandle: handle });
  // Update sidebar subtitle live
  const subtitle = document.getElementById('pageSubtitle');
  if (subtitle) subtitle.textContent = `Welcome back, ${name}`;
  toast('Profil sauvegardé ✓', 'success');
}

// ─── Theme ────────────────────────────────────────────────────────────────────
async function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn[id^="theme-"]').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('theme-' + theme);
  if (btn) btn.classList.add('active');
  await autoSave('theme', theme);
}

// ─── Accent ───────────────────────────────────────────────────────────────────
async function pickAccent(color) {
  document.documentElement.style.setProperty('--accent', color);
  document.getElementById('s-accent').value = color;
  document.getElementById('accentHex').textContent = color;
  // Update ring on swatches
  document.querySelectorAll('[id^="accentBtn-"]').forEach(b => b.style.borderColor = 'transparent');
  const swatch = document.getElementById('accentBtn-' + color.replace('#',''));
  if (swatch) swatch.style.borderColor = '#fff';
  await autoSave('accentColor', color);
}

// ─── Date format ──────────────────────────────────────────────────────────────
async function setDateFmt(fmt) {
  window._dateFormat = fmt;
  document.querySelectorAll('[id^="datefmt-"]').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('datefmt-' + fmt);
  if (btn) btn.classList.add('active');
  await autoSave('dateFormat', fmt);
}

// ─── Language ─────────────────────────────────────────────────────────────────
async function changeLang(lang) {
  _lang = lang;
  setLang(lang);
  await API.settings.update({ language: lang });
  location.reload();
}
// ─── Interval row dim ────────────────────────────────────────────────────────
function toggleIntervalRow(enabled) {
  const row = document.getElementById('intervalRow');
  if (row) { row.style.opacity = enabled ? '1' : '.4'; row.style.pointerEvents = enabled ? '' : 'none'; }
}

// ─── Export settings ─────────────────────────────────────────────────────────
async function exportSettings() {
  const s = await API.settings.get();
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mission-control-settings.json'; a.click();
  URL.revokeObjectURL(url);
}

// ─── Load stats into data section ────────────────────────────────────────────
async function loadSettingsStats() {
  try {
    const stats = await API.stats();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-projects', stats.projects ?? '—');
    set('stat-tasks',    (stats.tasks ?? 0) + (stats.queueItems ?? 0));
    set('stat-notes',    stats.notes ?? '—');
  } catch {}
}

// Hook: called after renderSettings HTML is injected
function afterRenderSettings() {
  loadSettingsStats();
}

function fmtNum2(n) {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n/1_000).toFixed(0) + 'k';
  return String(n);
}