// game.js — loop principal: cena, câmera, entrada (teclas configuráveis), ônibus,
// projéteis, picareta/farm, inventário, HUD, minimapa e fim de jogo

const canvas = document.getElementById('game');
let friendBattle = null;

if (typeof THREE === 'undefined') {
  document.getElementById('overlay').classList.remove('hidden');
  document.getElementById('overlayTitle').textContent = '⚠️ Erro';
  document.getElementById('overlaySub').textContent =
    'Não foi possível carregar o Three.js. Verifique sua conexão com a internet e recarregue.';
  throw new Error('THREE não carregado');
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding=THREE.sRGBEncoding;

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 6500);
const UP = new THREE.Vector3(0, 1, 0);

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------- utilidades ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function forwardVec(yaw, pitch) {
  return new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch)
  );
}

function applySpread(dir, spread) {
  dir.x += (Math.random() - 0.5) * 2 * spread;
  dir.y += (Math.random() - 0.5) * 2 * spread;
  dir.z += (Math.random() - 0.5) * 2 * spread;
  dir.normalize();
}

// mira precisa: caminha pelo raio da câmera até bater em terreno, construção,
// prédio ou inimigo — o tiro sai do cano APONTANDO para esse ponto exato
function aimRaycast() {
  const f = forwardVec(game.camYaw, game.camPitch);
  const p = camera.position.clone();
  const step = f.clone().multiplyScalar(0.6);
  for (let i = 0; i < 420; i++) {
    p.add(step);
    if (p.y <= (activeMapId==='serra'?arenaBaseHeight(p.x,p.z):terrainHeight(p.x,p.z)) || BattleAssets.solidAt(p.x,p.z,p.y)) return p;
    for (const st of game.build.structures) {
      if (st.hitTest(p.x, p.y, p.z)) return p;
    }
    for (const a of game.worldColliders) {
      if (p.y <= a.top && (!Number.isFinite(a.bottom)||p.y>=a.bottom) && p.x >= a.minX && p.x <= a.maxX && p.z >= a.minZ && p.z <= a.maxZ) return p;
    }
    for (const e of livingEntities()) {
      if (e === game.player) continue;
      const dh = Math.hypot(e.pos.x - p.x, e.pos.z - p.z);
      if (dh < e.radius + 0.3 && p.y >= e.pos.y && p.y <= e.pos.y + e.height) return p;
    }
  }
  return p;
}

// ---------- teclas configuráveis (menu.js carrega/salva) ----------
const binds = {
  jump: 'Space',
  crouch: 'ShiftLeft',
  wall: 'KeyQ',
  ramp: 'Mouse3',   // botão lateral 1
  floor: 'Mouse4',  // botão lateral 2
  pyramid: 'KeyC',
  pickaxe: 'KeyG',  // sacar a picareta
  map: 'KeyM',      // abrir o mapa grande
};

// ---------- entrada ----------
const input = {
  keys: {},
  mouseDown: false,
  buildQueued: null,
  interactQueued: false,
  slotQueued: -1,
  jumpQueued: false,
  pickaxeQueued: false,
};
let invOpen = false;
let bigMapOpen = false;

function handleBindPress(code) {
  if (code === binds.jump) input.jumpQueued = true;
  if (code === binds.wall) input.buildQueued = 'wall';
  if (code === binds.ramp) input.buildQueued = 'ramp';
  if (code === binds.floor) input.buildQueued = 'floor';
  if (code === binds.pyramid) input.buildQueued = 'pyramid';
  if (code === binds.pickaxe) input.pickaxeQueued = true;
  if (code === binds.map) toggleBigMap();
}

function toggleBigMap() {
  if (!game) return;
  bigMapOpen = !bigMapOpen;
  el.bigMap.classList.toggle('hidden', !bigMapOpen);
}

window.addEventListener('keydown', (e) => {
  if (window.captureBind) return; // menu está capturando uma tecla
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
  if (!game) return;
  input.keys[e.code] = true;
  if (!e.repeat) handleBindPress(e.code);
  if (e.code === 'KeyE' && !e.repeat) input.interactQueued = true;
  if (e.code === 'Digit1') input.slotQueued = 0;
  if (e.code === 'Digit2') input.slotQueued = 1;
  if (e.code === 'Digit3') input.slotQueued = 2;
  if (e.code === 'Digit4') input.slotQueued = 3;
  if (e.code === 'Digit5') input.slotQueued = 4;
  if (e.code === 'Tab' && !e.repeat) toggleInventory();
  if (e.code === 'KeyR' && !e.repeat && !invOpen) startMatch();
});
window.addEventListener('keyup', (e) => {
  input.keys[e.code] = false;
});
window.addEventListener('blur', () => {
  input.keys = {};
  input.mouseDown = false;
});

