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
      title: 'Settings', sub: 'Saved to Supabase — synced across devices',
      profile: 'Profile', profileSub: 'Your display name and handle',
      name: 'Display Name', handle: 'GitHub Handle',
      saveProfile: 'Save Profile',
      appearance: 'Appearance', appearanceSub: 'Theme, accent, density, font size',
      theme: 'Theme', dark: '🌙 Dark', light: '☀️ Light',
      accent: 'Accent Color', accentSub: 'Applied instantly',
      fontSize: 'Font Size', fontSmall: 'Small', fontDefault: 'Default', fontLarge: 'Large',
      compact: 'Compact Mode', compactSub: 'Tighter padding and smaller text',
      language: 'Language', langSub: 'Interface language',
      defaultPage: 'Default Page', defaultPageSub: 'Page shown on startup',
      sidebarCollapsed: 'Sidebar closed on startup', sidebarCollapsedSub: 'You can always open it manually',
      dateFormat: 'Date Format', dateRelative: 'Relative', dateAbsolute: 'Absolute',
      dateRelativeSub: '"2 hours ago"', dateAbsoluteSub: '"Mar 12 2026"',
      autoRefresh: 'Auto-Refresh', autoRefreshSub: 'Reload data automatically',
      refreshInterval: 'Interval',
      chat: 'Chat & Agent', chatSub: 'AI chat options and token budget',
      chatUpload: 'File attachments in Chat', chatUploadSub: 'Send images and PDFs',
      tokenBudget: '🔋 Token budget / day', tokenBudgetSub: 'Used to calculate % in Agent Status. Adjust for your Anthropic plan.',
      queueControl: 'Queue Control', queueControlSub: 'Auto-dispatch and polling interval',
      queueEnabled: 'Auto-dispatch', queueEnabledSub: 'OpenClaw picks up tasks automatically',
      queueInterval: 'Check interval', queueIntervalSub: 'How often the queue is polled',
      notifications: 'Notifications', notificationsSub: 'Browser alerts for task events',
      notifyTask: 'Task completed alerts', notifyTaskSub: 'Notify when OpenClaw finishes a queued task',
      notifyGrant: 'Grant permission',
      data: 'Data', dataSub: 'Supabase · Synced to cloud',
      exportSettings: 'Export settings', exportSub: 'Downloadable JSON — config backup',
      importSettings: 'Import settings', importSub: 'Restore from a JSON backup',
      about: 'About', version: 'Mission Control v2.0', builtBy: 'Built by Shadow',
      stack: 'Stack: Node.js · Express · Supabase · Vanilla JS',
      hosting: 'Hosting: Vercel (cloud) + local (Node)',
      connected: '● Connected to Supabase — settings synced',
      save: 'Save', saved: '✓ Saved'
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
      title: 'Paramètres', sub: 'Sauvegardé sur Supabase — sync sur tous tes appareils',
      profile: 'Profil', profileSub: 'Ton nom affiché et identifiant',
      name: 'Nom affiché', handle: 'Handle GitHub',
      saveProfile: 'Sauvegarder le profil',
      appearance: 'Apparence', appearanceSub: 'Thème, accent, densité, taille de police',
      theme: 'Thème', dark: '🌙 Sombre', light: '☀️ Clair',
      accent: 'Couleur d\'accent', accentSub: 'Appliquée instantanément',
      fontSize: 'Taille de police', fontSmall: 'Petite', fontDefault: 'Normale', fontLarge: 'Grande',
      compact: 'Mode compact', compactSub: 'Marges réduites et texte plus petit',
      language: 'Langue', langSub: 'Langue de l\'interface',
      defaultPage: 'Page par défaut', defaultPageSub: 'Page affichée au démarrage',
      sidebarCollapsed: 'Sidebar fermée au démarrage', sidebarCollapsedSub: 'Tu peux toujours l\'ouvrir manuellement',
      dateFormat: 'Format des dates', dateRelative: 'Relatif', dateAbsolute: 'Absolu',
      dateRelativeSub: '"il y a 2 heures"', dateAbsoluteSub: '"12 mars 2026"',
      autoRefresh: 'Actualisation auto', autoRefreshSub: 'Recharge les données automatiquement',
      refreshInterval: 'Intervalle',
      chat: 'Chat & Agent', chatSub: 'Options du chat AI et budget tokens',
      chatUpload: 'Fichiers joints dans le Chat', chatUploadSub: 'Permet d\'envoyer des images et PDFs',
      tokenBudget: '🔋 Budget tokens / jour', tokenBudgetSub: 'Utilisé pour calculer le % dans Agent Status. Ajuste selon ton plan Anthropic.',
      queueControl: 'Contrôle de la file', queueControlSub: 'Auto-dispatch et intervalle de vérification',
      queueEnabled: 'Auto-dispatch', queueEnabledSub: 'OpenClaw prend les tâches automatiquement',
      queueInterval: 'Intervalle de vérification', queueIntervalSub: 'Fréquence de polling de la file',
      notifications: 'Notifications', notificationsSub: 'Alertes navigateur pour les événements de tâches',
      notifyTask: 'Alertes tâche terminée', notifyTaskSub: 'Notifier quand OpenClaw finit une tâche',
      notifyGrant: 'Autoriser les notifications',
      data: 'Données', dataSub: 'Supabase · Synchronisé en cloud',
      exportSettings: 'Exporter les settings', exportSub: 'JSON téléchargeable — backup de ta config',
      importSettings: 'Importer les settings', importSub: 'Restaurer depuis un backup JSON',
      about: 'À propos', version: 'Mission Control v2.0', builtBy: 'Construit par Shadow',
      stack: 'Stack : Node.js · Express · Supabase · Vanilla JS',
      hosting: 'Hébergement : Vercel (cloud) + local (Node)',
      connected: '● Connecté à Supabase — settings synced',
      save: 'Enregistrer', saved: '✓ Sauvegardé'
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
