// ─── i18n — Mission Control translations ──────────────────────────────────────
const LANG = {
  en: {
    nav: {
      dashboard: 'Dashboard', projects: 'Projects', chat: 'Chat',
      tasks: 'Tasks', agent: 'Agent Status', notes: 'Dev Diary',
      uploads: 'Uploads', settings: 'Settings'
    },
    dashboard: {
      title: 'Dashboard', subtitle: 'Welcome back',
      totalProjects: 'Total Projects', activeProjects: 'Active Projects',
      completedTasks: 'Tasks Done', queuedItems: 'Queued Items', totalNotes: 'Notes',
      activeProjectsTitle: 'Active Projects', queueTitle: 'OpenClaw Queue',
      activityTitle: 'Recent Activity', noQueue: 'Queue is empty',
      noProjects: 'No active projects', progress: 'progress'
    },
    tasks: {
      title: 'Tasks', subtitle: 'Work queue for OpenClaw',
      new: 'New Task', newTitle: 'New Task for OpenClaw',
      titleLabel: 'Task title', descLabel: 'Description (optional)',
      priorityLabel: 'Priority', projectLabel: 'Project',
      general: 'General', add: 'Add to Queue', cancel: 'Cancel',
      inProgress: '⚡ In Progress', queue: '📋 Queue', done: '✅ Done (last 10)',
      noQueue: 'No tasks queued', noQueueSub: 'Add a task — I\'ll handle it',
      noDone: 'No completed tasks', clearDone: 'Clear',
      titleRequired: 'Title required',
      taskAdded: 'Task added to queue', taskDone: 'Task marked as done',
      taskDeleted: 'Task deleted', doneCleared: 'Done tasks cleared',
      high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low',
      working: 'OpenClaw working'
    },
    chat: {
      title: 'Chat', subtitle: 'Direct line — bypasses Discord',
      online: 'Agent online', offline: 'Agent offline',
      offlineMsg: 'OpenClaw is offline. Start the gateway from Agent Status to chat.',
      clear: 'Clear', placeholder: 'Write a command… (Enter to send, Shift+Enter for new line)',
      you: 'You', agent: '🤖 OpenClaw',
      attachFile: 'Attach file',
      fileAttached: 'file attached',
      sending: 'Sending…'
    },
    agent: {
      title: 'Agent Status', subtitle: 'Tokens, sessions, live logs',
      refresh: 'Refresh', gateway: 'Gateway', model: 'Model',
      tokensIn: 'Tokens In', tokensOut: 'Tokens Out',
      cacheHit: 'Cache Hit', estCost: 'Est. Cost',
      skills: 'Installed Skills', logs: 'Live Logs',
      subagents: 'Active Sub-agents', noSubagents: 'No active sub-agents',
      loadingLogs: 'Loading logs…', noLogs: 'No recent logs',
      control: 'OpenClaw Controls', start: 'Start Gateway', stop: 'Stop Gateway',
      starting: 'Starting…', stopping: 'Stopping…',
      calls: 'Chat Calls', uptime: 'Uptime',
      noTokens: 'No data yet — send a chat message first',
      online: '🟢 Online', offline: '🔴 Offline',
      min: 'min'
    },
    settings: {
      title: 'Settings',
      profile: 'Profile', profileSub: 'Your display name and handle',
      name: 'Display Name', handle: 'Handle',
      appearance: 'Appearance', appearanceSub: 'Theme, colors, layout',
      theme: 'Theme', dark: '🌙 Dark', light: '☀️ Light',
      accent: 'Accent Color', current: 'Current:',
      language: 'Language', langSub: 'Interface language',
      compact: 'Compact Mode', compactSub: 'Smaller padding and text throughout',
      defaultPage: 'Default Page', defaultPageSub: 'Which page to show on startup',
      dateFormat: 'Date Format', dateRelative: 'Relative (2 hours ago)',
      dateAbsolute: 'Absolute (2026-03-10 16:00)',
      autoRefresh: 'Auto-Refresh', autoRefreshSub: 'Refresh agent status and dashboard automatically',
      refreshInterval: 'Refresh Interval', seconds: 'seconds',
      chat: 'Chat Settings', chatSub: 'Chat preferences',
      chatUpload: 'Allow file attachments in Chat',
      about: 'About', version: 'Mission Control v1.0.0', builtBy: 'Built by OpenClaw for Shadow',
      localData: 'Data stored locally at ./data/',
      save: 'Save Settings', saved: 'Settings saved'
    },
    common: {
      edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel',
      create: 'Create', add: 'Add', search: 'Search…', filter: 'Filter',
      all: 'All', active: 'Active', paused: 'Paused', complete: 'Complete',
      todo: 'To Do', inProgress: 'In Progress', done: 'Done',
      high: 'High', medium: 'Medium', low: 'Low', loading: 'Loading…',
      error: 'Error', success: 'Success', noData: 'No data', ago: 'ago',
      just_now: 'just now', minute: 'minute', hour: 'hour', day: 'day',
      minutes: 'minutes', hours: 'hours', days: 'days'
    }
  },
  fr: {
    nav: {
      dashboard: 'Tableau de bord', projects: 'Projets', chat: 'Chat',
      tasks: 'Tâches', agent: 'Statut Agent', notes: 'Journal Dev',
      uploads: 'Fichiers', settings: 'Paramètres'
    },
    dashboard: {
      title: 'Tableau de bord', subtitle: 'Bon retour',
      totalProjects: 'Total Projets', activeProjects: 'Projets actifs',
      completedTasks: 'Tâches faites', queuedItems: 'En attente', totalNotes: 'Notes',
      activeProjectsTitle: 'Projets Actifs', queueTitle: 'File OpenClaw',
      activityTitle: 'Activité récente', noQueue: 'File vide',
      noProjects: 'Aucun projet actif', progress: 'progression'
    },
    tasks: {
      title: 'Tâches', subtitle: 'File de travail pour OpenClaw',
      new: 'Nouvelle tâche', newTitle: 'Nouvelle tâche pour OpenClaw',
      titleLabel: 'Titre de la tâche', descLabel: 'Description (optionnel)',
      priorityLabel: 'Priorité', projectLabel: 'Projet',
      general: 'Général', add: 'Ajouter à la file', cancel: 'Annuler',
      inProgress: '⚡ En cours', queue: '📋 File d\'attente', done: '✅ Terminées (10 dernières)',
      noQueue: 'Aucune tâche en attente', noQueueSub: 'Ajoute une tâche — je m\'en occupe',
      noDone: 'Aucune tâche terminée', clearDone: 'Effacer',
      titleRequired: 'Titre requis',
      taskAdded: 'Tâche ajoutée à la file', taskDone: 'Tâche marquée terminée',
      taskDeleted: 'Tâche supprimée', doneCleared: 'Tâches terminées effacées',
      high: '🔴 Haute', medium: '🟡 Moyenne', low: '🟢 Basse',
      working: 'OpenClaw travaille'
    },
    chat: {
      title: 'Chat', subtitle: 'Ligne directe — contourne Discord',
      online: 'Agent en ligne', offline: 'Agent hors ligne',
      offlineMsg: 'OpenClaw est hors ligne. Démarre le gateway depuis Statut Agent pour chatter.',
      clear: 'Effacer', placeholder: 'Écris une commande… (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)',
      you: 'Toi', agent: '🤖 OpenClaw',
      attachFile: 'Joindre un fichier',
      fileAttached: 'fichier joint',
      sending: 'Envoi…'
    },
    agent: {
      title: 'Statut Agent', subtitle: 'Tokens, sessions, logs en direct',
      refresh: 'Actualiser', gateway: 'Gateway', model: 'Modèle',
      tokensIn: 'Tokens Entrants', tokensOut: 'Tokens Sortants',
      cacheHit: 'Cache Hit', estCost: 'Coût estimé',
      skills: 'Skills installés', logs: 'Logs en direct',
      subagents: 'Sub-agents actifs', noSubagents: 'Aucun sub-agent actif',
      loadingLogs: 'Chargement des logs…', noLogs: 'Aucun log récent',
      control: 'Contrôles OpenClaw', start: 'Démarrer Gateway', stop: 'Arrêter Gateway',
      starting: 'Démarrage…', stopping: 'Arrêt…',
      calls: 'Appels Chat', uptime: 'Uptime',
      noTokens: 'Pas de données — envoie un message en Chat d\'abord',
      online: '🟢 En ligne', offline: '🔴 Hors ligne',
      min: 'min'
    },
    settings: {
      title: 'Paramètres',
      profile: 'Profil', profileSub: 'Ton nom et identifiant',
      name: 'Nom affiché', handle: 'Identifiant',
      appearance: 'Apparence', appearanceSub: 'Thème, couleurs, mise en page',
      theme: 'Thème', dark: '🌙 Sombre', light: '☀️ Clair',
      accent: 'Couleur d\'accent', current: 'Actuelle:',
      language: 'Langue', langSub: 'Langue de l\'interface',
      compact: 'Mode compact', compactSub: 'Marges et texte réduits',
      defaultPage: 'Page par défaut', defaultPageSub: 'Page affichée au démarrage',
      dateFormat: 'Format de date', dateRelative: 'Relatif (il y a 2 heures)',
      dateAbsolute: 'Absolu (2026-03-10 16:00)',
      autoRefresh: 'Actualisation auto', autoRefreshSub: 'Actualise le statut agent et le tableau de bord automatiquement',
      refreshInterval: 'Intervalle d\'actualisation', seconds: 'secondes',
      chat: 'Paramètres Chat', chatSub: 'Préférences du chat',
      chatUpload: 'Autoriser les fichiers joints dans le Chat',
      about: 'À propos', version: 'Mission Control v1.0.0', builtBy: 'Construit par OpenClaw pour Shadow',
      localData: 'Données stockées localement dans ./data/',
      save: 'Enregistrer', saved: 'Paramètres enregistrés'
    },
    common: {
      edit: 'Modifier', delete: 'Supprimer', save: 'Enregistrer', cancel: 'Annuler',
      create: 'Créer', add: 'Ajouter', search: 'Rechercher…', filter: 'Filtrer',
      all: 'Tous', active: 'Actif', paused: 'Pausé', complete: 'Terminé',
      todo: 'À faire', inProgress: 'En cours', done: 'Terminé',
      high: 'Haute', medium: 'Moyenne', low: 'Basse', loading: 'Chargement…',
      error: 'Erreur', success: 'Succès', noData: 'Aucune donnée', ago: 'il y a',
      just_now: 'à l\'instant', minute: 'minute', hour: 'heure', day: 'jour',
      minutes: 'minutes', hours: 'heures', days: 'jours'
    }
  }
};

let _lang = 'en';

function t(section, key) {
  return LANG[_lang]?.[section]?.[key] || LANG['en']?.[section]?.[key] || key;
}

function setLang(lang) {
  if (!LANG[lang]) return;
  _lang = lang;
  // Update nav labels
  document.querySelectorAll('[data-page]').forEach(el => {
    const page = el.getAttribute('data-page');
    const label = el.querySelector('span');
    if (label && LANG[_lang].nav[page]) label.textContent = LANG[_lang].nav[page];
  });
}

function initLang(settings) {
  _lang = settings?.language || 'en';
  setLang(_lang);
}
