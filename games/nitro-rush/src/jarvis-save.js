/* Persistência exclusiva do Nitro Rush: IndexedDB + cópia no disco do JARVIS. */
(() => {
  const keyPattern = /^(nitroRush3D\.save\.v[123]|nitroRush3D\.ghost\.[a-z0-9_-]+)$/;
  const endpoint = '/api/games/nitro-rush/progress';
  const cacheKey = 'jarvis.nitro.snapshot';
  let latest = null, pending = null, timer = null, writing = Promise.resolve();
  const label = document.createElement('div');
  label.setAttribute('role', 'status');
  label.style.cssText = 'position:fixed;bottom:6px;left:8px;z-index:9999;color:#b8c4cc;background:#080b10b8;padding:3px 8px;border-radius:6px;font:11px sans-serif;pointer-events:none';
  document.body.append(label);
  const status = text => { label.textContent = text; };
  const openDB = () => new Promise((resolve, reject) => {
    const request = indexedDB.open('jarvis_games', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('progress');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  async function database(value) {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('progress', value ? 'readwrite' : 'readonly');
        const request = value ? tx.objectStore('progress').put(value, 'nitro-rush') : tx.objectStore('progress').get('nitro-rush');
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  }
  const valid = s => s && Number.isSafeInteger(s.updatedAt) && s.entries && Object.entries(s.entries).every(([k, v]) => keyPattern.test(k) && typeof v === 'string');
  async function init() {
    status('Restaurando progresso...');
    let cached;
    try { cached = JSON.parse(localStorage.getItem(cacheKey)); } catch {}
    const results = await Promise.allSettled([
      database(),
      fetch(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(5000) }).then(async r => { if (!r.ok) throw new Error(); return (await r.json()).snapshot; })
    ]);
    const candidates = [cached, ...results.filter(r => r.status === 'fulfilled').map(r => r.value)].filter(valid);
    latest = candidates.sort((a, b) => b.updatedAt - a.updatedAt)[0] || null;
    if (latest) {
      for (const key of Object.keys(localStorage)) if (keyPattern.test(key)) localStorage.removeItem(key);
      for (const [key, value] of Object.entries(latest.entries)) localStorage.setItem(key, value);
      localStorage.setItem(cacheKey, JSON.stringify(latest));
    }
    status(latest ? 'Progresso restaurado neste aparelho' : 'Progresso salvo automaticamente neste aparelho');
  }
  function commit() {
    const entries = {};
    for (const key of Object.keys(localStorage)) if (keyPattern.test(key)) entries[key] = localStorage.getItem(key);
    latest = { updatedAt: Math.max(Date.now(), (latest?.updatedAt || 0) + 1), entries };
    try { localStorage.setItem(cacheKey, JSON.stringify(latest)); } catch {}
    pending = latest;
    status('Salvando progresso...');
    clearTimeout(timer);
    timer = setTimeout(flush, 200);
  }
  function flush() {
    clearTimeout(timer);
    if (!pending) return writing;
    const snapshot = pending; pending = null;
    writing = writing.catch(() => {}).then(async () => {
      const results = await Promise.allSettled([
        database(snapshot),
        fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snapshot), keepalive: JSON.stringify(snapshot).length < 60000, signal: AbortSignal.timeout(8000) }).then(r => { if (!r.ok) throw new Error('Gravação recusada'); })
      ]);
      if (latest !== snapshot) return;
      const [db, disk] = results.map(r => r.status === 'fulfilled');
      status(disk ? 'Progresso salvo no JARVIS' : db ? 'Salvo neste aparelho · cópia em disco indisponível' : 'Falha ao salvar no banco · mantendo cópia local');
      if (!disk) pending = latest;
    });
    return writing;
  }
  addEventListener('pagehide', () => { void flush(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) void flush(); });
  setInterval(() => { if (pending) void flush(); }, 5000);
  window.JarvisNitroSave = { init, commit, flush };
})();
