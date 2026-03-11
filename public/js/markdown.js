// ─── Markdown Renderer ───────────────────────────────────────────────────────

function renderMarkdown(raw) {
  if (!raw) return '';
  const text = String(raw);

  // Step 1: Extract code blocks and replace with placeholders
  const blocks = [];
  let processed = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const id = 'cb' + blocks.length;
    const label = lang || 'code';
    const escaped = escMd(code.replace(/^\n/, '').replace(/\n$/, ''));
    const cbId = 'pre_' + Math.random().toString(36).slice(2,8);
    blocks.push(`<div class="md-code-block">
<div class="md-code-header"><span class="md-code-lang">${escMd(label)}</span><button class="md-copy-btn" onclick="copyCode('${cbId}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</button></div>
<pre class="md-code-pre" id="${cbId}"><code>${escaped}</code></pre>
</div>`);
    return `\x00BLOCK${id}\x00`;
  });

  // Step 2: Process line by line
  const lines = processed.split('\n');
  const out = [];
  let inUl = false, inOl = false;

  function closeList() {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  }

  for (const line of lines) {
    // Placeholder — restore code block
    if (line.includes('\x00BLOCK')) {
      closeList();
      out.push(line.replace(/\x00BLOCK(\d+)\x00/g, (_, i) => blocks[+i]));
      continue;
    }

    // Headers
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h1) { closeList(); out.push(`<h3 class="md-h1">${inlineFmt(h1[1])}</h3>`); continue; }
    if (h2) { closeList(); out.push(`<h3 class="md-h2">${inlineFmt(h2[1])}</h3>`); continue; }
    if (h3) { closeList(); out.push(`<h4 class="md-h3">${inlineFmt(h3[1])}</h4>`); continue; }

    // HR
    if (line.match(/^-{3,}\s*$/) || line.match(/^\*{3,}\s*$/)) {
      closeList(); out.push('<hr class="md-hr">'); continue;
    }

    // Unordered list
    const ul = line.match(/^[-*]\s+(.+)/);
    if (ul) {
      if (!inUl) { closeList(); out.push('<ul class="md-ul">'); inUl = true; }
      out.push(`<li>${inlineFmt(ul[1])}</li>`);
      continue;
    }

    // Ordered list
    const ol = line.match(/^\d+[.)]\s+(.+)/);
    if (ol) {
      if (!inOl) { closeList(); out.push('<ol class="md-ol">'); inOl = true; }
      out.push(`<li>${inlineFmt(ol[1])}</li>`);
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      closeList();
      out.push('<div style="height:8px"></div>');
      continue;
    }

    // Paragraph
    closeList();
    out.push(`<p class="md-p">${inlineFmt(line)}</p>`);
  }

  closeList();
  return out.join('');
}

function inlineFmt(s) {
  // Inline code first
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code class="md-inline-code">${escMd(c)}</code>`);
  // Bold+italic
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');
  // Italic
  s = s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  // Links
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" class="md-link">$1</a>');
  return s;
}

function escMd(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function copyCode(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    const btn = el.closest('.md-code-block')?.querySelector('.md-copy-btn');
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.innerHTML = orig, 1500);
  });
}
