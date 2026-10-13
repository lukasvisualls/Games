// weapons.js — itens do jogo: armas (com raridade), curas, drops no chão e baús

const RARITIES = [
  { idx: 0, name: 'Comum',    color: '#9da3a8', colorHex: 0x9da3a8, mult: 1.0,  weight: 38 },
  { idx: 1, name: 'Incomum',  color: '#3ddc55', colorHex: 0x3ddc55, mult: 1.15, weight: 30 },
  { idx: 2, name: 'Raro',     color: '#3aa0ff', colorHex: 0x3aa0ff, mult: 1.3,  weight: 17 },
  { idx: 3, name: 'Épico',    color: '#b04ddb', colorHex: 0xb04ddb, mult: 1.5,  weight: 10 },
  { idx: 4, name: 'Lendário', color: '#ffa321', colorHex: 0xffa321, mult: 1.75, weight: 5 },
];

const WEAPON_TYPES = [
  { id: 'pistola',  name: 'Pistola',      icon: '🔫', damage: 16, fireRate: 0.3,  speed: 90,  spread: 0.02,  len: 0.45 },
  { id: 'smg',      name: 'SMG',          icon: '⚡', damage: 9,  fireRate: 0.09, speed: 90,  spread: 0.05,  len: 0.55 },
  { id: 'fuzil',    name: 'Fuzil',        icon: '🎯', damage: 22, fireRate: 0.18, speed: 110, spread: 0.02,  len: 0.8 },
  { id: 'sniper',   name: 'Sniper',       icon: '🔭', damage: 70, fireRate: 1.3,  speed: 200, spread: 0.003, len: 1.0 },
  { id: 'escopeta', name: 'Escopeta',     icon: '💥', damage: 9,  fireRate: 0.8,  speed: 70,  spread: 0.06,  len: 0.85, pellets: 8, life: 0.5 },
  { id: 'revolver', name: 'Revólver',     icon: '🌀', damage: 40, fireRate: 0.65, speed: 110, spread: 0.012, len: 0.5 },
  { id: 'lmg',      name: 'Metralhadora', icon: '🔥', damage: 14, fireRate: 0.11, speed: 100, spread: 0.055, len: 0.95 },
];

// curas (verde) e escudos (azul): escudo tem barra própria de 0 a 100
const HEAL_TYPES = [
  { id: 'bandagem', name: 'Bandagem',      icon: '🩹', heal: 15,  cap: 75,  castTime: 2.5, uses: 3, stat: 'hp',     color: '#6cd06c', colorHex: 0x6cd06c },
  { id: 'medkit',   name: 'Kit Médico',    icon: '⛑️', heal: 100, cap: 100, castTime: 5,   uses: 1, stat: 'hp',     color: '#3fd07a', colorHex: 0x3fd07a },
  { id: 'mini',     name: 'Mini Escudo',   icon: '🧪', heal: 25,  cap: 50,  castTime: 2,   uses: 3, stat: 'shield', color: '#3ac6ff', colorHex: 0x3ac6ff },
  { id: 'escudo',   name: 'Escudo Grande', icon: '🛡️', heal: 50,  cap: 100, castTime: 4,   uses: 1, stat: 'shield', color: '#1a8fe0', colorHex: 0x1a8fe0 },
];

function rollRarity(luck = 0) {
  const pick = () => {
    const total = RARITIES.reduce((s, r) => s + r.weight, 0);
    let v = Math.random() * total;
    for (const r of RARITIES) {
      v -= r.weight;
      if (v <= 0) return r;
    }
    return RARITIES[0];
  };
  let r = pick();
  for (let i = 0; i < luck; i++) {
    const r2 = pick();
    if (r2.idx > r.idx) r = r2;
  }
  return r;
}

function makeWeapon(typeId, rarity) {
  const t = WEAPON_TYPES.find((w) => w.id === typeId);
  return {
    kind: 'weapon',
    typeId: t.id,
    name: t.name,
    icon: t.icon,
    rarity,
    color: rarity.color,
    colorHex: rarity.colorHex,
    damage: Math.round(t.damage * rarity.mult),
    fireRate: t.fireRate,
    speed: t.speed,
    spread: t.spread * (1 - 0.08 * rarity.idx),
    len: t.len,
    pellets: t.pellets || 1, // escopeta atira vários balins de uma vez
    life: t.life || 2,       // alcance (segundos de voo do projétil)
  };
}

function makeHeal(id) {
  const t = HEAL_TYPES.find((h) => h.id === id);
  return { kind: 'heal', ...t, usesLeft: t.uses };
}

function randomWeapon(luck = 0) {
  const t = WEAPON_TYPES[Math.floor(Math.random() * WEAPON_TYPES.length)];
  return makeWeapon(t.id, rollRarity(luck));
}

