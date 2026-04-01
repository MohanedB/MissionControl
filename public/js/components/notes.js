let _notesSearch = '';

async function renderNotes() {
  const notes = await API.notes.list();
  const filtered = _notesSearch
    ? notes.filter(n => n.title.toLowerCase().includes(_notesSearch) || n.content.toLowerCase().includes(_notesSearch))
    : notes;

  return `
    <div class="section-header mb-16">
      <h2 class="section-title">Dev Diary <span style="color:var(--text-muted);font-weight:400;font-size:.85rem">(${notes.length} entries)</span></h2>
      <button class="btn btn-primary" onclick="showNewNoteModal()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Entry
      </button>
    </div>
    <div class="filter-bar mb-16">
      <div class="search-input-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="search-input" placeholder="Search notes…" value="${_notesSearch}"
          oninput="_notesSearch=this.value.toLowerCase();renderNotes().then(h=>{document.getElementById('content').innerHTML=h})">
      </div>
    </div>
    <div class="grid-auto">
      ${filtered.length === 0
        ? `<div class="empty-state" style="grid-column:1/-1"><h3>No entries yet</h3><p>Start your dev diary — track progress, ideas, blockers.</p></div>`
        : filtered.map(n => noteCard(n)).join('')
      }
    </div>
  `;
}

function noteCard(n) {
  return `
    <div class="note-card" onclick="viewNote('${n.id}')">
      <div class="note-title">${n.title}</div>
      <div class="note-preview">${n.content}</div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="note-date">${new Date(n.createdAt).toLocaleDateString('en-CA', {year:'numeric',month:'short',day:'numeric'})}</div>
        <div style="display:flex;gap:4px">
          ${(n.tags||[]).map(t=>`<span class="badge badge-gray">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

async function viewNote(id) {
  const notes = await API.notes.list();
  const n = notes.find(x => x.id === id);
  if (!n) return;
  showModal(n.title, `
    <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:12px">${new Date(n.createdAt).toLocaleString()}</div>
    <div style="white-space:pre-wrap;line-height:1.7;font-size:.9rem;color:var(--text-secondary)">${n.content}</div>
    <div class="divider"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-danger btn-sm" onclick="deleteNote('${n.id}')">Delete</button>
      <button class="btn btn-secondary btn-sm" onclick="editNote('${n.id}')">Edit</button>
      <button class="btn btn-ghost btn-sm" onclick="closeModal()">Close</button>
    </div>
  `);
}

async function editNote(id) {
  const notes = await API.notes.list();
  const n = notes.find(x => x.id === id);
  if (!n) return;
  showModal('Edit Note', `
    <div class="form-group"><label class="form-label">Title</label><input class="form-input" id="en-title" value="${n.title}"></div>
    <div class="form-group"><label class="form-label">Content</label><textarea class="form-textarea" id="en-content" rows="8">${n.content}</textarea></div>
    <div class="form-group"><label class="form-label">Tags (comma separated)</label><input class="form-input" id="en-tags" value="${(n.tags||[]).join(', ')}"></div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNote('${n.id}')">Save</button>
    </div>
  `);
}

async function saveNote(id) {
  await API.notes.update(id, {
    title: document.getElementById('en-title').value.trim(),
    content: document.getElementById('en-content').value.trim(),
    tags: document.getElementById('en-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
  });
  closeModal();
  toast('Note saved', 'success');
  Router.go('notes');
}

async function deleteNote(id) {
  confirmModal('Supprimer cette note ? Cette action est irréversible.', async () => {
    await API.notes.delete(id);
    closeModal();
    toast('Note deleted', 'success');
    Router.go('notes');
  });
}

function showNewNoteModal() {
  showModal('New Journal Entry', `
    <div class="form-group"><label class="form-label">Title</label><input class="form-input" id="nn-title" placeholder="What happened today?"></div>
    <div class="form-group"><label class="form-label">Content</label><textarea class="form-textarea" id="nn-content" rows="8" placeholder="Write your dev diary entry…"></textarea></div>
    <div class="form-group"><label class="form-label">Tags (comma separated)</label><input class="form-input" id="nn-tags" placeholder="tazue, bugfix, idea"></div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createNote()">Save Entry</button>
    </div>
  `);
  setTimeout(() => document.getElementById('nn-content')?.focus(), 100);
}

async function createNote() {
  const title = document.getElementById('nn-title').value.trim();
  const content = document.getElementById('nn-content').value.trim();
  if (!title || !content) { toast('Title and content required', 'error'); return; }
  await API.notes.create({
    title, content,
    tags: document.getElementById('nn-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
  });
  closeModal();
  toast('Entry saved', 'success');
  Router.go('notes');
}
