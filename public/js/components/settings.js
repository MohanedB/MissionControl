// ─── Settings Page ────────────────────────────────────────────────────────────
// All labels use t() — language switching works instantly.

let _s  = {};   // live settings cache
let _qc = {};   // queue control cache (enabled + intervalMs from server)

const ACCENTS = ['#58a6ff','#39d353','#f78166','#e3b341','#bc8cff','#ff7b72','#79c0ff','#a5d6ff'];
const PAGES   = ['dashboard','projects','chat','tasks','agent','notes','uploads'];

async function renderSettings() {
  [_s, _qc] = await Promise.all([
    API.settings.get(),
    API.queueControl.get().catch(() => ({ enabled: true, intervalMs: 30000 }))
  ]);

  return `
    <div style="max-width:680px;margin:0 auto">

      <div class="section-header mb-24">
        <div>
          <h2 class="section-title">${t('settings','title')}</h2>
          <div style="font-size:.8rem;color:var(--text-muted);margin-top:2px">${t('settings','sub')}</div>
        </div>
      </div>

      ${_settingsProfile()}
      ${_settingsAppearance()}
      ${_settingsNavigation()}
      ${_settingsLanguage()}
      ${_settingsPerformance()}
      ${_settingsChat()}
      ${_settingsQueueControl()}
      ${_settingsNotifications()}
      ${_settingsData()}
      ${_settingsAbout()}

    </div>

    <style>
      .settings-card {
        background:var(--bg-secondary);border:1px solid var(--border);
        border-radius:12px;padding:20px 24px;margin-bottom:16px;transition:border-color .2s;
      }
      .settings-card:hover { border-color:var(--text-muted); }
      .settings-card-header {
        display:flex;align-items:center;gap:14px;margin-bottom:20px;
        padding-bottom:16px;border-bottom:1px solid var(--border-muted);
      }
      .settings-icon {
        width:40px;height:40px;border-radius:10px;background:var(--accent-subtle);
        display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;
      }
      .settings-card-title { font-size:.95rem;font-weight:700;color:var(--text-primary); }
      .settings-card-sub   { font-size:.75rem;color:var(--text-muted);margin-top:1px; }
      .settings-row {
        display:flex;align-items:center;justify-content:space-between;
        gap:16px;padding:12px 0;border-bottom:1px solid var(--border-muted);
      }
      .settings-row:last-child { border-bottom:none;padding-bottom:0; }
      .settings-row-label { font-size:.85rem;font-weight:600;color:var(--text-primary); }
      .settings-row-sub   { font-size:.75rem;color:var(--text-muted);margin-top:2px;line-height:1.4; }
      .toggle-switch { position:relative;display:inline-block;width:46px;height:26px;flex-shrink:0; }
      .toggle-switch input { opacity:0;width:0;height:0; }
      .toggle-knob {
        position:absolute;cursor:pointer;inset:0;
        background:var(--border);border-radius:26px;transition:.25s;
      }
      .toggle-knob::before {
        content:'';position:absolute;width:20px;height:20px;border-radius:50%;
        left:3px;bottom:3px;background:#fff;transition:.25s;box-shadow:0 1px 3px rgba(0,0,0,.4);
      }
      .toggle-switch input:checked + .toggle-knob { background:var(--accent); }
      .toggle-switch input:checked + .toggle-knob::before { transform:translateX(20px); }
      .theme-btn {
        padding:6px 14px;border-radius:7px;font-size:.82rem;font-weight:500;
        cursor:pointer;border:1px solid var(--border);background:var(--bg-tertiary);
        color:var(--text-secondary);transition:.15s;
      }
      .theme-btn:hover, .theme-btn.active {
        border-color:var(--accent);color:var(--accent);background:var(--accent-subtle);
      }
      .mini-stat-card {
        background:var(--bg-tertiary);border:1px solid var(--border-muted);
        border-radius:8px;padding:12px;text-align:center;cursor:pointer;transition:.15s;
      }
      .mini-stat-card:hover { border-color:var(--accent); }
      .mini-stat-val   { font-size:1.5rem;font-weight:700;color:var(--accent); }
      .mini-stat-label { font-size:.72rem;color:var(--text-muted);margin-top:2px; }
    </style>
  `;
}