canvas.addEventListener('mousedown', (e) => {
  canvas.tabIndex = 0;
  canvas.focus();
  if (!game || invOpen) return;
  if (document.pointerLockElement !== canvas) {
    try { canvas.requestPointerLock()?.catch(() => {}); } catch {}
  }
  if (e.button === 0) input.mouseDown = true;
  else {
    const code = 'Mouse' + e.button;
    input.keys[code] = true;
    handleBindPress(code);
  }
  if (e.button === 3 || e.button === 4) e.preventDefault();
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 0) input.mouseDown = false;
  else input.keys['Mouse' + e.button] = false;
});
window.addEventListener('contextmenu', (e) => e.preventDefault());
// impede voltar/avançar página com os botões laterais do mouse
window.addEventListener('auxclick', (e) => e.preventDefault());

// mouse na MESMA direção da câmera (não invertido):
// mouse p/ direita gira a câmera p/ direita
document.addEventListener('mousemove', (e) => {
  if (!game || invOpen || document.pointerLockElement !== canvas) return;
  game.camYaw -= e.movementX * 0.0026;
  game.camPitch = clamp(game.camPitch - e.movementY * 0.0026, -1.15, 1.3);
});
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas;
  document.getElementById('lockHint').classList.toggle('hidden', locked || !game || invOpen);
});

// ---------- HUD (elementos do DOM) ----------
const el = {
  zoneStatus: document.getElementById('zoneStatus'),
  playersCount: document.getElementById('playersCount'),
  killfeed: document.getElementById('killfeed'),
  healthFill: document.getElementById('healthFill'),
  healthText: document.getElementById('healthText'),
  shieldFill: document.getElementById('shieldFill'),
  shieldText: document.getElementById('shieldText'),
  bigMap: document.getElementById('bigMap'),
  matWood: document.getElementById('matWood'),
  matStone: document.getElementById('matStone'),
  matMetal: document.getElementById('matMetal'),
  vignette: document.getElementById('vignette'),
  overlay: document.getElementById('overlay'),
  overlayTitle: document.getElementById('overlayTitle'),
  overlaySub: document.getElementById('overlaySub'),
  interactPrompt: document.getElementById('interactPrompt'),
  airPrompt: document.getElementById('airPrompt'),
  crosshair: document.getElementById('crosshair'),
  healBar: document.getElementById('healBar'),
  healFill: document.getElementById('healFill'),
  inventory: document.getElementById('inventory'),
  invSlots: document.getElementById('invSlots'),
  slots: [0, 1, 2, 3, 4].map((i) => document.getElementById('slot' + i)),
};
const minimapCtx = document.getElementById('minimap').getContext('2d');
const bigMapCtx = document.getElementById('bigMapCanvas').getContext('2d');

// ---------- estado do jogo ----------
let game = null;
const MAT_MAX = 300;

function addMaterial(mat, n) {
  game.materials[mat] = Math.min(MAT_MAX, game.materials[mat] + n);
}

function disposeScene(scene) {
  scene.traverse((obj) => {
    if (obj.geometry&&!obj.userData.sharedBattleGeometry) obj.geometry.dispose();
    if(obj.isSkinnedMesh)obj.skeleton.dispose();
    if (obj.material&&!obj.userData.sharedBattleMaterial) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) m.dispose();
    }
  });
}

// ---------- ônibus de batalha ----------
function makeBus(scene) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(9, 3.2, 3.8),
    new THREE.MeshLambertMaterial({ color: 0x3a6ed0 })
  );
  group.add(body);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(9.05, 0.7, 3.85), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  stripe.position.y = 0.4;
  group.add(stripe);
  const balloon = new THREE.Mesh(
    new THREE.SphereGeometry(5.5, 14, 10),
    new THREE.MeshLambertMaterial({ color: 0x8a4ddb })
  );
  balloon.position.y = 11;
  group.add(balloon);
  const ropeMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  for (const rx of [-3, 3]) {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.5, 4), ropeMat);
    rope.position.set(rx, 4.4, 0);
    group.add(rope);
  }
  scene.add(group);

  // rota: atravessa o mapa em linha reta numa direção aleatória
  const ang = Math.random() * Math.PI * 2;
  const dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
  const offset = (Math.random() - 0.5) * 160;
  const altitude=activeMapId==='classic'?110:300;
  const start = new THREE.Vector3(-dir.x * (HALF_WORLD + 50) - dir.z * offset, altitude, -dir.z * (HALF_WORLD + 50) + dir.x * offset);
  group.position.copy(start);
  group.rotation.y = Math.atan2(dir.x, dir.z);

  return { group, start, dir, speed: 40*WORLD_SIZE/800, t: 0, len: (HALF_WORLD + 50) * 2, done: false };
}

function updateBus(dt) {
  const bus = game.bus;
  if (bus.done) return;
  bus.t += dt;
  const dist = bus.speed * bus.t;
  bus.group.position.copy(bus.start).addScaledVector(bus.dir, dist);

  // bots pulam nos seus momentos
  for (const b of game.bots) {
    if (b.phase === 'bus' && dist >= b.dropT * bus.len) b.startAir(bus.group.position);
  }
  // fim da rota: quem não pulou é obrigado a pular
  if (dist >= bus.len) {
    if (game.player.phase === 'bus') game.player.startFreefall();
    for (const b of game.bots) if (b.phase === 'bus') b.startAir(bus.group.position);
    bus.done = true;
    game.scene.remove(bus.group);
  }
}

