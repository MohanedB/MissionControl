let _chatHistory = [];
let _chatOnline = true;
let _pendingFile = null;
let _abortController = null;
let _isStreaming = false;

async function renderChat() {
  try {
    const status = await API.get('/api/agent-status');
    _chatOnline = status.gateway;
  } catch { _chatOnline = false; }

  return `
    <style>
      #chatRoot { --chat-max: 720px; }
      .chat-msg-wrap { width: 100%; display: flex; justify-content: center; padding: 0 16px; }
      .chat-msg-inner { width: 100%; max-width: var(--chat-max); }

.chat-user-bubble {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 18px 18px 4px 18px;
  padding: 11px 16px;
  font-size: .93rem;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 80%;
  color: var(--text-primary);
  display: inline-block;      
  width: fit-content;      
}

      .chat-action-btn {
        background: none;
        border: 1px solid var(--border);
        color: var(--text-muted);
        border-radius: 6px;
        padding: 3px 10px;
        font-size: .72rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transition: .12s;
        font-family: inherit;
      }
      .chat-action-btn:hover { color: var(--text-primary); border-color: var(--text-secondary); background: var(--bg-hover); }

      .chat-avatar {
        width: 28px; height: 28px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; font-size: .82rem; font-weight: 700;
      }
      .chat-avatar-user { background: var(--accent-muted); color: #fff; }
      .chat-avatar-bot  { background: linear-gradient(135deg, #7c3aed, var(--accent)); color: #fff; font-size: .7rem; }

      #chatInputWrap {
        width: 100%; display: flex; justify-content: center; padding: 0 16px 8px;
      }
      #chatInputInner {
        width: 100%; max-width: var(--chat-max);
      }
      #chatInputBox {
        border: 1.5px solid var(--border);
        border-radius: 16px;
        background: var(--bg-secondary);
        transition: border-color .15s, box-shadow .15s;
        box-shadow: 0 2px 12px rgba(0,0,0,.2);
      }
      #chatInputBox:focus-within {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-subtle), 0 2px 12px rgba(0,0,0,.2);
      }

      .chat-suggestion-btn {
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 10px 16px;
        cursor: pointer;
        color: var(--text-secondary);
        font-size: .83rem;
        line-height: 1.4;
        transition: .12s;
        font-family: inherit;
        text-align: left;
      }
      .chat-suggestion-btn:hover {
        border-color: var(--accent);
        color: var(--text-primary);
        background: var(--accent-subtle);
      }
    </style>

    <div id="chatRoot" style="display:flex;flex-direction:column;height:calc(100vh - var(--topbar-h) - 32px);width:100%;position:relative">

      <!-- Messages -->
      <div id="chatMessages" style="flex:1;overflow-y:auto;padding:32px 0 16px;display:flex;flex-direction:column;gap:0;min-height:0" onscroll="handleChatScroll()">
        ${_chatHistory.length === 0 ? chatEmptyState() : _chatHistory.map((m, i) => chatBubble(m, i)).join('')}
      </div>

      <!-- Scroll to bottom -->
      <button id="scrollBtn" onclick="scrollChat(true)"
        style="display:none;position:absolute;bottom:100px;left:50%;transform:translateX(-50%);padding:6px 16px;border-radius:20px;background:var(--bg-tertiary);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;font-size:.78rem;gap:6px;align-items:center;transition:.15s;z-index:10;white-space:nowrap">
        ↓ Scroll to bottom
      </button>

      ${!_chatOnline ? `
        <div style="text-align:center;font-size:.78rem;color:var(--danger);margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:6px">
          <div style="width:6px;height:6px;border-radius:50%;background:var(--danger)"></div>
          Gateway offline —
          <a href="#" onclick="Router.go('agent');return false" style="color:var(--danger);text-decoration:underline">start it here</a>
        </div>
      ` : ''}

      <!-- Input -->
      <div id="chatInputWrap">
        <div id="chatInputInner">

          <!-- File pill -->
          <div id="filePreview" style="display:none;margin-bottom:8px;padding:0 4px">
            <span style="display:inline-flex;align-items:center;gap:7px;background:var(--bg-tertiary);border:1px solid var(--border);padding:5px 12px;border-radius:20px;font-size:.78rem;color:var(--text-secondary)">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span id="filePreviewName"></span>
              <button onclick="clearFileAttachment()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.1rem;padding:0;line-height:1">×</button>
            </span>
          </div>

          <div id="chatInputBox">
            <textarea id="chatInput"
              placeholder="Message OpenClaw…"
              rows="1"
              style="display:block;width:100%;background:none;border:none;outline:none;resize:none;padding:16px 16px 0;font-size:.95rem;font-family:inherit;color:var(--text-primary);line-height:1.6;min-height:56px;max-height:220px;box-sizing:border-box"
              onkeydown="handleChatKey(event)"
              oninput="autoResizeChat(this)"
              ${!_chatOnline ? 'disabled' : ''}></textarea>

            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px 10px">
              <div style="display:flex;align-items:center;gap:4px">
                <label style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-muted);transition:.15s"
                       title="Attach file"
                       onmouseenter="this.style.background='var(--bg-hover)';this.style.color='var(--text-primary)'"
                       onmouseleave="this.style.background='transparent';this.style.color='var(--text-muted)'">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  <input type="file" id="chatFileInput" style="display:none" onchange="handleFileAttach(this)">
                </label>
                <button onclick="clearChat()" title="Clear chat"
                  style="width:32px;height:32px;border-radius:8px;border:none;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-muted);transition:.15s"
                  onmouseenter="this.style.background='var(--bg-hover)';this.style.color='var(--danger)'"
                  onmouseleave="this.style.background='transparent';this.style.color='var(--text-muted)'"
                  title="Clear chat">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>

              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:.72rem;color:var(--text-muted)">OpenClaw</span>
                <button id="stopBtn" onclick="stopGeneration()"
                  style="display:none;padding:6px 14px;border-radius:10px;border:1px solid var(--border);background:var(--bg-hover);color:var(--text-primary);font-size:.8rem;cursor:pointer;font-family:inherit;align-items:center;gap:6px">
                  <svg width="10" height="10" viewBox="0 0 10 10"><rect width="10" height="10" rx="2" fill="currentColor"/></svg>
                  Stop
                </button>
                <button id="sendBtn" onclick="sendChat()"
                  style="width:34px;height:34px;border-radius:10px;border:none;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s;flex-shrink:0"
                  ${!_chatOnline ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''}
                  onmouseenter="if(!this.disabled)this.style.background='var(--accent-muted)'"
                  onmouseleave="this.style.background='var(--accent)'">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </div>
          <div style="text-align:center;font-size:.68rem;color:var(--text-muted);margin-top:8px">
            OpenClaw peut faire des erreurs. Vérifie les infos importantes.
          </div>
        </div>
      </div>
    </div>
  `;
}

