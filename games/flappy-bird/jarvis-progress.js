/* Ponte local exclusiva do iframe: restaura antes do boot, salva sem depender da porta. */
(() => {
  const id = document.currentScript.dataset.game;
  const configs = {
    'battle-royale': ['br3d_binds', 'br3d_vol', 'br3d_stats'],
    tetris: ['tetris_bestScores', 'tetris_musicEnabled', 'tetris_sfxEnabled', 'tetris_volume'],
    'flappy-bird': ['fb_coins', 'fb_owned', 'fb_skin', 'fb_best'],
    agario: ['agario_best', 'agario_best_date'],
    minecraft: ['mc_vol_music', 'mc_vol_sfx', 'jarvis_mc_world']
  };
  const keys = new Set(configs[id] || []), endpoint = '/api/games/progress/' + id;
  const cacheKey = 'jarvis.games.' + id;
  const get = Storage.prototype.getItem, set = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
  let latest = { updatedAt: 0, entries: {} }, pending, timer, capture, writing = Promise.resolve();
  const label = document.createElement('div');
  label.setAttribute('role', 'status');
  label.style.cssText = 'position:fixed;bottom:4px;left:6px;z-index:99999;color:#b8c4cc;background:#080b10c0;padding:3px 8px;border-radius:6px;font:11px sans-serif;pointer-events:none';
  document.body.append(label);
  const status = text => { label.textContent = text; };
  const valid = s => s && Number.isSafeInteger(s.updatedAt) && s.entries && Object.entries(s.entries).every(([k,v]) => keys.has(k) && typeof v === 'string');
  async function database(value) {
    const db = await new Promise((resolve, reject) => {
      const r = indexedDB.open('jarvis_games', 1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('progress')) r.result.createObjectStore('progress'); };
      r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('progress', value ? 'readwrite' : 'readonly');
        const r = value ? tx.objectStore('progress').put(value, id) : tx.objectStore('progress').get(id);
        tx.oncomplete = () => resolve(r.result); tx.onerror = tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  }
  function changed() {
    latest = { updatedAt: Math.max(Date.now(), latest.updatedAt + 1), entries: { ...latest.entries } };
    try { set.call(localStorage, cacheKey, JSON.stringify(latest)); } catch {}
    pending = latest; status('Salvando progresso...');
    clearTimeout(timer); timer = setTimeout(() => void flush(false), 200);
  }
  function flush(captureNow = true) {
    if (captureNow && capture) capture();
    clearTimeout(timer);
    if (!pending) return writing;
    const snapshot = pending; pending = null;
    writing = writing.catch(() => {}).then(async () => {
      const body = JSON.stringify(snapshot);
      const results = await Promise.allSettled([
        database(snapshot),
        fetch(endpoint, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body, keepalive: body.length < 60000, signal: AbortSignal.timeout(8000) }).then(r => { if (!r.ok) throw new Error('Gravação recusada.'); })
      ]);
      if (latest !== snapshot) return;
      const [db, disk] = results.map(r => r.status === 'fulfilled');
      status(disk ? 'Progresso salvo no JARVIS' : db ? 'Salvo neste aparelho · cópia em disco indisponível' : 'Falha ao salvar no banco · mantendo cópia local');
      if (!disk) pending = latest;
    });
    return writing;
  }
  const ready = (async () => {
    status('Restaurando progresso...');
    let cached;
    try { cached = JSON.parse(get.call(localStorage, cacheKey)); } catch {}
    const results = await Promise.allSettled([database(), fetch(endpoint, { cache:'no-store', signal:AbortSignal.timeout(5000) }).then(async r => { if (!r.ok) throw new Error(); return (await r.json()).snapshot; })]);
    const candidates = [cached, ...results.filter(r => r.status === 'fulfilled').map(r => r.value)].filter(valid);
    if (candidates.length) latest = candidates.sort((a,b) => b.updatedAt - a.updatedAt)[0];
    else for (const key of keys) { const value = get.call(localStorage, key); if (value !== null) latest.entries[key] = value; }
    // Intercepta somente as chaves deste jogo, dentro deste iframe, preservando o restante do JARVIS.
    Storage.prototype.getItem = function(key) { return this === localStorage && keys.has(String(key)) ? latest.entries[key] ?? null : get.call(this, key); };
    Storage.prototype.setItem = function(key, value) {
      if (this !== localStorage || !keys.has(String(key))) return set.call(this, key, value);
      const raw = String(value); if (latest.entries[key] === raw) return;
      latest.entries[key] = raw;
      try { set.call(this, key, raw); } catch {}
      changed();
    };
    Storage.prototype.removeItem = function(key) {
      if (this !== localStorage || !keys.has(String(key))) return remove.call(this, key);
      delete latest.entries[key]; try { remove.call(this, key); } catch {} changed();
    };
    status(latest.updatedAt ? 'Progresso restaurado neste aparelho' : 'Salvamento automático neste aparelho');
  })();
  async function load(scripts) {
    try {
      await ready;
      for (const src of scripts) await new Promise((resolve, reject) => {
        const script = document.createElement('script'); script.src = src; script.onload = resolve; script.onerror = reject; document.body.append(script);
      });
      window.__jarvisGameReady = true;
    } catch { status('Não foi possível abrir o jogo. Volte ao catálogo e tente novamente.'); }
  }
  window.JarvisGameProgress = { ready, flush, load, registerCapture(fn) { capture = fn; } };
  addEventListener('pagehide', () => { void flush(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) void flush(); });
  setInterval(() => { if (pending) void flush(false); }, 5000);
})();