// ---------- início de partida ----------
function startMatch(options={}) {
  if(friendBattle)return;
  if (game) disposeScene(game.scene);
  const preferences=battlePreferences();selectBattleMap(options.mapId||preferences.mapId);
  el.overlay.classList.add('hidden');

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x9fd6f2, activeMapId==='classic'?260:900, activeMapId==='classic'?780:4600);
  renderer.setClearColor(0x9fd6f2);

  scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x4a7d3a, activeMapId==='classic'?.85:.65));
  const sun = new THREE.DirectionalLight(0xffffff, activeMapId==='classic'?.9:.65);
  sun.position.set(100, 180, 80);
  scene.add(sun);

  game = {
    scene,
    camYaw: 0,
    camPitch: -0.1,
    build: null,
    zone: null,
    player: null,
    bots: [],
    bus: null,
    projectiles: [],
    particles: [],
    pickups: [],
    chests: [],
    killfeed: [],
    killfeedDirty: true,
    victory: false,
    playerPlacement: 0,
    worldColliders: [],
    harvestables: [],
    frameColliders: [],
    interactTarget: null,
    materials: { wood: 0, stone: 0, metal: 0 },
  };

  const world = buildWorld(scene);
  game.mapId=activeMapId;game.world=world;
  if(activeMapId!=='classic')game.mapCanvas=buildBattleMapTexture();
  game.worldColliders = world.colliders;
  game.harvestables = world.harvestables;
  game.zone = new Zone(scene);
  game.build = new BuildSystem(scene);

  game.bus = makeBus(scene);
  game.player = new Player(scene, game.bus.group.position.x, game.bus.group.position.y - 3.2, game.bus.group.position.z,options.characterId||preferences.characterId);
  game.camYaw = game.bus.group.rotation.y + Math.PI; // olhando para trás do ônibus

  for (let i = 0; i < BATTLE_BOTS; i++) {
    game.bots.push(new Bot(scene, i, 0.10 + i/BATTLE_BOTS*.78 + Math.random()*.01));
  }
  game.botLOD=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.35,1.4,3,5),new THREE.MeshLambertMaterial({color:0xffffff}),BATTLE_BOTS);game.botLOD.frustumCulled=false;
  const empty=new THREE.Matrix4().makeScale(0,0,0);game.bots.forEach((b,i)=>{game.botLOD.setColorAt(i,new THREE.Color(b.colorHex));game.botLOD.setMatrixAt(i,empty);});scene.add(game.botLOD);

  for (const s of world.chestSpots) game.chests.push(new Chest(scene, s.x, s.z));
  for (const s of world.lootSpots) spawnPickup(game, s.x, s.z, randomLootItem(0));

  if (invOpen) toggleInventory();
  bigMapOpen = false;
  el.bigMap.classList.add('hidden');
}

// expõe para o menu
window.startMatch = startMatch;
window.quitToMenu = function () {
  if (game) {
    disposeScene(game.scene);
    game = null;
  }
  document.exitPointerLock();
  el.overlay.classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
  document.getElementById('lockHint').classList.add('hidden');
  AudioSys.startLobbyMusic();
};

function livingEntities() {
  const arr = [];
  for(const p of friendBattle?.humans||[game.player])if(p.alive)arr.push(p);
  for (const b of game.bots) if (b.alive) arr.push(b);
  return arr;
}

// ---------- picareta / farm de materiais ----------
function doPickaxeHit(pl) {
  const yaw = game.camYaw;
  const hx = pl.pos.x + Math.sin(yaw) * 2.2;
  const hz = pl.pos.z + Math.cos(yaw) * 2.2;
  const hy = pl.pos.y + 1.2;

  // acerta inimigos de perto
  for (const e of livingEntities()) {
    if (e === pl) continue;
    if (Math.hypot(e.pos.x - hx, e.pos.z - hz) < e.radius + 1.2 && Math.abs(e.pos.y + 1 - hy) < 2.5) {
      damageEntity(e, 20, pl);
      AudioSys.play('hitFlesh');
      return;
    }
  }

  // estruturas construídas (quebrar devolve um pouco do material)
  for (const s of game.build.structures) {
    if (circleRectOverlapXZ(hx, hz, 1.2, s.aabb) && hy >= s.baseY - 1.5 && hy <= s.aabb.top + 1.5) {
      game.build.damageStructure(s, 50);
      addMaterial(s.mat, 5);
      spawnParticles(hx, hy, hz, matColor(s.mat), 5, 5);
      AudioSys.play('hit');
      return;
    }
  }

  // objetos do mundo: árvores/pedras/carros/prédios
  for (const h of game.harvestables) {
    let hit = false;
    if (h.aabb) {
      hit = circleRectOverlapXZ(hx, hz, 1.4, h.aabb);
    } else {
      hit = Math.hypot(h.x - hx, h.z - hz) < h.r + 1.4;
    }
    if (!hit) continue;

    h.hp -= 50;
    addMaterial(h.material, h.yield);
    spawnParticles(hx, hy, hz, matColor(h.material), 6, 5);
    AudioSys.play('hit');
    if (h.hp <= 0) destroyHarvestable(h);
    return;
  }

  AudioSys.play('swing');
}