function chatEmptyState() {
  const prompts = [
    { icon: '🐛', text: 'Quels sont les bugs connus dans TazUE?' },
    { icon: '📤', text: 'Push mes derniers changements sur GitHub' },
    { icon: '📋', text: 'Résume mes notes de projet récentes' },
    { icon: '🎮', text: 'Fix le bug de smoothing de caméra Look()' },
  ];
  return `
    <div id="chatEmpty" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:32px 16px;gap:32px">
      <div>
        <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,var(--accent));display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:1.5rem;box-shadow:0 4px 24px rgba(88,166,255,.2)">🤖</div>
        <h3 style="font-size:1.4rem;font-weight:700;margin:0 0 8px;color:var(--text-primary)">Comment puis-je aider?</h3>
        <p style="font-size:.88rem;color:var(--text-muted);line-height:1.6;margin:0;max-width:400px">Accès complet à ton workspace — code, fichiers, GitHub, recherche.</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:560px">
        ${prompts.map(p => `
          <button onclick="fillPrompt(this)" data-p="${p.text.replace(/"/g,'&quot;')}"
            class="chat-suggestion-btn">
            <span style="font-size:1rem;display:block;margin-bottom:4px">${p.icon}</span>
            <span>${p.text}</span>
          </button>`).join('')}
      </div>
    </div>
  `;
}

