// world.js — terreno 3D, montanhas, cidades e objetos QUEBRÁVEIS que dão material:
// árvores → madeira · pedras → pedra · carros → ferro · prédios → pedra

let WORLD_SIZE = 800;
let HALF_WORLD = WORLD_SIZE / 2;

const MOUNTAINS = [
  { x: -240, z: -260, r: 130, h: 70 },
  { x: 280,  z: -180, r: 100, h: 52 },
  { x: 240,  z: 280,  r: 140, h: 80 },
  { x: -300, z: 230,  r: 95,  h: 45 },
  { x: 40,   z: -330, r: 110, h: 58 },
];

const CITIES = [
  { x: 30,   z: 40,   r: 60 },
  { x: -230, z: -60,  r: 48 },
  { x: 200,  z: -240, r: 45 },
  { x: -160, z: 230,  r: 42 },
  { x: 270,  z: 110,  r: 40 },
];

const CLASSIC_MOUNTAINS=MOUNTAINS.map(v=>({...v})),CLASSIC_CITIES=CITIES.map(v=>({...v}));
function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function smooth01(t) { return t * t * (3 - 2 * t); }

// altura do terreno em qualquer ponto — função analítica
function terrainHeight(x, z) {
  if(activeMapId!=='classic')return arenaHeight(x,z);
  let h =
    3.5 +
    2.2 * Math.sin(x * 0.02) * Math.cos(z * 0.023) +
    1.5 * Math.sin(x * 0.045 + 1.7) * Math.sin(z * 0.038 + 0.6);

  for (const m of MOUNTAINS) {
    const d2 = (x - m.x) * (x - m.x) + (z - m.z) * (z - m.z);
    h += m.h * Math.exp(-d2 / (m.r * m.r * 0.5));
  }

  for (const c of CITIES) {
    const d = Math.hypot(x - c.x, z - c.z);
    if (d < c.r + 25) {
      const t = smooth01(clamp01((d - c.r) / 25));
      h = h * t + 1.2 * (1 - t);
    }
  }
  return h;
}

function isInCity(x, z) {
  return CITIES.some((c) => Math.hypot(x - c.x, z - c.z) < c.r);
}

function isBlockedAt(x, z, r, colliders) {
  return colliders.some((a) => circleRectOverlapXZ(x, z, r, a));
}

// ---------- texturas procedurais ----------
const _texCache = {};