function matColor(mat) {
  return mat === 'wood' ? 0x9a6632 : mat === 'stone' ? 0x9a9da3 : 0xb8c4d0;
}

function destroyHarvestable(h) {
  h.onDestroy?.();
  for (const m of h.meshes) game.scene.remove(m);
  if (h.collider) {
    const i = game.worldColliders.indexOf(h.collider);
    if (i >= 0) game.worldColliders.splice(i, 1);
  }
  const j = game.harvestables.indexOf(h);
  if (j >= 0) game.harvestables.splice(j, 1);
  const cx = h.aabb ? (h.aabb.minX + h.aabb.maxX) / 2 : h.x;
  const cz = h.aabb ? (h.aabb.minZ + h.aabb.maxZ) / 2 : h.z;
  spawnParticles(cx, h.cy || terrainHeight(cx, cz) + 1, cz, matColor(h.material), 16, 9);
  AudioSys.play('break');
}

// ---------- projéteis ----------
const _projGeo = new THREE.SphereGeometry(0.12, 6, 6);
const _projMats = {};
function projMat(colorHex) {
  if (!_projMats[colorHex]) {
    _projMats[colorHex] = new THREE.MeshBasicMaterial({ color: colorHex });
  }
  return _projMats[colorHex];
}

function spawnProjectile(owner, muzzle, dir, weapon) {
  const mesh = new THREE.Mesh(_projGeo, projMat(weapon.colorHex));
  mesh.position.copy(muzzle);
  game.scene.add(mesh);
  game.projectiles.push({
    mesh,
    vel: dir.clone().multiplyScalar(weapon.speed),
    damage: weapon.damage,
    owner,
    life: weapon.life || 2,
  });
}

// dispara uma arma: escopeta solta vários balins, as outras 1 projétil.
// spreadMult < 1 deixa o tiro mais preciso (usado pelo jogador)
function fireWeapon(owner, muzzle, baseDir, weapon, spreadMult = 1) {
  const pellets = weapon.pellets || 1;
  const mult = pellets > 1 ? Math.max(spreadMult, 0.8) : spreadMult;
  for (let i = 0; i < pellets; i++) {
    const dir = baseDir.clone();
    applySpread(dir, weapon.spread * mult);
    spawnProjectile(owner, muzzle, dir, weapon);
  }
}

function updateProjectiles(dt) {
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const p = game.projectiles[i];
    p.life -= dt;
    let dead = p.life <= 0;

    const steps = Math.max(1, Math.ceil((p.vel.length() * dt) / 1));
    const stepV = p.vel.clone().multiplyScalar(dt / steps);

    for (let s = 0; s < steps && !dead; s++) {
      p.mesh.position.add(stepV);
      const px = p.mesh.position.x;
      const py = p.mesh.position.y;
      const pz = p.mesh.position.z;

      if (Math.abs(px) > HALF_WORLD || Math.abs(pz) > HALF_WORLD || py <= (activeMapId==='serra'?arenaBaseHeight(px,pz):terrainHeight(px, pz)) || BattleAssets.solidAt(px,pz,py)) {
        spawnParticles(px, py, pz, 0x7a6a4a, 4, 4);
        dead = true;
        break;
      }

      for (const st of game.build.structures) {
        if (st.hitTest(px, py, pz)) {
          game.build.damageStructure(st, p.damage * 1.5);
          spawnParticles(px, py, pz, matColor(st.mat), 5, 5);
          dead = true;
          break;
        }
      }
      if (dead) break;

      for (const a of game.worldColliders) {
        if (py <= a.top && (!Number.isFinite(a.bottom)||py>=a.bottom) && circleRectOverlapXZ(px, pz, 0.15, a)) {
          spawnParticles(px, py, pz, 0x999999, 4, 4);
          dead = true;
          break;
        }
      }
      if (dead) break;

      for (const e of livingEntities()) {
        if (e === p.owner) continue;
        const dh = Math.hypot(e.pos.x - px, e.pos.z - pz);
        if (dh < e.radius + 0.25 && py >= e.pos.y && py <= e.pos.y + e.height) {
          damageEntity(e, p.damage, p.owner);
          dead = true;
          break;
        }
      }
    }

    if (dead) {
      game.scene.remove(p.mesh);
      game.projectiles.splice(i, 1);
    }
  }

  game.build.removeDestroyed((s) => {
    const c = s.mesh.position;
    spawnParticles(c.x, c.y, c.z, matColor(s.mat), 14, 8);
    AudioSys.play('break');
  });
}