// ─── Sections ─────────────────────────────────────────────────────────────────
function _settingsProfile() {
  const initial = (_s.ownerName || '?')[0].toUpperCase();
  return `
    <div class="settings-card" id="sec-profile">
      <div class="settings-card-header">
        <div class="settings-icon">👤</div>
        <div>
          <div class="settings-card-title">${t('settings','profile')}</div>
          <div class="settings-card-sub">${t('settings','profileSub')}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
        <div id="avatarPreview" style="width:56px;height:56px;border-radius:50%;background:var(--accent-muted);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:700;color:#fff;flex-shrink:0">${initial}</div>
        <div style="flex:1">
          <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:4px">Initial from your name</div>
          <div style="font-size:.85rem;color:var(--text-secondary)">${_s.ownerName||'—'} <span style="color:var(--text-muted)">@${_s.ownerHandle||'—'}</span></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
        <div class="form-group" style="margin:0">
          <label class="form-label">${t('settings','name')}</label>
          <input class="form-input" id="s-name" value="${_s.ownerName||''}" placeholder="Shadow"
            oninput="document.getElementById('avatarPreview').textContent=(this.value[0]||'?').toUpperCase()">
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">${t('settings','handle')}</label>
          <input class="form-input" id="s-handle" value="${_s.ownerHandle||''}" placeholder="shadow9887">
        </div>
      </div>
      <button class="btn btn-primary" onclick="saveProfile()">${t('settings','saveProfile')}</button>
    </div>`;
}