// consumível sorteado por peso (curas e escudos)
function randomConsumable() {
  const pool = [
    ['bandagem', 32],
    ['medkit', 14],
    ['mini', 36],
    ['escudo', 18],
  ];
  const total = pool.reduce((s, p) => s + p[1], 0);
  let v = Math.random() * total;
  for (const [id, w] of pool) {
    v -= w;
    if (v <= 0) return makeHeal(id);
  }
  return makeHeal('bandagem');
}

// loot geral: 55% arma, 45% consumível
function randomLootItem(luck = 0) {
  if (Math.random() < 0.45) return randomConsumable();
  return randomWeapon(luck);
}

// ---------- modelos 3D dos itens (cada arma tem silhueta própria) ----------
function buildGunMesh(weapon) {
  const g = new THREE.Group();
  const metal = new THREE.MeshLambertMaterial({ color: 0x2b2f36 });
  const metal2 = new THREE.MeshLambertMaterial({ color: 0x4a5058 });
  const wood = new THREE.MeshLambertMaterial({ color: 0x6e4a26 });
  const accent = new THREE.MeshLambertMaterial({
    color: weapon.colorHex,
    emissive: weapon.colorHex,
    emissiveIntensity: 0.35,
  });
  const box = (w, h, d, m, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    g.add(mesh);
    return mesh;
  };
  const tube = (r, len, m, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), m);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    g.add(mesh);
    return mesh;
  };

  const L = weapon.len;
  switch (weapon.typeId) {
    case 'pistola':
      box(0.09, 0.11, L, metal, 0, 0, L / 2);
      box(0.07, 0.05, L * 0.9, metal2, 0, 0.07, L / 2); // ferrolho
      box(0.07, 0.16, 0.09, metal, 0, -0.12, 0.1);
      break;
    case 'revolver':
      tube(0.028, L, metal2, 0, 0.03, L / 2 + 0.1);  // cano fino e longo
      tube(0.06, 0.14, metal, 0, 0, 0.16);           // tambor giratório
      box(0.07, 0.15, 0.09, wood, 0, -0.12, 0.05);   // cabo de madeira
      break;
    case 'smg':
      box(0.09, 0.12, L, metal, 0, 0, L / 2);
      box(0.06, 0.18, 0.07, metal, 0, -0.14, L * 0.55); // empunhadura frontal
      box(0.06, 0.2, 0.08, metal2, 0, -0.15, 0.18);     // pente
      tube(0.03, 0.16, metal2, 0, 0.01, L + 0.08);
      break;
    case 'fuzil':
      box(0.09, 0.12, L, metal, 0, 0, L / 2);
      box(0.08, 0.12, 0.22, wood, 0, -0.01, -0.13);     // coronha
      box(0.06, 0.22, 0.09, metal2, 0, -0.16, L * 0.4); // pente
      tube(0.028, 0.3, metal, 0, 0.02, L + 0.14);
      break;
    case 'sniper':
      tube(0.03, L * 0.7, metal, 0, 0.02, L * 0.85);    // canão longo
      box(0.09, 0.12, L * 0.6, wood, 0, 0, L * 0.3);    // corpo de madeira
      box(0.08, 0.12, 0.24, wood, 0, -0.02, -0.14);     // coronha
      tube(0.035, 0.22, metal2, 0, 0.12, L * 0.4);      // luneta em cima
      break;
    case 'escopeta':
      tube(0.045, L * 0.8, metal, 0, 0.03, L * 0.6);    // cano grosso
      tube(0.04, L * 0.5, metal2, 0, -0.04, L * 0.55);  // tubo de munição
      box(0.08, 0.1, 0.24, wood, 0, -0.01, -0.12);      // coronha
      box(0.075, 0.09, 0.16, wood, 0, -0.06, L * 0.45); // bomba (pump)
      break;
    case 'lmg':
      box(0.11, 0.15, L, metal, 0, 0, L / 2);
      box(0.1, 0.24, 0.16, metal2, 0, -0.18, L * 0.35); // caixa de munição
      tube(0.032, 0.3, metal, 0, 0.02, L + 0.14);
      box(0.02, 0.18, 0.02, metal2, -0.05, -0.15, L * 0.85); // bipé
      box(0.02, 0.18, 0.02, metal2, 0.05, -0.15, L * 0.85);
      break;
    default:
      box(0.09, 0.12, L, metal, 0, 0, L / 2);
  }
  if (weapon.typeId !== 'pistola' && weapon.typeId !== 'revolver') {
    box(0.06, 0.14, 0.08, metal, 0, -0.12, 0.06); // gatilho/cabo comum
  }
  // detalhe brilhante na cor da raridade
  box(0.1, 0.045, 0.16, accent, 0, 0.085, L * 0.5);
  return g;
}