// ---------- dano e eliminações ----------
function jarvisShowBattleStats() {
  let stats;
  try { stats = JSON.parse(localStorage.getItem('br3d_stats') || '{}'); } catch { stats = {}; }
  document.getElementById('jarvisBattleStats').textContent = `${stats.matches || 0} partidas · ${stats.wins || 0} vitórias${stats.bestPlacement ? ' · melhor colocação: ' + stats.bestPlacement + 'º' : ''}`;
}
jarvisShowBattleStats();
function jarvisRecordBattle(won) {
  if (!game || game.jarvisRecorded) return;
  game.jarvisRecorded = true;
  let stats;
  try { stats = JSON.parse(localStorage.getItem('br3d_stats') || '{}'); } catch { stats = {}; }
  stats.matches = (stats.matches || 0) + 1;
  stats.wins = (stats.wins || 0) + (won ? 1 : 0);
  stats.bestPlacement = Math.min(stats.bestPlacement || 99, won ? 1 : game.playerPlacement);
  localStorage.setItem('br3d_stats', JSON.stringify(stats));
  jarvisShowBattleStats();
}
function damageEntity(ent, dmg, source, fx = true) {
  if (!ent.alive) return;
  if(friendBattle?.humans.includes(ent)&&friendBattle.humans.includes(source))return;
  // escudo azul absorve o dano primeiro (a tempestade ignora escudo)
  if (source !== 'storm' && (ent.shield || 0) > 0) {
    const absorbed = Math.min(ent.shield, dmg);
    ent.shield -= absorbed;
    dmg -= absorbed;
    if (fx) spawnParticles(ent.pos.x, ent.pos.y + 1.4, ent.pos.z, 0x3ac6ff, 4, 4);
  }
  ent.hp -= dmg;
  if (fx) {
    ent.flash = 0.12;
    spawnParticles(ent.pos.x, ent.pos.y + 1.2, ent.pos.z, 0xffffff, 4, 4);
    if (ent === game.player) AudioSys.play('hurt');
  }
  if (ent.hp <= 0) {
    ent.hp = 0;
    spawnParticles(ent.pos.x, ent.pos.y + 1, ent.pos.z, ent.colorHex || 0x3fa7ff, 20, 8);
    ent.die();
    addKillfeed(
      source === 'storm'
        ? `☠️ A tempestade eliminou ${ent.name}`
        : `⚔️ ${source.name} eliminou ${ent.name}`
    );
    if (ent === game.player) {
      game.playerPlacement = 1 + livingEntities().length;
      if(!ent.friendRemote)jarvisRecordBattle(false);
      AudioSys.play('lose');
    }
  }
}

// ---------- partículas ----------
const _partGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);

function spawnParticles(x, y, z, colorHex, n, power = 6) {
  if (game.particles.length > 280) return;
  for (let i = 0; i < n; i++) {
    const mesh = new THREE.Mesh(
      _partGeo,
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true })
    );
    mesh.position.set(x, y, z);
    const life = 0.35 + Math.random() * 0.3;
    game.particles.push({
      mesh,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * power,
        Math.random() * power * 0.8,
        (Math.random() - 0.5) * power
      ),
      life,
      maxLife: life,
    });
    game.scene.add(mesh);
  }
}

function updateParticles(dt) {
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.vel.y -= 18 * dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    p.life -= dt;
    const frac = Math.max(0, p.life / p.maxLife);
    p.mesh.material.opacity = frac;
    p.mesh.scale.setScalar(0.4 + frac);
    if (p.life <= 0) {
      game.scene.remove(p.mesh);
      p.mesh.material.dispose();
      game.particles.splice(i, 1);
    }
  }
}

// ---------- killfeed ----------
function addKillfeed(text) {
  game.killfeed.push({ text, t: 6 });
  if (game.killfeed.length > 5) game.killfeed.shift();
  game.killfeedDirty = true;
}

function updateKillfeed(dt) {
  const before = game.killfeed.length;
  for (const k of game.killfeed) k.t -= dt;
  game.killfeed = game.killfeed.filter((k) => k.t > 0);
  if (game.killfeed.length !== before) game.killfeedDirty = true;
}

function renderKillfeed() {
  if (game.killfeedDirty) {
    game.killfeedDirty = false;
    el.killfeed.innerHTML = '';
    for (const k of game.killfeed) {
      const div = document.createElement('div');
      div.className = 'kf';
      div.textContent = k.text;
      el.killfeed.appendChild(div);
    }
  }
  const kids = el.killfeed.children;
  for (let i = 0; i < kids.length; i++) {
    kids[i].style.opacity = clamp(game.killfeed[i] ? game.killfeed[i].t : 0, 0, 1);
  }
}

// ---------- interação (E) ----------
function updateInteraction() {
  const p = game.player;
  game.interactTarget = null;
  if (!p.alive || p.phase !== 'playing') {
    input.interactQueued = false;
    return;
  }

  let bestD = 3;
  for (const c of game.chests) {
    if (c.opened) continue;
    const d = Math.hypot(c.x - p.pos.x, c.z - p.pos.z);
    if (d < bestD) {
      bestD = d;
      game.interactTarget = { kind: 'chest', obj: c };
    }
  }
  for (const pk of game.pickups) {
    const d = Math.hypot(pk.x - p.pos.x, pk.z - p.pos.z);
    if (d < bestD) {
      bestD = d;
      game.interactTarget = { kind: 'pickup', obj: pk };
    }
  }

  if (input.interactQueued && game.interactTarget) {
    const t = game.interactTarget;
    if (t.kind === 'chest') {
      t.obj.open(game);
      spawnParticles(t.obj.x, terrainHeight(t.obj.x, t.obj.z) + 1, t.obj.z, 0xffd94a, 12, 5);
      AudioSys.play('chest');
    } else {
      p.pickupItem(t.obj.item);
      t.obj.remove(game.scene);
      game.pickups.splice(game.pickups.indexOf(t.obj), 1);
      AudioSys.play('pickup');
    }
    game.interactTarget = null;
  }
  input.interactQueued = false;
}

