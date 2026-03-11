const Router = {
  currentPage: 'dashboard',
  currentProject: null,

  go(page, data = null) {
    this.currentPage = page;
    this.currentProject = data;
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.page === page);
    });
    const titles = {
      dashboard: ['Dashboard', 'Welcome back, Shadow'],
      projects:  ['Projects', 'All your game projects'],
      project:   [data?.name || 'Project', data?.engine || ''],
      chat:      ['Chat', 'Message OpenClaw directly'],
      tasks:     ['Tâches', 'File de travail pour OpenClaw'],
      agent:     ['Agent Status', 'Tokens, sessions, logs en direct'],
      notes:     ['Dev Diary', 'Your development journal'],
      uploads:   ['Uploads', 'PDFs & files for OpenClaw to process'],
      settings:  ['Settings', 'Configure Mission Control'],
    };
    const [title, sub] = titles[page] || [page, ''];
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('pageSubtitle').textContent = sub;
    App.render(page, data);
    document.getElementById('content').scrollTop = 0;
  }
};