function buildHealMesh(heal) {
  const g = new THREE.Group();
  if (heal.stat === 'shield') {
    // poção de escudo: garrafinha azul brilhante
    const glass = new THREE.MeshLambertMaterial({
      color: heal.colorHex,
      emissive: heal.colorHex,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85,
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.3, 10), glass);
    g.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8), glass);
    neck.position.y = 0.21;
    g.add(neck);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.05, 8),
      new THREE.MeshLambertMaterial({ color: 0x8a5f10 })
    );
    cap.position.y = 0.29;
    g.add(cap);
    if (heal.id === 'mini') g.scale.setScalar(0.7); // mini é... mini
  } else {
    // cura: caixinha branca com cruz colorida
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.3, 0.35),
      new THREE.MeshLambertMaterial({ color: 0xf2f2f2 })
    );
    g.add(base);
    const crossMat = new THREE.MeshLambertMaterial({ color: heal.colorHex, emissive: heal.colorHex, emissiveIntensity: 0.3 });
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.06), crossMat);
    c1.position.set(0, 0, 0.18);
    const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.06), crossMat);
    c2.position.set(0, 0, 0.18);
    g.add(c1);
    g.add(c2);
  }
  return g;
}

function buildItemMesh(item) {
  return item.kind === 'weapon' ? buildGunMesh(item) : buildHealMesh(item);
}

// ---------- item dropado no chão ----------
class Pickup {
  constructor(scene, x, z, item) {
    this.item = item;
    this.x = x;
    this.z = z;
    this.baseY = terrainHeight(x, z);
    this.phase = Math.random() * Math.PI * 2;

    this.group = new THREE.Group();
    this.group.position.set(x, this.baseY, z);

    this.spin = buildItemMesh(item);
    this.spin.scale.setScalar(1.6);
    this.spin.position.y = 1.1;
    this.group.add(this.spin);

    // feixe de luz vertical na cor da raridade/tipo
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 30, 8, 1, true),
      new THREE.MeshBasicMaterial({
        color: item.colorHex,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    beam.position.y = 15;
    this.group.add(beam);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.8, 24),
      new THREE.MeshBasicMaterial({ color: item.colorHex, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.15;
    this.group.add(ring);

    scene.add(this.group);
  }

  update(dt, t) {
    this.spin.position.y = 1.1 + Math.sin(t * 2 + this.phase) * 0.15;
    this.spin.rotation.y += dt * 1.5;
  }

  remove(scene) {
    scene.remove(this.group);
  }
}

function spawnPickup(gameRef, x, z, item) {
  gameRef.pickups.push(new Pickup(gameRef.scene, x, z, item));
}

// ---------- baú ----------
class Chest {
  constructor(scene, x, z) {
    this.x = x;
    this.z = z;
    this.opened = false;

    const baseY = terrainHeight(x, z);
    this.group = new THREE.Group();
    this.group.position.set(x, baseY, z);
    this.group.rotation.y = Math.random() * Math.PI * 2;

    this.mat = new THREE.MeshLambertMaterial({
      color: 0xd8a02f,
      emissive: 0x8a5f10,
      emissiveIntensity: 0.35,
    });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x6e4a14 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 0.85), this.mat);
    base.position.y = 0.35;
    this.group.add(base);

    const band = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.16, 0.89), darkMat);
    band.position.y = 0.42;
    this.group.add(band);

    this.lid = new THREE.Group();
    this.lid.position.set(0, 0.7, -0.425);
    const lidBox = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 0.85), this.mat);
    lidBox.position.set(0, 0.14, 0.425);
    this.lid.add(lidBox);
    this.group.add(this.lid);

    scene.add(this.group);
  }

  update(dt, t) {
    if (!this.opened) {
      this.mat.emissiveIntensity = 0.3 + 0.2 * Math.sin(t * 3 + this.x);
    } else if (this.lid.rotation.x > -1.9) {
      this.lid.rotation.x = Math.max(-1.9, this.lid.rotation.x - dt * 5);
    }
  }

  // baú: arma com sorte extra + às vezes uma cura + madeira de bônus
  open(gameRef) {
    if (this.opened) return;
    this.opened = true;
    this.mat.emissiveIntensity = 0.1;

    const a = this.group.rotation.y;
    spawnPickup(gameRef, this.x + Math.sin(a) * 1.6, this.z + Math.cos(a) * 1.6, randomWeapon(1));
    if (Math.random() < 0.65) {
      spawnPickup(gameRef, this.x - Math.sin(a) * 1.6, this.z - Math.cos(a) * 1.6, randomConsumable());
    }
    addMaterial('wood', 30);
  }
}