// ---------- inventário (TAB) ----------
function toggleInventory() {
  if (!game) return;
  invOpen = !invOpen;
  el.inventory.classList.toggle('hidden', !invOpen);
  if (invOpen) {
    input.mouseDown = false;
    document.exitPointerLock();
    renderInventory();
  } else {
    canvas.requestPointerLock();
  }
}

let _dragFrom = -1;
function renderInventory() {
  el.invSlots.innerHTML = '';
  const p = game.player;
  for (let i = 0; i < 5; i++) {
    const it = p.slots[i];
    const cell = document.createElement('div');
    cell.className = 'invCell' + (i === p.activeSlot ? ' active' : '');
    cell.draggable = true;
    cell.dataset.idx = i;
    if (it) {
      cell.style.borderColor = it.color;
      cell.innerHTML = `<span class="invIcon">${it.icon || '❔'}</span><b>${it.name}</b><span style="color:${it.color}">${
        it.kind === 'weapon' ? it.rarity.name : '×' + it.usesLeft
      }</span>`;
    } else {
      cell.innerHTML = `<b>—</b><span>vazio</span>`;
    }
    cell.addEventListener('dragstart', () => { _dragFrom = i; });
    cell.addEventListener('dragover', (e) => e.preventDefault());
    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      const to = i;
      if (_dragFrom >= 0 && _dragFrom !== to) {
        const tmp = p.slots[_dragFrom];
        p.slots[_dragFrom] = p.slots[to];
        p.slots[to] = tmp;
        p.refreshHeld();
        renderInventory();
      }
      _dragFrom = -1;
    });
    el.invSlots.appendChild(cell);
  }
}

// ---------- câmera em 3ª pessoa ----------
function updateCamera() {
  const p = game.player;
  const camH = p.crouching && p.phase === 'playing' ? 1.2 : 1.55;
  const target = new THREE.Vector3(p.pos.x, p.pos.y + camH, p.pos.z);
  const f = forwardVec(game.camYaw, game.camPitch);
  const right = new THREE.Vector3().crossVectors(f, UP).normalize();

  const dist = p.phase === 'playing' ? 5.2 : 8;
  const camPos = target
    .clone()
    .addScaledVector(f, -dist)
    .addScaledVector(right, 0.9)
    .add(new THREE.Vector3(0, 0.35, 0));

  const minY = terrainHeight(camPos.x, camPos.z) + 0.4;
  if (camPos.y < minY) camPos.y = minY;

  camera.position.copy(camPos);
  camera.lookAt(target.clone().addScaledVector(f, 10));
}

// ---------- atualização ----------
function update(dt, t) {
  if(friendBattle?.role==='guest'){friendBattle.guestStep(dt,t);return;}
  game.frameColliders = game.worldColliders.concat(
    game.build.structures.filter((s) => s.kind === 'wall').map((s) => s.aabb)
  );

  if (!game.victory) {
    updateBus(dt);

    // a zona só começa a fechar depois que o jogador pousa
    if (game.player.phase === 'playing') game.zone.update(dt);
    game.zone.updateMeshes();

    game.player.update(dt);
    friendBattle?.hostStep(dt);
    for (const b of game.bots) b.update(dt);
    updateProjectiles(dt);

    for (const e of livingEntities()) {
      if (e.phase !== 'playing') continue;
      if (!game.zone.contains(e.pos.x, e.pos.z)) damageEntity(e, game.zone.dps * dt, 'storm', false);
    }

    for (const c of game.chests) c.update(dt, t);
    for (const pk of game.pickups) pk.update(dt, t);
    updateInteraction();

    const botsAlive = game.bots.filter((b) => b.alive).length;
    if ((friendBattle?friendBattle.humans.some(p=>p.alive):game.player.alive) && botsAlive === 0 && !game.victory) {
      game.victory = true;
      jarvisRecordBattle(true);
      AudioSys.play('win');
    }
  }

  updateParticles(dt);
  updateKillfeed(dt);
  updateCamera();
  if (!game.player.alive) input.buildQueued = null;

  // ambiente sonoro conforme a situação
  const p = game.player;
  const inAir = p.phase === 'freefall' || p.phase === 'glider';
  AudioSys.setAmbience({
    wind: inAir ? 0.45 : 0.1,
    storm: p.alive && p.phase === 'playing' && !game.zone.contains(p.pos.x, p.pos.z),
    bus: p.phase === 'bus',
    calm: p.phase === 'playing' && game.zone.contains(p.pos.x, p.pos.z),
  });
}