function chatBubble(m, index) {
  const isUser = m.role === 'user';

  if (isUser) {
    const display = escHtml(m._displayContent || m.content || '');
    return `
      <div class="chat-msg-wrap" style="padding-bottom:20px">
        <div class="chat-msg-inner">
          <div style="display:flex;justify-content:flex-end;align-items:flex-end;gap:10px"
               onmouseenter="this.querySelector('.chat-user-actions').style.opacity='1'"
               onmouseleave="this.querySelector('.chat-user-actions').style.opacity='0'">
            <div class="chat-user-actions" style="opacity:0;transition:.15s;display:flex;gap:4px;align-items:center;padding-bottom:2px">
              <button class="chat-action-btn" onclick="editUserMessage(${index})" title="Edit">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Éditer
              </button>
            </div>
            <div class="chat-user-bubble">
              ${m._fileAttached ? `<div style="font-size:.72rem;color:var(--text-muted);margin-bottom:6px;display:flex;align-items:center;gap:4px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>${m._fileAttached}</div>` : ''}
              ${display}
            </div>
            <div class="chat-avatar chat-avatar-user">S</div>
          </div>
        </div>
      </div>
    `;
  }

  // Assistant
  const rendered = typeof renderMarkdown === 'function' ? renderMarkdown(m.content || '') : escHtml(m.content || '');
  const msgId = 'msg_' + index;
  return `
    <div class="chat-msg-wrap" style="padding-bottom:24px">
      <div class="chat-msg-inner">
        <div style="display:flex;align-items:flex-start;gap:12px"
             onmouseenter="this.querySelector('.chat-assistant-actions').style.opacity='1'"
             onmouseleave="this.querySelector('.chat-assistant-actions').style.opacity='0'">
          <div class="chat-avatar chat-avatar-bot" style="margin-top:2px">OC</div>
          <div style="flex:1;min-width:0">
            <div class="md-response" id="${msgId}" style="font-size:.93rem;line-height:1.75;color:var(--text-primary)">${rendered}</div>
            <div class="chat-assistant-actions" style="opacity:0;transition:.15s;display:flex;gap:6px;margin-top:10px">
              <button class="chat-action-btn" onclick="copyMessage('${msgId}')">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copier
              </button>
              ${index === _chatHistory.length - 1 ? `
              <button class="chat-action-btn" onclick="retryLastMessage()">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.75"/></svg>
                Réessayer
              </button>` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function chatEmptyState() {
  const prompts = [
    'What are the known bugs in TazUE?',
    'Push my latest changes to GitHub',
    'Summarize my recent project notes',
    'Fix the Look() camera smoothing bug',
  ];
  return `
    <div id="chatEmpty" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:32px 16px;gap:24px">
      <div>
        <div style="font-size:2rem;margin-bottom:12px">🤖</div>
        <h3 style="font-size:1.15rem;font-weight:700;margin:0 0 6px;color:var(--text-primary)">How can I help?</h3>
        <p style="font-size:.85rem;color:var(--text-muted);line-height:1.6;margin:0">Full access to your workspace — code, files, GitHub, research.</p>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:560px">
        ${prompts.map(p => `<button
          onclick="fillPrompt(this)"
          data-p="${p.replace(/"/g,'&quot;')}"
          style="background:var(--bg-tertiary);border:1px solid var(--border);border-radius:8px;padding:8px 14px;cursor:pointer;color:var(--text-secondary);font-size:.82rem;transition:.12s"
          onmouseenter="this.style.borderColor='var(--accent)';this.style.color='var(--text-primary)'"
          onmouseleave="this.style.borderColor='var(--border)';this.style.color='var(--text-secondary)'">${p}</button>`).join('')}
      </div>
    </div>
  `;
}

function fillPrompt(btn) {
  const inp = document.getElementById('chatInput');
  if (!inp) return;
  inp.value = btn.dataset.p;
  autoResizeChat(inp);
  inp.focus();
}

function chatBubble(m, index) {
  const isUser = m.role === 'user';
  const ts = m._ts ? `<span style="font-size:.68rem;color:var(--text-muted);opacity:0">${m._ts}</span>` : '';

if (isUser) {
  const display = escHtml(m._displayContent || m.content || '');
  return `
    <div class="chat-msg-wrap" style="padding-bottom:20px">
      <div class="chat-msg-inner">
        <div style="display:flex;justify-content:flex-end;align-items:flex-end;gap:10px"
             onmouseenter="this.querySelector('.chat-user-actions').style.opacity='1'"
             onmouseleave="this.querySelector('.chat-user-actions').style.opacity='0'">
          <div class="chat-user-actions" style="opacity:0;transition:.15s;display:flex;gap:4px;align-items:center;padding-bottom:2px">
            <button class="chat-action-btn" onclick="editUserMessage(${index})">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Éditer
            </button>
          </div>
          <div class="chat-user-bubble" style="display:inline-block;width:fit-content;max-width:80%">
            ${m._fileAttached ? `<div style="font-size:.72rem;color:var(--text-muted);margin-bottom:6px">📎 ${m._fileAttached}</div>` : ''}
            ${display}
          </div>
          <div class="chat-avatar chat-avatar-user">S</div>
        </div>
      </div>
    </div>
  `;
}
  // Assistant
  const rendered = typeof renderMarkdown === 'function' ? renderMarkdown(m.content || '') : escHtml(m.content || '');
  const msgId = 'msg_' + index;
  return `
    <div class="chat-assistant-row" style="padding:4px 0 28px;width:100%"
         onmouseenter="this.querySelector('.chat-assistant-actions').style.opacity='1'"
         onmouseleave="this.querySelector('.chat-assistant-actions').style.opacity='0'">
      <div class="md-response" id="${msgId}" style="font-size:.9rem;line-height:1.75;color:var(--text-primary)">${rendered}</div>
      <div class="chat-assistant-actions" style="opacity:0;transition:.15s;display:flex;gap:6px;margin-top:8px">
        <button onclick="copyMessage('${msgId}')" title="Copy"
          style="background:none;border:1px solid var(--border);color:var(--text-muted);border-radius:6px;padding:3px 10px;font-size:.72rem;cursor:pointer;display:flex;align-items:center;gap:4px"
          onmouseenter="this.style.color='var(--text-primary)'" onmouseleave="this.style.color='var(--text-muted)'">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy
        </button>
        ${index === _chatHistory.length - 1 ? `
        <button onclick="retryLastMessage()" title="Retry"
          style="background:none;border:1px solid var(--border);color:var(--text-muted);border-radius:6px;padding:3px 10px;font-size:.72rem;cursor:pointer"
          onmouseenter="this.style.color='var(--text-primary)'" onmouseleave="this.style.color='var(--text-muted)'">↻ Retry</button>
        ` : ''}
      </div>
    </div>
  `;
}

function chatTypingDots() {
  return `
    <div id="typingDots" style="padding:4px 0 24px;display:flex;gap:5px;align-items:center">
      <div style="width:7px;height:7px;border-radius:50%;background:var(--text-muted);animation:chatDot 1.4s infinite"></div>
      <div style="width:7px;height:7px;border-radius:50%;background:var(--text-muted);animation:chatDot 1.4s infinite .2s"></div>
      <div style="width:7px;height:7px;border-radius:50%;background:var(--text-muted);animation:chatDot 1.4s infinite .4s"></div>
    </div>
  `;
}

function autoResizeChat(el) {
  el.style.height = '52px';
  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
}

function handleChatScroll() {
  const el = document.getElementById('chatMessages');
  const btn = document.getElementById('scrollBtn');
  if (!el || !btn) return;
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  btn.style.display = atBottom ? 'none' : 'flex';
}

function scrollChat(force = false) {
  const el = document.getElementById('chatMessages');
  if (!el) return;
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
  if (force || atBottom) el.scrollTop = el.scrollHeight;
}

async function handleFileAttach(input) {
  const file = input.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res  = await fetch('/api/chat/upload', { method: 'POST', body: fd });
    const data = await res.json();
    _pendingFile = { name: data.name, size: data.size, content: data.content };
    const preview = document.getElementById('filePreview');
    const nameEl  = document.getElementById('filePreviewName');
    if (preview) preview.style.display = 'block';
    if (nameEl)  nameEl.textContent = `${data.name} · ${fmtBytes(data.size)}`;
  } catch(e) { toast('File error: ' + e.message, 'error'); }
  input.value = '';
}

