async function renderSettings() {
  const s = await API.settings.get();
  const pages = ['dashboard','projects','chat','tasks','agent','notes','uploads'];

  return `
    <div class="section-header mb-24">
      <h2 class="section-title">${t('settings','title')}</h2>
    </div>

    <!-- Profile -->
    <div class="card mb-20">
      <div class="card-header">
        <div>
          <span class="card-title">${t('settings','profile')}</span>
          <div style="font-size:.76rem;color:var(--text-muted);margin-top:2px">${t('settings','profileSub')}</div>
        </div>
      </div>
      <div class="form-group"><label class="form-label">${t('settings','name')}</label><input class="form-input" id="s-name" value="${s.ownerName||''}"></div>
      <div class="form-group"><label class="form-label">${t('settings','handle')}</label><input class="form-input" id="s-handle" value="${s.ownerHandle||''}"></div>
    </div>

    <!-- Appearance -->
    <div class="card mb-20">
      <div class="card-header">
        <div>
          <span class="card-title">${t('settings','appearance')}</span>
          <div style="font-size:.76rem;color:var(--text-muted);margin-top:2px">${t('settings','appearanceSub')}</div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">${t('settings','theme')}</label>
        <div style="display:flex;gap:10px;margin-top:6px">
          <button class="btn ${s.theme!=='light'?'btn-primary':'btn-secondary'}" onclick="setTheme('dark')">${t('settings','dark')}</button>
          <button class="btn ${s.theme==='light'?'btn-primary':'btn-secondary'}" onclick="setTheme('light')">${t('settings','light')}</button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">${t('settings','accent')}</label>
        <div style="display:flex;align-items:center;gap:12px;margin-top:6px;flex-wrap:wrap">
          <input type="color" id="s-accent" value="${s.accentColor||'#58a6ff'}" style="width:44px;height:44px;border:none;background:none;cursor:pointer;border-radius:8px">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${['#58a6ff','#39d353','#f78166','#e3b341','#bc8cff','#ff7b72','#79c0ff','#56d364'].map(c =>
              `<button onclick="document.getElementById('s-accent').value='${c}';document.documentElement.style.setProperty('--accent','${c}')"
                style="width:26px;height:26px;border-radius:50%;background:${c};border:2px solid ${c===s.accentColor?'#fff':'transparent'};cursor:pointer;transition:.15s"></button>`
            ).join('')}
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">${t('settings','compact')}</label>
        <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:8px">${t('settings','compactSub')}</div>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
          <input type="checkbox" id="s-compact" ${s.compactMode?'checked':''} style="width:16px;height:16px;cursor:pointer">
          <span style="font-size:.85rem">${t('settings','compact')}</span>
        </label>
      </div>
    </div>

    <!-- Language & Locale -->
    <div class="card mb-20">
      <div class="card-header">
        <div>
          <span class="card-title">${t('settings','language')}</span>
          <div style="font-size:.76rem;color:var(--text-muted);margin-top:2px">${t('settings','langSub')}</div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">${t('settings','language')}</label>
        <div style="display:flex;gap:10px;margin-top:6px">
          <button class="btn ${(s.language||'en')==='en'?'btn-primary':'btn-secondary'}" onclick="changeLang('en')">🇬🇧 English</button>
          <button class="btn ${s.language==='fr'?'btn-primary':'btn-secondary'}" onclick="changeLang('fr')">🇫🇷 Français</button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">${t('settings','dateFormat')}</label>
        <div style="display:flex;gap:10px;margin-top:6px;flex-wrap:wrap">
          <button class="btn ${(s.dateFormat||'relative')==='relative'?'btn-primary':'btn-secondary'}" onclick="setDateFmt('relative')">${t('settings','dateRelative')}</button>
          <button class="btn ${s.dateFormat==='absolute'?'btn-primary':'btn-secondary'}" onclick="setDateFmt('absolute')">${t('settings','dateAbsolute')}</button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">${t('settings','defaultPage')}</label>
        <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:8px">${t('settings','defaultPageSub')}</div>
        <select class="form-select" id="s-defaultPage">
          ${pages.map(p => `<option value="${p}" ${s.defaultPage===p?'selected':''}>${t('nav',p)||p}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- Refresh & Performance -->
    <div class="card mb-20">
      <div class="card-header">
        <div>
          <span class="card-title">${t('settings','autoRefresh')}</span>
          <div style="font-size:.76rem;color:var(--text-muted);margin-top:2px">${t('settings','autoRefreshSub')}</div>
        </div>
      </div>

      <div class="form-group">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:12px">
          <input type="checkbox" id="s-autoRefresh" ${s.autoRefresh!==false?'checked':''} style="width:16px;height:16px;cursor:pointer">
          <span style="font-size:.85rem">${t('settings','autoRefresh')}</span>
        </label>
        <label class="form-label">${t('settings','refreshInterval')}</label>
        <div style="display:flex;align-items:center;gap:10px;margin-top:6px">
          <input type="range" id="s-interval" min="10" max="120" step="10" value="${s.autoRefreshInterval||30}"
            style="flex:1" oninput="document.getElementById('intervalVal').textContent=this.value">
          <span id="intervalVal" style="font-size:.85rem;color:var(--accent);width:40px">${s.autoRefreshInterval||30}</span>
          <span style="font-size:.8rem;color:var(--text-muted)">${t('settings','seconds')}</span>
        </div>
      </div>
    </div>

    <!-- Chat settings -->
    <div class="card mb-20">
      <div class="card-header">
        <div>
          <span class="card-title">${t('settings','chat')}</span>
          <div style="font-size:.76rem;color:var(--text-muted);margin-top:2px">${t('settings','chatSub')}</div>
        </div>
      </div>
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
        <input type="checkbox" id="s-chatUpload" ${s.chatUploadEnabled!==false?'checked':''} style="width:16px;height:16px;cursor:pointer">
        <span style="font-size:.85rem">${t('settings','chatUpload')}</span>
      </label>
    </div>

    <!-- Token Budget -->
    <div class="card mb-20">
      <div class="card-header">
        <div>
          <span class="card-title">🔋 Budget tokens / jour</span>
          <div style="font-size:.76rem;color:var(--text-muted);margin-top:2px">Sert à calculer le % utilisé dans Agent Status. Ajuste selon ton plan Anthropic.</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Budget journalier (tokens frais)</label>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
          ${[100000,250000,500000,1000000].map(v => `
            <button onclick="document.getElementById('s-budget').value='${v}'"
              style="background:var(--bg-tertiary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;cursor:pointer;font-size:.8rem;color:var(--text-secondary);transition:.12s"
              onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)'">${fmtNum2(v)}</button>
          `).join('')}
        </div>
        <input class="form-input" id="s-budget" type="number" value="${s.dailyTokenBudget || 500000}" style="margin-top:10px;max-width:200px">
        <div style="font-size:.75rem;color:var(--text-muted);margin-top:4px">claude-sonnet-4-6 typiquement: 40k tokens/min · pas de limite journalière officielle</div>
      </div>
    </div>

    <!-- About -->
    <div class="card mb-24">
      <div class="card-header"><span class="card-title">${t('settings','about')}</span></div>
      <div style="font-size:.85rem;color:var(--text-secondary);line-height:2">
        <div>${t('settings','version')}</div>
        <div>${t('settings','builtBy')}</div>
        <div style="margin-top:4px;font-size:.78rem;color:var(--text-muted)">${t('settings','localData')}</div>
      </div>
    </div>

    <div style="display:flex;gap:10px">
      <button class="btn btn-primary" onclick="saveSettings()">${t('settings','save')}</button>
    </div>
  `;
}

async function saveSettings() {
  const data = {
    ownerName:           document.getElementById('s-name')?.value.trim(),
    ownerHandle:         document.getElementById('s-handle')?.value.trim(),
    accentColor:         document.getElementById('s-accent')?.value,
    theme:               document.documentElement.getAttribute('data-theme'),
    compactMode:         document.getElementById('s-compact')?.checked,
    language:            _lang,
    autoRefresh:         document.getElementById('s-autoRefresh')?.checked,
    autoRefreshInterval: parseInt(document.getElementById('s-interval')?.value || 30),
    chatUploadEnabled:   document.getElementById('s-chatUpload')?.checked,
    dailyTokenBudget:    parseInt(document.getElementById('s-budget')?.value || 500000),
    defaultPage:         document.getElementById('s-defaultPage')?.value,
    dateFormat:          _dateFormat,
  };
  await API.settings.update(data);
  document.documentElement.style.setProperty('--accent', data.accentColor);
  if (data.compactMode) document.body.classList.add('compact');
  else document.body.classList.remove('compact');
  toast(t('settings','saved'), 'success');
}

async function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  await API.settings.update({ theme });
  Router.go('settings');
}

let _dateFormat = 'relative';
function setDateFmt(fmt) {
  _dateFormat = fmt;
  Router.go('settings');
}

async function changeLang(lang) {
  _lang = lang;
  setLang(lang);
  await API.settings.update({ language: lang });
  Router.go('settings');
}

function fmtNum2(n){if(n>=1000000)return(n/1000000).toFixed(1)+'M';if(n>=1000)return(n/1000).toFixed(0)+'k';return String(n);}