function makeWindowTexture(baseColor) {
  if (_texCache[baseColor]) return _texCache[baseColor];
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 256;
  const c = cv.getContext('2d');
  c.fillStyle = baseColor;
  c.fillRect(0, 0, 128, 256);
  // sujeira/sombreamento leve para dar realismo
  for (let i = 0; i < 160; i++) {
    c.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`;
    c.fillRect(Math.random() * 128, Math.random() * 256, 6, 6);
  }
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 4; col++) {
      const lit = Math.random() < 0.25;
      c.fillStyle = lit ? '#f5e6a8' : '#18222e';
      c.fillRect(10 + col * 30, 12 + row * 30, 18, 20);
      c.fillStyle = 'rgba(255,255,255,0.18)';
      c.fillRect(10 + col * 30, 12 + row * 30, 18, 4); // reflexo do vidro
    }
  }
  c.fillStyle = 'rgba(0,0,0,0.35)';
  c.fillRect(0, 244, 128, 12);
  const tex = new THREE.CanvasTexture(cv);
  _texCache[baseColor] = tex;
  return tex;
}

// ---------- construção do mundo ----------
function buildWorld(scene) {
  if(activeMapId!=='classic')return buildArenaWorld(scene);
  const colliders = [];
  const harvestables = [];
  const chestSpots = [];
  const lootSpots = [];

  // --- terreno com cores por altura ---
  const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 170, 170);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = terrainHeight(x, z);
    pos.setY(i, y);

    let r, g, b;
    const jitter = (Math.random() - 0.5) * 0.05;
    if (isInCity(x, z)) {
      r = 0.55; g = 0.56; b = 0.58;
    } else if (y > 46) {
      r = 0.93; g = 0.94; b = 0.97;
    } else if (y > 27) {
      r = 0.47; g = 0.45; b = 0.43;
    } else {
      r = 0.3 + jitter; g = 0.62 + jitter; b = 0.28;
    }
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  scene.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })));

  // --- mar ao redor ---
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 3000),
    new THREE.MeshLambertMaterial({ color: 0x3f7fca })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.6;
  scene.add(water);

  // --- prédios (quebráveis: dão PEDRA) ---
  const palettes = ['#d9b8a3', '#c46a4f', '#9fb4c7', '#e0d6b8', '#b8a3d9'];
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x3c4148 });

  for (const city of CITIES) {
    const count = Math.round(city.r / 3.2); // cidades mais densas
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 10 + Math.random() * (city.r * 0.82 - 10);
      const bx = city.x + Math.cos(a) * d;
      const bz = city.z + Math.sin(a) * d;
      const w = 6 + Math.random() * 7;
      const dep = 6 + Math.random() * 7;
      let h = 8 + Math.random() * 16;
      if (Math.random() < 0.15) h *= 1.7;

      const test = {
        minX: bx - w / 2 - 1.5, maxX: bx + w / 2 + 1.5,
        minZ: bz - dep / 2 - 1.5, maxZ: bz + dep / 2 + 1.5,
      };
      if (colliders.some((c2) =>
        c2.minX < test.maxX && c2.maxX > test.minX &&
        c2.minZ < test.maxZ && c2.maxZ > test.minZ
      )) continue;

      const baseY = terrainHeight(bx, bz);
      const winMat = new THREE.MeshLambertMaterial({
        map: makeWindowTexture(palettes[Math.floor(Math.random() * palettes.length)]),
      });
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, dep),
        [winMat, winMat, roofMat, roofMat, winMat, winMat]
      );
      mesh.position.set(bx, baseY + h / 2 - 0.3, bz);
      scene.add(mesh);

      const collider = {
        minX: bx - w / 2, maxX: bx + w / 2,
        minZ: bz - dep / 2, maxZ: bz + dep / 2,
        top: baseY + h,
      };
      colliders.push(collider);
      harvestables.push({
        kind: 'building', aabb: collider, collider, meshes: [mesh],
        hp: 600, material: 'stone', yield: 10,
        cx: bx, cz: bz, cy: baseY + h / 2,
      });
    }

    // carros na cidade (dão FERRO)
    for (let i = 0; i < 4; i++) {
      const s = randomSpotInCircle(city.x, city.z, city.r * 0.85, colliders);
      if (!s) continue;
      const baseY = terrainHeight(s.x, s.z);
      const carColor = [0xd04a3a, 0x3a6ed0, 0xd0b83a, 0x48b060][Math.floor(Math.random() * 4)];
      const car = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(4, 1.1, 1.9), new THREE.MeshLambertMaterial({ color: carColor }));
      body.position.y = 0.75;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 1.7), new THREE.MeshLambertMaterial({ color: 0x222b33 }));
      cab.position.set(-0.2, 1.7, 0);
      car.add(body);
      car.add(cab);
      car.position.set(s.x, baseY, s.z);
      car.rotation.y = Math.random() * Math.PI * 2;
      scene.add(car);

      const collider = { minX: s.x - 2.2, maxX: s.x + 2.2, minZ: s.z - 2.2, maxZ: s.z + 2.2, top: baseY + 2.2 };
      colliders.push(collider);
      harvestables.push({
        kind: 'car', x: s.x, z: s.z, r: 2.4, collider, meshes: [car],
        hp: 250, material: 'metal', yield: 10, cy: baseY + 1,
      });
    }

    for (let i = 0; i < 5; i++) {
      const s = randomSpotInCircle(city.x, city.z, city.r * 0.8, colliders);
      if (s) chestSpots.push(s);
    }
    for (let i = 0; i < 8; i++) {
      const s = randomSpotInCircle(city.x, city.z, city.r * 0.85, colliders);
      if (s) lootSpots.push(s);
    }
  }

  for (let i = 0; i < 10; i++) {
    const s = randomSpotInCircle(0, 0, HALF_WORLD * 0.85, colliders, true);
    if (s) chestSpots.push(s);
  }
  for (let i = 0; i < 14; i++) {
    const s = randomSpotInCircle(0, 0, HALF_WORLD * 0.85, colliders, true);
    if (s) lootSpots.push(s);
  }

  // --- árvores (dão MADEIRA) ---
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2a });
  for (let i = 0; i < 220; i++) {
    const x = (Math.random() - 0.5) * WORLD_SIZE * 0.92;
    const z = (Math.random() - 0.5) * WORLD_SIZE * 0.92;
    const y = terrainHeight(x, z);
    if (y > 26 || isInCity(x, z)) continue;
    const s = 0.8 + Math.random() * 0.7;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * s, 0.35 * s, 1.8 * s, 6), trunkMat);
    trunk.position.set(x, y + 0.9 * s, z);
    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(1.6 * s, 3.4 * s, 8),
      new THREE.MeshLambertMaterial({ color: Math.random() < 0.5 ? 0x2e7d3a : 0x3c8f45 })
    );
    leaves.position.set(x, y + 1.8 * s + 1.6 * s, z);
    scene.add(trunk);
    scene.add(leaves);
    harvestables.push({
      kind: 'tree', x, z, r: 1.2, meshes: [trunk, leaves],
      hp: 150, material: 'wood', yield: 10, cy: y + 2,
    });
  }

  // --- pedras (dão PEDRA) ---
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x8a8f96 });
  for (let i = 0; i < 70; i++) {
    const x = (Math.random() - 0.5) * WORLD_SIZE * 0.92;
    const z = (Math.random() - 0.5) * WORLD_SIZE * 0.92;
    if (isInCity(x, z)) continue;
    const s = 0.7 + Math.random() * 1.6;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
    const y = terrainHeight(x, z);
    rock.position.set(x, y + s * 0.4, z);
    rock.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
    scene.add(rock);
    harvestables.push({
      kind: 'rock', x, z, r: s + 0.5, meshes: [rock],
      hp: 200, material: 'stone', yield: 10, cy: y + s * 0.4,
    });
  }

  return { colliders, harvestables, chestSpots, lootSpots };
}

function randomSpotInCircle(cx, cz, r, colliders, grassOnly = false) {
  for (let tries = 0; tries < 12; tries++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * r;
    const x = cx + Math.cos(a) * d;
    const z = cz + Math.sin(a) * d;
    if (Math.abs(x) > HALF_WORLD - 8 || Math.abs(z) > HALF_WORLD - 8) continue;
    if (grassOnly && (terrainHeight(x, z) > 26 || isInCity(x, z))) continue;
    if (!isBlockedAt(x, z, 1.2, colliders)) return { x, z };
  }
  return null;
}