function clearFileAttachment() {
  _pendingFile = null;
  const p = document.getElementById('filePreview');
  if (p) p.style.display = 'none';
}

function stopGeneration() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
}

async function sendChat() {
  if (_isStreaming) return;
  const input    = document.getElementById('chatInput');
  const userText = input?.value.trim();
  if (!userText && !_pendingFile) return;

  const btn  = document.getElementById('sendBtn');
  const stop = document.getElementById('stopBtn');
  if (btn)  btn.style.display  = 'none';
  if (stop) stop.style.display = 'flex';
  if (input) { input.value = ''; input.style.height = '56px'; input.disabled = true; }

  let msgContent     = userText || '';
  let displayContent = userText || '';
  let fileAttachedName = null;

  if (_pendingFile) {
    fileAttachedName = _pendingFile.name;
    msgContent = userText
      ? `${userText}\n\n---\n📎 File: ${_pendingFile.name}\n\`\`\`\n${_pendingFile.content}\n\`\`\``
      : `📎 File: ${_pendingFile.name}\n\`\`\`\n${_pendingFile.content}\n\`\`\``;
    displayContent = userText || `(${_pendingFile.name})`;
    clearFileAttachment();
  }

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const userMsg = { role: 'user', content: msgContent, _displayContent: displayContent, _fileAttached: fileAttachedName, _ts: now };
  _chatHistory.push(userMsg);

  const container = document.getElementById('chatMessages');
  document.getElementById('chatEmpty')?.remove();

  if (container) {
    const d = document.createElement('div');
    d.innerHTML = chatBubble(userMsg, _chatHistory.length - 1);
    container.appendChild(d.firstElementChild);
    const td = document.createElement('div');
    td.innerHTML = chatTypingDots();
    container.appendChild(td.firstElementChild);
  }
  scrollChat(true);

  _isStreaming = true;
  _abortController = new AbortController();
  let fullText = '';
  const token = localStorage.getItem('mc_token') || '';
  const msgs = _chatHistory.slice(-16).map(m => ({ role: m.role, content: m.content }));

  // ── Tente le streaming ──────────────────────────────────────────
  let streamWorked = false;
  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ messages: msgs }),
      signal: _abortController.signal
    });

    if (!res.ok || !res.body) throw new Error('stream_unavailable');

    document.getElementById('typingDots')?.remove();

    // Crée la bulle de streaming
    const streamWrap = document.createElement('div');
    streamWrap.className = 'chat-msg-wrap';
    streamWrap.style.paddingBottom = '24px';
    streamWrap.innerHTML = `
      <div class="chat-msg-inner">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div class="chat-avatar chat-avatar-bot" style="margin-top:2px">OC</div>
          <div style="flex:1;min-width:0">
            <div class="md-response stream-content" style="font-size:.93rem;line-height:1.75;color:var(--text-primary)"></div>
          </div>
        </div>
      </div>`;
    container.appendChild(streamWrap);
    const contentDiv = streamWrap.querySelector('.stream-content');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    streamWorked = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { fullText = '⚠️ ' + parsed.error; streamWorked = false; break; }
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            contentDiv.innerHTML = typeof renderMarkdown === 'function'
              ? renderMarkdown(fullText)
              : escHtml(fullText);
            scrollChat();
          }
        } catch {}
      }
      if (!streamWorked) break;
    }

    // Remplace la bulle de stream par la bulle finale (avec boutons copy/retry)
    streamWrap.remove();

  } catch(e) {
    if (e.name === 'AbortError') {
      fullText = fullText || '(arrêté)';
      streamWorked = true; // pas un vrai fail, juste arrêté
    } else {
      streamWorked = false;
      console.warn('Stream failed, fallback:', e.message);
    }
  }

  // ── Fallback non-streamé si stream a échoué ──────────────────────
  if (!streamWorked) {
    document.getElementById('typingDots')?.remove();

    // Remet les dots pendant l'attente
    if (container) {
      const td = document.createElement('div');
      td.innerHTML = chatTypingDots();
      container.appendChild(td.firstElementChild);
    }

try {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ messages: msgs })
  });
  
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { 
    fullText = '⚠️ Gateway offline ou server pas redémarré. Fais `node server.js`';
    data = null;
  }
  
  if (data) {
    if (res.ok) {
      fullText = data.choices?.[0]?.message?.content || '';
    } else {
      fullText = '⚠️ ' + (data.error?.message || data.error || 'Erreur ' + res.status);
    }
  }
} catch(e2) {
  fullText = '⚠️ ' + e2.message;
}

    document.getElementById('typingDots')?.remove();
  }

  // ── Ajoute la réponse finale au DOM et à l'historique ───────────
  _isStreaming = false;
  _abortController = null;

  const assistantMsg = {
    role: 'assistant',
    content: fullText,
    _ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  _chatHistory.push(assistantMsg);

  if (container) {
    const d = document.createElement('div');
    d.innerHTML = chatBubble(assistantMsg, _chatHistory.length - 1);
    container.appendChild(d.firstElementChild);
  }
  scrollChat(true);

  if (btn)   btn.style.display  = 'flex';
  if (stop)  stop.style.display = 'none';
  if (input) { input.disabled = false; input.focus(); }
}