// ---------- HUD ----------
function setOverlay(title, sub, cls) {
  el.overlay.classList.remove('hidden');
  el.overlay.classList.toggle('win', cls === 'win');
  el.overlay.classList.toggle('lose', cls === 'lose');
  el.overlayTitle.textContent = title;
  el.overlaySub.textContent = sub;
}

let _lastHotbarKey = '';
function updateHUD() {
  const p = game.player;

  const frac = clamp(p.hp / p.maxHp, 0, 1);
  el.healthFill.style.width = `${frac * 100}%`;
  el.healthFill.className = frac > 0.5 ? '' : frac > 0.25 ? 'mid' : 'low';
  el.healthText.textContent = Math.ceil(Math.max(0, p.hp));

  // barra azul de escudo
  el.shieldFill.style.width = `${clamp(p.shield / p.maxShield, 0, 1) * 100}%`;
  el.shieldText.textContent = Math.round(Math.max(0, p.shield));

  el.playersCount.textContent = livingEntities().length;
  el.matWood.textContent = game.materials.wood;
  el.matStone.textContent = game.materials.stone;
  el.matMetal.textContent = game.materials.metal;

  el.zoneStatus.textContent =
    p.phase === 'playing' || !p.alive ? game.zone.statusText() : '🚌 A caminho da ilha...';
  el.zoneStatus.classList.toggle('warn', game.zone.state === 'shrinking');

  el.vignette.classList.toggle(
    'active',
    p.alive && p.phase === 'playing' && !game.zone.contains(p.pos.x, p.pos.z)
  );

  // mira: formato muda conforme o TIPO de arma; só um ponto com picareta/cura
  const wpn = p.phase === 'playing' && p.alive ? p.weapon : null;
  el.crosshair.className = wpn ? `gun ch-${wpn.typeId}` : '';

  // barra de cura
  if (p.healing) {
    el.healBar.classList.remove('hidden');
    el.healFill.style.width = `${(1 - p.healing.left / p.healing.total) * 100}%`;
  } else {
    el.healBar.classList.add('hidden');
  }

  // avisos das fases aéreas
  if (p.phase === 'bus') {
    el.airPrompt.classList.remove('hidden');
    el.airPrompt.textContent = `[${keyName(binds.jump)}] Pular do ônibus!`;
  } else if (p.phase === 'freefall') {
    el.airPrompt.classList.remove('hidden');
    el.airPrompt.textContent = `Caindo... [${keyName(binds.jump)}] abre o paraquedas`;
  } else if (p.phase === 'glider') {
    el.airPrompt.classList.remove('hidden');
    el.airPrompt.textContent = '🪂 Planando... WASD para se mover';
  } else {
    el.airPrompt.classList.add('hidden');
  }

  // hotbar de 5 slots
  const key = `${p.activeSlot}|${p.slots.map((w) => (w ? w.name + (w.usesLeft || '') + (w.rarity ? w.rarity.idx : '') : '-')).join(',')}`;
  if (key !== _lastHotbarKey) {
    _lastHotbarKey = key;
    for (let i = 0; i < 5; i++) {
      const w = p.slots[i];
      const slot = el.slots[i];
      slot.classList.toggle('active', i === p.activeSlot);
      if (w) {
        slot.innerHTML = `${i + 1}. ${w.icon || ''} ${w.name}<span class="rar" style="color:${w.color}">${
          w.kind === 'weapon' ? w.rarity.name : '×' + w.usesLeft
        }</span>`;
        slot.style.borderColor = w.color;
      } else {
        slot.innerHTML = `${i + 1}. ${i === p.activeSlot ? '⛏️' : '—'}<span class="rar">${
          i === p.activeSlot ? 'Picareta' : 'vazio'
        }</span>`;
        slot.style.borderColor = '#666';
      }
    }
  }

  if (game.interactTarget && p.phase === 'playing') {
    const t = game.interactTarget;
    el.interactPrompt.classList.remove('hidden');
    el.interactPrompt.textContent =
      t.kind === 'chest'
        ? '[E] Abrir baú 🎁'
        : `[E] Pegar ${t.obj.item.icon || ''} ${t.obj.item.name}${t.obj.item.rarity ? ' (' + t.obj.item.rarity.name + ')' : ''}`;
  } else {
    el.interactPrompt.classList.add('hidden');
  }

  if (game.victory) {
    setOverlay('🏆 VITÓRIA ROYALE!', 'Você é o último sobrevivente · aperte R para jogar de novo', 'win');
  } else if (!p.alive) {
    setOverlay('☠️ VOCÊ FOI ELIMINADO', `Você terminou em #${game.playerPlacement} · aperte R para tentar de novo`, 'lose');
  } else {
    el.overlay.classList.add('hidden');
  }

  renderKillfeed();
  drawMinimap();
}

