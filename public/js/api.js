function getAuthToken() {
  return localStorage.getItem('mc_token') || '';
}

function authHeaders(extra) {
  return Object.assign({ 'Authorization': 'Bearer ' + getAuthToken() }, extra || {});
}

function logout() {
  localStorage.removeItem('mc_token');
  window.location.replace('/login.html');
}

const API = {
  async get(path) {
    const url = path.includes('?') ? `${path}&_t=${Date.now()}` : `${path}?_t=${Date.now()}`;
    const r = await fetch(url, { headers: authHeaders({ 'Cache-Control': 'no-cache' }) });
    if (r.status === 401) { logout(); return; }
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(path, { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
    if (r.status === 401) { logout(); return; }
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async put(path, body) {
    const r = await fetch(path, { method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
    if (r.status === 401) { logout(); return; }
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async del(path) {
    const r = await fetch(path, { method: 'DELETE', headers: authHeaders() });
    if (r.status === 401) { logout(); return; }
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  projects: {
    list:   ()         => API.get('/api/projects'),
    get:    (id)       => API.get(`/api/projects/${id}`),
    create: (data)     => API.post('/api/projects', data),
    update: (id, data) => API.put(`/api/projects/${id}`, data),
    delete: (id)       => API.del(`/api/projects/${id}`),
    addTask:    (id, data)         => API.post(`/api/projects/${id}/tasks`, data),
    updateTask: (id, tid, data)    => API.put(`/api/projects/${id}/tasks/${tid}`, data),
    deleteTask: (id, tid)          => API.del(`/api/projects/${id}/tasks/${tid}`),
  },
  notes: {
    list:   ()         => API.get('/api/notes'),
    create: (data)     => API.post('/api/notes', data),
    update: (id, data) => API.put(`/api/notes/${id}`, data),
    delete: (id)       => API.del(`/api/notes/${id}`),
  },
  queue: {
    list:   ()         => API.get('/api/queue'),
    create: (data)     => API.post('/api/queue', data),
    update: (id, data) => API.put(`/api/queue/${id}`, data),
    delete: (id)       => API.del(`/api/queue/${id}`),
  },
  stats:    ()         => API.get('/api/stats'),
  settings: {
    get:    ()     => API.get('/api/settings'),
    update: (data) => API.put('/api/settings', data),
  },
};