function copyMessage(msgId) {
  const el = document.getElementById(msgId);
  if (!el) return;
  navigator.clipboard.writeText(el.innerText).then(() => toast('Copied!', 'success'));
}

function retryLastMessage() {
  // Remove last assistant message
  const lastAssistant = _chatHistory.pop();
  if (!lastAssistant || lastAssistant.role !== 'assistant') {
    if (lastAssistant) _chatHistory.push(lastAssistant);
    return;
  }
  // Remove from DOM
  const container = document.getElementById('chatMessages');
  const rows = container?.querySelectorAll('.chat-assistant-row');
  rows?.[rows.length - 1]?.remove();

  // Resend last user message
  const lastUser = _chatHistory[_chatHistory.length - 1];
  if (!lastUser || lastUser.role !== 'user') return;

  const input = document.getElementById('chatInput');
  _chatHistory.pop(); // will be re-added in sendChat

  // Restore message to input temporarily and send
  const fakeInput = document.createElement('textarea');
  fakeInput.id = 'chatInput';
  fakeInput.value = lastUser._displayContent || lastUser.content;
  fakeInput.style.display = 'none';
  document.body.appendChild(fakeInput);
  const real = document.getElementById('chatInput');
  if (real) real.value = lastUser._displayContent || lastUser.content;

  // Remove user bubble from DOM too
  const userRows = container?.querySelectorAll('.chat-user-row');
  userRows?.[userRows.length - 1]?.remove();

  fakeInput.remove();
  sendChat();
}

function editUserMessage(index) {
  const msg = _chatHistory[index];
  if (!msg || msg.role !== 'user') return;
  const input = document.getElementById('chatInput');
  if (!input) return;
  input.value = msg._displayContent || msg.content;
  autoResizeChat(input);
  input.focus();
  // Trim history to before this message
  _chatHistory = _chatHistory.slice(0, index);
  // Re-render
  const container = document.getElementById('chatMessages');
  if (container) {
    container.innerHTML = _chatHistory.length === 0
      ? chatEmptyState()
      : _chatHistory.map((m, i) => chatBubble(m, i)).join('');
  }
}

function clearChat() {
  _chatHistory = [];
  Router.go('chat');
}

function fmtBytes(b) {
  if (b < 1024) return b + 'B';
  if (b < 1048576) return (b/1024).toFixed(1) + 'KB';
  return (b/1048576).toFixed(1) + 'MB';
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}