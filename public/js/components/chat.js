let _chatHistory = [];
let _chatOnline = true;
let _pendingFile = null;

async function renderChat() {
  try {
    const status = await API.get('/api/agent-status');
    _chatOnline = status.gateway;
  } catch { _chatOnline = false; }

  return `
    <div id="chatRoot" style="display:flex;flex-direction:column;height:calc(100vh - var(--topbar-h) - 32px);width:100%">

      <!-- Messages -->
      <div id="chatMessages" style="flex:1;overflow-y:auto;padding:24px 0 32px;display:flex;flex-direction:column;min-height:0">
        ${_chatHistory.length === 0 ? chatEmptyState() : _chatHistory.map(m => chatBubble(m)).join('')}
      </div>

      <!-- Input -->
      <div style="padding:0 0 8px">
        ${!_chatOnline ? `
          <div style="text-align:center;font-size:.78rem;color:var(--danger);margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:6px">
            <div style="width:6px;height:6px;border-radius:50%;background:var(--danger)"></div>
            Gateway offline —
            <a href="#" onclick="Router.go('agent');return false" style="color:var(--danger);text-decoration:underline">start it here</a>
          </div>
        ` : ''}

        <!-- File pill -->
        <div id="filePreview" style="display:none;margin-bottom:8px">
          <span style="display:inline-flex;align-items:center;gap:7px;background:var(--bg-tertiary);border:1px solid var(--border);padding:5px 12px;border-radius:20px;font-size:.78rem;color:var(--text-secondary)">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span id="filePreviewName"></span>
            <button onclick="clearFileAttachment()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1rem;padding:0;line-height:1">×</button>
          </span>
        </div>

        <!-- Input box -->
        <div id="chatInputBox" style="border:1.5px solid var(--border);border-radius:14px;background:var(--bg-secondary);transition:border-color .15s"
             onfocusin="this.style.borderColor='var(--accent)'"
             onfocusout="this.style.borderColor='var(--border)'">
          <textarea id="chatInput"
            placeholder="Reply…"
            rows="1"
            style="display:block;width:100%;background:none;border:none;outline:none;resize:none;padding:14px 16px 0;font-size:.93rem;font-family:inherit;color:var(--text-primary);line-height:1.6;min-height:52px;max-height:200px;box-sizing:border-box"
            onkeydown="handleChatKey(event)"
            oninput="autoResizeChat(this)"
            ${!_chatOnline ? 'disabled' : ''}></textarea>

          <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px 8px">
            <label style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-muted);transition:.15s"
                   title="Attach file"
                   onmouseenter="this.style.color='var(--text-primary)'" onmouseleave="this.style.color='var(--text-muted)'">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              <input type="file" id="chatFileInput" style="display:none" onchange="handleFileAttach(this)">
            </label>

            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:.72rem;color:var(--text-muted)">Sonnet 4.6</span>
              <button id="sendBtn" onclick="sendChat()"
                style="width:32px;height:32px;border-radius:8px;border:none;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity .15s;flex-shrink:0"
                ${!_chatOnline ? 'disabled' : ''}
                onmouseenter="this.style.opacity='.8'" onmouseleave="this.style.opacity='1'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
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
          style="background:var(--bg-tertiary);border:1px solid var(--border);border-radius:8px;padding:8px 14px;cursor:pointer;color:var(--text-secondary);font-size:.82rem;line-height:1.4;transition:.12s;white-space:nowrap"
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

function chatBubble(m) {
  const isUser = m.role === 'user';
  const display = escHtml(m._displayContent || m.content || '');

  if (isUser) {
    return `
      <div style="display:flex;justify-content:flex-end;padding:4px 0 20px">
        <div style="display:inline-block;max-width:70%;background:var(--bg-tertiary);border:1px solid var(--border);color:var(--text-primary);padding:10px 14px;border-radius:18px 18px 4px 18px;font-size:.9rem;line-height:1.65;white-space:pre-wrap;word-break:break-word">
          ${m._fileAttached ? `<div style="font-size:.72rem;color:var(--text-muted);margin-bottom:5px">📎 ${m._fileAttached}</div>` : ''}${display}
        </div>
      </div>
    `;
  }

  // Assistant — no bubble, full-width rendered markdown
  const rendered = typeof renderMarkdown === 'function' ? renderMarkdown(m.content || '') : escHtml(m.content || '');
  return `
    <div class="md-response" style="padding:4px 0 28px;font-size:.9rem;line-height:1.75;color:var(--text-primary);width:100%">
      ${rendered}
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
    if (nameEl) nameEl.textContent = `${data.name} · ${fmtBytes(data.size)}`;
  } catch(e) { toast('File error: ' + e.message, 'error'); }
  input.value = '';
}

function clearFileAttachment() {
  _pendingFile = null;
  const p = document.getElementById('filePreview');
  if (p) p.style.display = 'none';
}

async function sendChat() {
  const input    = document.getElementById('chatInput');
  const userText = input?.value.trim();
  if (!userText && !_pendingFile) return;

  const btn = document.getElementById('sendBtn');
  if (btn) btn.disabled = true;
  if (input) { input.value = ''; input.style.height = '52px'; }

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

  const userMsg = { role: 'user', content: msgContent, _displayContent: displayContent, _fileAttached: fileAttachedName };
  _chatHistory.push(userMsg);

  const container = document.getElementById('chatMessages');
  document.getElementById('chatEmpty')?.remove();

  if (container) {
    const d = document.createElement('div');
    d.innerHTML = chatBubble(userMsg);
    container.appendChild(d.firstElementChild);
    const td = document.createElement('div');
    td.innerHTML = chatTypingDots();
    container.appendChild(td.firstElementChild);
  }
  scrollChat();

  let fullText = '';
  try {
    const msgs = _chatHistory.slice(-12).map(m => ({ role: m.role, content: m.content }));
    const res  = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs })
    });
    const data = await res.json();
    if (res.ok) {
      fullText = data.choices?.[0]?.message?.content || '';
    } else {
      const err = data.error?.message || data.error || 'Error';
      fullText = (err.toLowerCase().includes('rate') || res.status === 429)
        ? '⚠️ Rate limit hit — tokens exhausted. Wait ~1 hour.'
        : '⚠️ ' + err;
    }
  } catch(e) { fullText = '⚠️ ' + e.message; }

  document.getElementById('typingDots')?.remove();
  _chatHistory.push({ role: 'assistant', content: fullText });

  if (container) {
    const d = document.createElement('div');
    d.innerHTML = chatBubble({ role: 'assistant', content: fullText });
    container.appendChild(d.firstElementChild);
  }
  scrollChat();

  if (btn) btn.disabled = false;
  input?.focus();
}

function scrollChat() {
  const el = document.getElementById('chatMessages');
  if (el) el.scrollTop = el.scrollHeight;
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