// desenha o mapa em qualquer canvas/tamanho (minimapa e mapa grande do M)
function drawMapOn(mm, S) {
  const k = S / 150; // fator de escala em relação ao minimapa
  const toMap = (v) => ((v + HALF_WORLD) / WORLD_SIZE) * S;

  mm.fillStyle = 'rgba(20, 45, 25, 0.88)';
  mm.fillRect(0, 0, S, S);
  if(game.mapCanvas)mm.drawImage(game.mapCanvas,0,0,S,S);

  mm.fillStyle = 'rgba(150, 150, 155, 0.5)';
  for (const c of CITIES) {
    mm.beginPath();
    mm.arc(toMap(c.x), toMap(c.z), (c.r / WORLD_SIZE) * S, 0, Math.PI * 2);
    mm.fill();
  }
  mm.fillStyle = 'rgba(90, 110, 90, 0.5)';
  for (const m of MOUNTAINS) {
    mm.beginPath();
    mm.arc(toMap(m.x), toMap(m.z), (m.r / WORLD_SIZE) * S * 0.6, 0, Math.PI * 2);
    mm.fill();
  }
  if(S>400){mm.fillStyle='#e3ece3';mm.font='11px sans-serif';mm.textAlign='center';for(const c of CITIES)if(c.name)mm.fillText(c.name,toMap(c.x),toMap(c.z)-8);}

  // safe atual (roxo) e próxima safe (branco tracejado)
  mm.beginPath();
  mm.arc(toMap(game.zone.x), toMap(game.zone.z), (game.zone.radius / WORLD_SIZE) * S, 0, Math.PI * 2);
  mm.strokeStyle = '#b05af0';
  mm.lineWidth = 1.5 * k;
  mm.stroke();
  if (game.zone.state !== 'done') {
    mm.beginPath();
    mm.setLineDash([4 * k, 3 * k]);
    mm.arc(toMap(game.zone.targetX), toMap(game.zone.targetZ), (game.zone.targetRadius / WORLD_SIZE) * S, 0, Math.PI * 2);
    mm.strokeStyle = 'rgba(255,255,255,0.85)';
    mm.lineWidth = 1 * k;
    mm.stroke();
    mm.setLineDash([]);
  }

  mm.fillStyle = '#ffd94a';
  for (const c of game.chests) {
    if (c.opened) continue;
    mm.fillRect(toMap(c.x) - 1.5 * k, toMap(c.z) - 1.5 * k, 3 * k, 3 * k);
  }

  if (game.bus && !game.bus.done) {
    mm.fillStyle = '#8a4ddb';
    mm.fillRect(toMap(game.bus.group.position.x) - 2.5 * k, toMap(game.bus.group.position.z) - 2.5 * k, 5 * k, 5 * k);
  }

  for (const b of game.bots) {
    if (!b.alive || b.phase === 'bus') continue;
    mm.fillStyle = '#' + b.colorHex.toString(16).padStart(6, '0');
    mm.beginPath();
    mm.arc(toMap(b.pos.x), toMap(b.pos.z), 3 * k, 0, Math.PI * 2);
    mm.fill();
  }
  if (game.player.alive) {
    mm.fillStyle = '#fff';
    mm.beginPath();
    mm.arc(toMap(game.player.pos.x), toMap(game.player.pos.z), 4 * k, 0, Math.PI * 2);
    mm.fill();
  }
}

function drawMinimap() {
  drawMapOn(minimapCtx, 150);
  if (bigMapOpen) drawMapOn(bigMapCtx, 520);
}

// nome amigável de uma tecla (usado também pelo menu)
function keyName(code) {
  const map = {
    Space: 'Espaço', ShiftLeft: 'Shift', ShiftRight: 'Shift Dir.',
    ControlLeft: 'Ctrl', AltLeft: 'Alt', Tab: 'Tab',
    Mouse1: 'Roda do mouse', Mouse2: 'Botão direito',
    Mouse3: 'Mouse 4 (lateral)', Mouse4: 'Mouse 5 (lateral)',
  };
  if (map[code]) return map[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}
window.keyName = keyName;

// ---------- loop principal ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game) {
    update(dt, now / 1000);
    updateHUD();
    updateBattleLOD();
    renderer.render(game.scene, camera);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function updateBattleLOD(){
 if(!game?.botLOD)return;const matrix=new THREE.Matrix4(),p=game.player.pos;
 for(let i=0;i<game.bots.length;i++){const b=game.bots[i],distance=b.pos.distanceToSquared(p),far=b.alive&&b.phase!=='bus'&&distance>100*100;
  b.mesh.visible=b.alive&&b.phase!=='bus'&&!far;b.shadow.visible=b.mesh.visible&&b.phase==='playing';b.tag.sprite.visible=distance<45*45;
  if(far)matrix.compose(b.pos.clone().add(new THREE.Vector3(0,1.05,0)),new THREE.Quaternion(),new THREE.Vector3(1,1,1));else matrix.makeScale(0,0,0);game.botLOD.setMatrixAt(i,matrix);
 }
 game.botLOD.instanceMatrix.needsUpdate=true;
 if(game.mapId==='serra')for(const object of game.scene.children)if(object.userData.sceneryCenter){const c=object.userData.sceneryCenter;object.visible=Math.hypot(c.x-p.x,c.z-p.z)<500;}
}
