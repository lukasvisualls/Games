// menu.js — menu inicial: jogar, configurar teclas e volume (salvos no navegador)

(function () {
  const menuEl = document.getElementById('menu');
  const bindList = document.getElementById('bindList');
  const volMenu = document.getElementById('volMenu');
  const volInv = document.getElementById('volInv');
  const playBtn = document.getElementById('playBtn');
  const menuBtn = document.getElementById('menuBtn');

  const BIND_DEFS = [
    { act: 'jump',    label: '🦘 Pular' },
    { act: 'crouch',  label: '🧎 Agachar' },
    { act: 'wall',    label: '🧱 Parede' },
    { act: 'ramp',    label: '📐 Rampa' },
    { act: 'floor',   label: '⬜ Chão/Piso' },
    { act: 'pyramid', label: '🔺 Pirâmide' },
    { act: 'pickaxe', label: '⛏️ Picareta' },
    { act: 'map',     label: '🗺️ Mapa' },
  ];

  window.captureBind = null;

  // carrega configurações salvas
  try {
    const saved = JSON.parse(localStorage.getItem('br3d_binds') || 'null');
    if (saved) Object.assign(binds, saved);
  } catch (e) { /* ignora config corrompida */ }
  let vol = parseFloat(localStorage.getItem('br3d_vol'));
  if (isNaN(vol)) vol = 0.7;
  volMenu.value = Math.round(vol * 100);
  if (volInv) volInv.value = Math.round(vol * 100);
  AudioSys.setVolume(vol);

  function saveBinds() {
    localStorage.setItem('br3d_binds', JSON.stringify(binds));
  }

  function renderBinds() {
    bindList.innerHTML = '';
    for (const def of BIND_DEFS) {
      const row = document.createElement('div');
      row.className = 'bindRow';
      const label = document.createElement('span');
      label.textContent = def.label;
      const btn = document.createElement('button');
      btn.className = 'bindBtn';
      btn.textContent = window.captureBind === def.act ? 'pressione...' : keyName(binds[def.act]);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.captureBind = def.act;
        renderBinds();
      });
      row.appendChild(label);
      row.appendChild(btn);
      bindList.appendChild(row);
    }
  }
  renderBinds();

  // captura da próxima tecla / botão do mouse
  window.addEventListener('keydown', (e) => {
    if (!window.captureBind) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.code !== 'Escape') {
      binds[window.captureBind] = e.code;
      saveBinds();
    }
    window.captureBind = null;
    renderBinds();
  }, true);

  window.addEventListener('mousedown', (e) => {
    if (!window.captureBind) return;
    if (e.target.classList && e.target.classList.contains('bindBtn')) return;
    if (e.button === 0) return; // clique esquerdo é fixo (atirar)
    e.preventDefault();
    e.stopPropagation();
    binds[window.captureBind] = 'Mouse' + e.button;
    saveBinds();
    window.captureBind = null;
    renderBinds();
  }, true);

  // volume (menu e inventário sincronizados)
  function onVol(v) {
    const f = v / 100;
    AudioSys.setVolume(f);
    localStorage.setItem('br3d_vol', String(f));
    volMenu.value = v;
    if (volInv) volInv.value = v;
  }
  volMenu.addEventListener('input', () => onVol(+volMenu.value));
  if (volInv) volInv.addEventListener('input', () => onVol(+volInv.value));

  // música de lobby: navegador só permite áudio depois de uma interação,
  // então ela começa no primeiro clique/tecla dentro do menu
  function ensureLobbyMusic() {
    if (menuEl.classList.contains('hidden')) return;
    AudioSys.init();
    AudioSys.setVolume(parseFloat(localStorage.getItem('br3d_vol')) || 0.7);
    AudioSys.startLobbyMusic();
  }
  menuEl.addEventListener('pointerdown', ensureLobbyMusic);
  window.addEventListener('keydown', ensureLobbyMusic, { once: false });

  // jogar
  playBtn.addEventListener('click', () => {
    AudioSys.init();
    AudioSys.setVolume(parseFloat(localStorage.getItem('br3d_vol')) || 0.7);
    AudioSys.stopLobbyMusic();
    menuEl.classList.add('hidden');
    window.startMatch();
    canvas.tabIndex = 0; canvas.focus();
    try { canvas.requestPointerLock()?.catch(() => {}); } catch {}
  });

  // voltar ao menu (na tela de vitória/derrota)
  if (menuBtn) {
    menuBtn.addEventListener('click', () => window.quitToMenu());
  }
})();