function _settingsAppearance() {
  const curFont = _s.fontSize || 'default';
  return `
    <div class="settings-card">
      <div class="settings-card-header">
        <div class="settings-icon">🎨</div>
        <div>
          <div class="settings-card-title">${t('settings','appearance')}</div>
          <div class="settings-card-sub">${t('settings','appearanceSub')}</div>
        </div>
      </div>

      <!-- Theme -->
      <div class="settings-row">
        <div>
          <div class="settings-row-label">${t('settings','theme')}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button id="theme-dark"  class="theme-btn ${(_s.theme||'dark')==='dark'?'active':''}"  onclick="setTheme('dark')">${t('settings','dark')}</button>
          <button id="theme-light" class="theme-btn ${_s.theme==='light'?'active':''}" onclick="setTheme('light')">${t('settings','light')}</button>
        </div>
      </div>

      <!-- Accent -->
      <div class="settings-row" style="align-items:flex-start">
        <div>
          <div class="settings-row-label">${t('settings','accent')}</div>
          <div class="settings-row-sub">${t('settings','accentSub')}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px">
          <div style="display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end">
            ${ACCENTS.map(c => `
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

      <!-- Font size -->
      <div class="settings-row">
        <div>
          <div class="settings-row-label">${t('settings','fontSize')}</div>
        </div>
        <div style="display:flex;gap:8px">
          ${['small','default','large'].map(sz => `
            <button id="font-${sz}" class="theme-btn ${curFont===sz?'active':''}" onclick="setFontSize('${sz}')">
              ${t('settings','font'+sz.charAt(0).toUpperCase()+sz.slice(1))}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Compact -->
      <div class="settings-row">
        <div>
          <div class="settings-row-label">${t('settings','compact')}</div>
          <div class="settings-row-sub">${t('settings','compactSub')}</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="s-compact" ${_s.compactMode?'checked':''}
            onchange="autoSave('compactMode', this.checked); document.body.classList.toggle('compact', this.checked)">
          <span class="toggle-knob"></span>
        </label>
      </div>
    </div>`;
}

function _settingsNavigation() {
  return `
    <div class="settings-card">
      <div class="settings-card-header">
        <div class="settings-icon">🧭</div>
        <div>
          <div class="settings-card-title">Navigation</div>
          <div class="settings-card-sub">${t('settings','defaultPageSub')}</div>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">${t('settings','defaultPage')}</div>
          <div class="settings-row-sub">${t('settings','defaultPageSub')}</div>
        </div>
        <select class="form-select" style="width:160px" id="s-defaultPage"
          onchange="autoSave('defaultPage', this.value)">
          ${PAGES.map(p => `<option value="${p}" ${_s.defaultPage===p?'selected':''}>${p.charAt(0).toUpperCase()+p.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">${t('settings','sidebarCollapsed')}</div>
          <div class="settings-row-sub">${t('settings','sidebarCollapsedSub')}</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="s-sidebarCollapsed" ${_s.sidebarCollapsed?'checked':''}
            onchange="autoSave('sidebarCollapsed', this.checked)">
          <span class="toggle-knob"></span>
        </label>
      </div>
    </div>`;
}

function _settingsLanguage() {
  return `
    <div class="settings-card">
      <div class="settings-card-header">
        <div class="settings-icon">🌐</div>
        <div>
          <div class="settings-card-title">${t('settings','language')}</div>
          <div class="settings-card-sub">${t('settings','langSub')}</div>
        </div>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label">${t('settings','language')}</div></div>
        <div style="display:flex;gap:8px">
          <button id="lang-en" class="theme-btn ${(_s.language||'en')==='en'?'active':''}" onclick="changeLang('en')">🇬🇧 EN</button>
          <button id="lang-fr" class="theme-btn ${_s.language==='fr'?'active':''}"           onclick="changeLang('fr')">🇫🇷 FR</button>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">${t('settings','dateFormat')}</div>
          <div class="settings-row-sub">${t('settings','dateRelativeSub')} · ${t('settings','dateAbsoluteSub')}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button id="datefmt-relative" class="theme-btn ${(_s.dateFormat||'relative')==='relative'?'active':''}" onclick="setDateFmt('relative')">${t('settings','dateRelative')}</button>
          <button id="datefmt-absolute" class="theme-btn ${_s.dateFormat==='absolute'?'active':''}"               onclick="setDateFmt('absolute')">${t('settings','dateAbsolute')}</button>
        </div>
      </div>
    </div>`;
}

function _settingsPerformance() {
  const enabled = _s.autoRefresh !== false;
  return `
    <div class="settings-card">
      <div class="settings-card-header">
        <div class="settings-icon">⚡</div>
        <div>
          <div class="settings-card-title">${t('settings','autoRefresh')}</div>
          <div class="settings-card-sub">${t('settings','autoRefreshSub')}</div>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">${t('settings','autoRefresh')}</div>
          <div class="settings-row-sub">${t('settings','autoRefreshSub')}</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="s-autoRefresh" ${enabled?'checked':''}
            onchange="autoSave('autoRefresh', this.checked); toggleIntervalRow(this.checked)">
          <span class="toggle-knob"></span>
        </label>
      </div>
      <div class="settings-row" id="intervalRow" style="${!enabled?'opacity:.4;pointer-events:none':''}">
        <div>
          <div class="settings-row-label">${t('settings','refreshInterval')}</div>
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
    </div>`;
}

function _settingsChat() {
  return `
    <div class="settings-card">
      <div class="settings-card-header">
        <div class="settings-icon">💬</div>
        <div>
          <div class="settings-card-title">${t('settings','chat')}</div>
          <div class="settings-card-sub">${t('settings','chatSub')}</div>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">${t('settings','chatUpload')}</div>
          <div class="settings-row-sub">${t('settings','chatUploadSub')}</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="s-chatUpload" ${_s.chatUploadEnabled!==false?'checked':''}
            onchange="autoSave('chatUploadEnabled', this.checked)">
          <span class="toggle-knob"></span>
        </label>
      </div>
      <div class="settings-row" style="align-items:flex-start;padding-top:16px;border-top:1px solid var(--border-muted)">
        <div>
          <div class="settings-row-label">${t('settings','tokenBudget')}</div>
          <div class="settings-row-sub">${t('settings','tokenBudgetSub')}</div>
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
    </div>`;
}

function _settingsQueueControl() {
  const qEnabled   = _qc.enabled !== false;
  const qIntervalS = Math.round((_qc.intervalMs || 30000) / 1000);
  return `
    <div class="settings-card">
      <div class="settings-card-header">
        <div class="settings-icon">🤖</div>
        <div>
          <div class="settings-card-title">${t('settings','queueControl')}</div>
          <div class="settings-card-sub">${t('settings','queueControlSub')}</div>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">${t('settings','queueEnabled')}</div>
          <div class="settings-row-sub">${t('settings','queueEnabledSub')}</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="s-queueEnabled" ${qEnabled?'checked':''}
            onchange="setQueueEnabled(this.checked)">
          <span class="toggle-knob"></span>
        </label>
      </div>
      <div class="settings-row" id="qIntervalRow" style="${!qEnabled?'opacity:.4;pointer-events:none':''}">
        <div>
          <div class="settings-row-label">${t('settings','queueInterval')}</div>
          <div class="settings-row-sub">${t('settings','queueIntervalSub')}</div>
        </div>
        <div style="display:flex;gap:8px">
          ${[15,30,60,120].map(s => `
            <button id="qi-${s}" class="theme-btn ${qIntervalS===s?'active':''}" onclick="setQueueInterval(${s})">${s}s</button>
          `).join('')}
        </div>
      </div>
    </div>`;
}

function _settingsNotifications() {
  const notifEnabled = _s.notificationsEnabled === true;
  const perm = (typeof Notification !== 'undefined') ? Notification.permission : 'denied';
  return `
    <div class="settings-card">
      <div class="settings-card-header">
        <div class="settings-icon">🔔</div>
        <div>
          <div class="settings-card-title">${t('settings','notifications')}</div>
          <div class="settings-card-sub">${t('settings','notificationsSub')}</div>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">${t('settings','notifyTask')}</div>
          <div class="settings-row-sub">${t('settings','notifyTaskSub')}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          ${perm === 'default' ? `<button class="theme-btn" onclick="requestNotifPermission()">${t('settings','notifyGrant')}</button>` : ''}
          ${perm === 'denied'  ? `<span style="font-size:.75rem;color:var(--text-muted)">Blocked in browser</span>` : ''}
          <label class="toggle-switch" ${perm==='denied'?'style="opacity:.4;pointer-events:none"':''}>
            <input type="checkbox" id="s-notifications" ${notifEnabled&&perm==='granted'?'checked':''}
              onchange="autoSave('notificationsEnabled', this.checked)">
            <span class="toggle-knob"></span>
          </label>
        </div>
      </div>
    </div>`;
}

function _settingsData() {
  return `
    <div class="settings-card">
      <div class="settings-card-header">
        <div class="settings-icon">🗄️</div>
        <div>
          <div class="settings-card-title">${t('settings','data')}</div>
          <div class="settings-card-sub">${t('settings','dataSub')}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px" id="dataStats">
        <div class="mini-stat-card" onclick="Router.go('projects')">
          <div class="mini-stat-val" id="stat-projects">—</div>
          <div class="mini-stat-label">${t('common','active')}</div>
        </div>
        <div class="mini-stat-card" onclick="Router.go('tasks')">
          <div class="mini-stat-val" id="stat-tasks">—</div>
          <div class="mini-stat-label">Tasks</div>
        </div>
        <div class="mini-stat-card" onclick="Router.go('notes')">
          <div class="mini-stat-val" id="stat-notes">—</div>
          <div class="mini-stat-label">Notes</div>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">${t('settings','exportSettings')}</div>
          <div class="settings-row-sub">${t('settings','exportSub')}</div>
        </div>
        <button class="btn btn-secondary" onclick="exportSettings()">⬇ Export</button>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">${t('settings','importSettings')}</div>
          <div class="settings-row-sub">${t('settings','importSub')}</div>
        </div>
        <button class="btn btn-secondary" onclick="document.getElementById('importFileInput').click()">⬆ Import</button>
      </div>
      <input type="file" id="importFileInput" accept=".json" style="display:none" onchange="importSettings(this)">
    </div>`;
}

function _settingsAbout() {
  return `
    <div class="settings-card" style="margin-bottom:40px">
      <div class="settings-card-header">
        <div class="settings-icon">🚀</div>
        <div>
          <div class="settings-card-title">${t('settings','about')}</div>
          <div class="settings-card-sub">${t('settings','version')} · ${t('settings','builtBy')}</div>
        </div>
      </div>
      <div style="font-size:.82rem;color:var(--text-muted);line-height:2">
        <div>${t('settings','stack')}</div>
        <div>${t('settings','hosting')}</div>
        <div style="margin-top:8px;padding:10px 12px;background:var(--bg-tertiary);border-radius:6px;font-family:monospace;font-size:.78rem;color:var(--success)">
          ${t('settings','connected')}
        </div>
      </div>
    </div>`;
}

// ─── Auto-save single setting ─────────────────────────────────────────────────
async function autoSave(key, value) {
  try {
    await API.settings.update({ [key]: value });
    _s[key] = value;
    showSavedPulse();
  } catch(e) { toast(t('common','error') + ': ' + e.message, 'error'); }
}

function showSavedPulse() {
  let el = document.getElementById('savedPulse');
  if (!el) {
    el = document.createElement('div');
    el.id = 'savedPulse';
    el.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--success);color:#fff;padding:8px 16px;border-radius:8px;font-size:.82rem;font-weight:600;z-index:9999;opacity:0;transition:opacity .2s;pointer-events:none';
    document.body.appendChild(el);
  }
  el.textContent = t('settings','saved');
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.opacity = '0', 1400);
}

// ─── Profile ──────────────────────────────────────────────────────────────────
async function saveProfile() {
  const name   = document.getElementById('s-name').value.trim();
  const handle = document.getElementById('s-handle').value.trim();
  await API.settings.update({ ownerName: name, ownerHandle: handle });
  const subtitle = document.getElementById('pageSubtitle');
  if (subtitle) subtitle.textContent = `${t('dashboard','subtitle')}, ${name}`;
  toast(t('settings','saveProfile') + ' ✓', 'success');
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
  document.querySelectorAll('[id^="accentBtn-"]').forEach(b => b.style.borderColor = 'transparent');
  const swatch = document.getElementById('accentBtn-' + color.replace('#',''));
  if (swatch) swatch.style.borderColor = '#fff';
  await autoSave('accentColor', color);
}

// ─── Font size ────────────────────────────────────────────────────────────────
const FONT_SCALES = { small: '0.9', default: '1', large: '1.1' };
async function setFontSize(sz) {
  document.documentElement.style.setProperty('--font-scale', FONT_SCALES[sz] || '1');
  document.querySelectorAll('[id^="font-"]').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('font-' + sz);
  if (btn) btn.classList.add('active');
  await autoSave('fontSize', sz);
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

// ─── Queue control ────────────────────────────────────────────────────────────
async function setQueueEnabled(enabled) {
  try {
    _qc = await API.queueControl.set({ enabled });
    const row = document.getElementById('qIntervalRow');
    if (row) { row.style.opacity = enabled ? '1' : '.4'; row.style.pointerEvents = enabled ? '' : 'none'; }
    showSavedPulse();
  } catch(e) { toast(t('common','error') + ': ' + e.message, 'error'); }
}

async function setQueueInterval(seconds) {
  try {
    _qc = await API.queueControl.set({ intervalMs: seconds * 1000 });
    document.querySelectorAll('[id^="qi-"]').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('qi-' + seconds);
    if (btn) btn.classList.add('active');
    showSavedPulse();
  } catch(e) { toast(t('common','error') + ': ' + e.message, 'error'); }
}

// ─── Notifications ────────────────────────────────────────────────────────────
async function requestNotifPermission() {
  if (typeof Notification === 'undefined') return;
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    await autoSave('notificationsEnabled', true);
    // Re-render notifications section
    const card = document.querySelector('[id^="sec-notifications"], .settings-card:nth-of-type(9)');
    location.reload();
  }
}

// Helper: send a browser notification (called from queue component when task done)
function notifyTaskDone(title) {
  if (!_s.notificationsEnabled) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  new Notification('OpenClaw', { body: `Task done: ${title}`, icon: '/favicon.ico' });
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

// ─── Import settings ─────────────────────────────────────────────────────────
async function importSettings(input) {
  const file = input.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    // Strip server-only fields
    const { id, user_id, created_at, updated_at, ...rest } = data;
    await API.settings.update(rest);
    toast(t('settings','saved') + ' — ' + t('settings','importSettings'), 'success');
    setTimeout(() => location.reload(), 800);
  } catch(e) {
    toast(t('common','error') + ': ' + e.message, 'error');
  }
  input.value = '';
}

// ─── Load stats ───────────────────────────────────────────────────────────────
async function loadSettingsStats() {
  try {
    const stats = await API.stats();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-projects', stats.projects ?? '—');
    set('stat-tasks',    (stats.tasks ?? 0) + (stats.queueItems ?? 0));
    set('stat-notes',    stats.notes ?? '—');
  } catch {}
}

// ─── Apply font scale on startup ─────────────────────────────────────────────
function applyFontScale(sz) {
  document.documentElement.style.setProperty('--font-scale', FONT_SCALES[sz] || '1');
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
