// build.js — construção estilo Fortnite: parede, rampa, piso e pirâmide,
// em 3 materiais (madeira/pedra/ferro), com superfícies onde dá para andar/subir

const BUILD_GRID = 3;
const PIECE_H = 3;

const MATERIALS = {
  wood:  { name: 'Madeira', hp: 150, icon: '🪵' },
  stone: { name: 'Pedra',   hp: 250, icon: '🪨' },
  metal: { name: 'Ferro',   hp: 400, icon: '⚙️' },
};

// ---------- texturas por material ----------
const _structTex = {};
function makeStructTexture(mat) {
  if (_structTex[mat]) return _structTex[mat];
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 128;
  const c = cv.getContext('2d');

  if (mat === 'wood') {
    c.fillStyle = '#9a6632';
    c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 4; i++) {
      c.fillStyle = i % 2 ? '#8a5a2b' : '#a06c36';
      c.fillRect(0, i * 32, 128, 30);
      c.fillStyle = 'rgba(60,36,12,0.5)';
      c.fillRect(0, i * 32 + 30, 128, 2);
      // veios da madeira
      for (let v = 0; v < 6; v++) {
        c.strokeStyle = 'rgba(70,45,18,0.35)';
        c.beginPath();
        const y = i * 32 + 4 + Math.random() * 24;
        c.moveTo(0, y);
        c.bezierCurveTo(40, y + 3, 90, y - 3, 128, y);
        c.stroke();
      }
    }
  } else if (mat === 'stone') {
    c.fillStyle = '#8d9096';
    c.fillRect(0, 0, 128, 128);
    // blocos de pedra desencontrados
    for (let row = 0; row < 4; row++) {
      const off = row % 2 ? 21 : 0;
      for (let col = -1; col < 4; col++) {
        const shade = 120 + Math.random() * 40;
        c.fillStyle = `rgb(${shade},${shade + 2},${shade + 6})`;
        c.fillRect(col * 42 + off + 2, row * 32 + 2, 38, 28);
      }
    }
  } else {
    c.fillStyle = '#7d8792';
    c.fillRect(0, 0, 128, 128);
    c.fillStyle = 'rgba(255,255,255,0.1)';
    c.fillRect(0, 0, 128, 10);
    c.strokeStyle = 'rgba(30,40,50,0.6)';
    c.lineWidth = 3;
    c.strokeRect(6, 6, 116, 116);
    c.beginPath();
    c.moveTo(6, 64); c.lineTo(122, 64);
    c.moveTo(64, 6); c.lineTo(64, 122);
    c.stroke();
    // rebites
    c.fillStyle = '#4a545e';
    for (const px of [14, 114]) for (const pz of [14, 56, 72, 114]) {
      c.beginPath();
      c.arc(px, pz, 4, 0, Math.PI * 2);
      c.fill();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  _structTex[mat] = tex;
  return tex;
}

class BuildSystem {
  constructor(scene) {
    this.scene = scene;
    this.structures = [];
    this.cost = 10; // custo por peça
  }

  // escolhe automaticamente o material disponível (madeira → pedra → ferro)
  pickMaterial() {
    for (const m of ['wood', 'stone', 'metal']) {
      if (game.materials[m] >= this.cost) return m;
    }
    return null;
  }

  // opts.free = construção grátis (usada pelos bots)
  tryPlace(kind, px, py, pz, yaw, entities, opts = {}) {
    const mat = opts.free ? 'wood' : this.pickMaterial();
    if (!mat) return false;

    const dirI = Math.round(yaw / (Math.PI / 2));
    const a = dirI * (Math.PI / 2);
    const dx = Math.round(Math.sin(a));
    const dz = Math.round(Math.cos(a));

    const cx = Math.round((px + dx * BUILD_GRID) / BUILD_GRID) * BUILD_GRID;
    const cz = Math.round((pz + dz * BUILD_GRID) / BUILD_GRID) * BUILD_GRID;
    if (Math.abs(cx) > HALF_WORLD - 2 || Math.abs(cz) > HALF_WORLD - 2) return false;

    // alinhamento vertical: TUDO encaixa em andares de 3 m (grade absoluta),
    // então paredes/rampas/pisos empilham sempre retinhos
    const support = kind === 'floor' ? py : groundAt(cx, cz, py + 1.5);
    const level = Math.round(support / PIECE_H);
    const baseY = level * PIECE_H;
    const topY = kind === 'floor' ? baseY : kind === 'pyramid' ? baseY + 1.4 : baseY + PIECE_H;

    const facingX = dx !== 0;
    // uma construção por "vaga": parede por (célula + orientação + andar),
    // piso/rampa/pirâmide por (célula + andar)
    const key = kind === 'wall'
      ? `wall|${cx}|${cz}|${level}|${facingX ? 'x' : 'z'}`
      : `cell|${cx}|${cz}|${level}`;
    if (this.structures.some((s) => s.key === key)) return false;

    let aabb;
    if (kind === 'wall') {
      aabb = facingX
        ? { minX: cx - 0.2, maxX: cx + 0.2, minZ: cz - 1.5, maxZ: cz + 1.5, top: topY }
        : { minX: cx - 1.5, maxX: cx + 1.5, minZ: cz - 0.2, maxZ: cz + 0.2, top: topY };
      if (entities.some((e) => e.alive && circleRectOverlapXZ(e.pos.x, e.pos.z, e.radius + 0.2, aabb) && e.pos.y < topY)) {
        return false;
      }
    } else {
      aabb = { minX: cx - 1.5, maxX: cx + 1.5, minZ: cz - 1.5, maxZ: cz + 1.5, top: topY };
    }

    // nenhuma peça pode ATRAVESSAR outra: rejeita se os volumes se cruzam
    // (tocar de leve nas bordas/topo é permitido, para encaixar peças vizinhas)
    const newBase = kind === 'floor' ? baseY - 0.25 : baseY;
    for (const s of this.structures) {
      const sBase = s.kind === 'floor' ? s.baseY - 0.25 : s.baseY;
      const yOverlap = newBase < s.aabb.top - 0.15 && topY > sBase + 0.15;
      if (!yOverlap) continue;
      const xzOverlap =
        aabb.minX < s.aabb.maxX - 0.1 && aabb.maxX > s.aabb.minX + 0.1 &&
        aabb.minZ < s.aabb.maxZ - 0.1 && aabb.maxZ > s.aabb.minZ + 0.1;
      if (xzOverlap) return false;
    }

    const tex = makeStructTexture(mat);
    const material = new THREE.MeshLambertMaterial({ map: tex });
    let mesh;

    if (kind === 'wall') {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(facingX ? 0.4 : 3, PIECE_H, facingX ? 3 : 0.4), material);
      mesh.position.set(cx, baseY + PIECE_H / 2, cz);
    } else if (kind === 'floor') {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 0.25, 3), material);
      mesh.position.set(cx, baseY - 0.125, cz);
    } else if (kind === 'ramp') {
      // rampa: tábua inclinada 45° subindo na direção da câmera
      const g = new THREE.Group();
      const slab = new THREE.Mesh(new THREE.BoxGeometry(3, 0.25, Math.SQRT2 * 3), material);
      slab.rotation.x = -Math.PI / 4;
      g.add(slab);
      g.position.set(cx, baseY + PIECE_H / 2, cz);
      g.rotation.y = Math.atan2(dx, dz);
      mesh = g;
    } else {
      // pirâmide (teto baixo)
      mesh = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.4, 4), material);
      mesh.rotation.y = Math.PI / 4;
      mesh.position.set(cx, baseY + 0.7, cz);
    }
    this.scene.add(mesh);

    const struct = {
      kind, key, aabb, mesh, material,
      baseY, topY,
      dirX: dx, dirZ: dz,
      hp: MATERIALS[mat].hp,
      maxHp: MATERIALS[mat].hp,
      mat,
      // altura da superfície onde dá para pisar
      surfaceY(x, z) {
        if (this.kind === 'ramp') {
          const t = clamp01((((x - (this.aabb.minX + this.aabb.maxX) / 2) * this.dirX +
                              (z - (this.aabb.minZ + this.aabb.maxZ) / 2) * this.dirZ) + 1.5) / 3);
          return this.baseY + t * PIECE_H;
        }
        if (this.kind === 'pyramid') {
          const lx = Math.abs(x - (this.aabb.minX + this.aabb.maxX) / 2);
          const lz = Math.abs(z - (this.aabb.minZ + this.aabb.maxZ) / 2);
          return this.baseY + 1.4 * (1 - clamp01(Math.max(lx, lz) / 1.5));
        }
        return this.topY;
      },
      // teste de acerto de projétil/picareta
      hitTest(x, y, z) {
        if (!circleRectOverlapXZ(x, z, 0.2, this.aabb)) return false;
        if (this.kind === 'wall') return y >= this.baseY - 0.3 && y <= this.topY + 0.3;
        if (this.kind === 'floor') return Math.abs(y - this.topY) < 0.5;
        if (this.kind === 'ramp') return Math.abs(y - this.surfaceY(x, z)) < 0.6;
        return y >= this.baseY - 0.3 && y <= this.surfaceY(x, z) + 0.4;
      },
    };
    this.structures.push(struct);
    if (!opts.free) game.materials[mat] -= this.cost;
    return true;
  }

  damageStructure(s, dmg) {
    s.hp -= dmg;
    const frac = Math.max(0, s.hp / s.maxHp);
    s.material.color.setScalar(0.45 + 0.55 * frac);
  }

  removeDestroyed(onBreak) {
    for (let i = this.structures.length - 1; i >= 0; i--) {
      if (this.structures[i].hp <= 0) {
        const s = this.structures.splice(i, 1)[0];
        this.scene.remove(s.mesh);
        if (onBreak) onBreak(s);
      }
    }
  }
}

// ---------- chão dinâmico: terreno + estruturas + telhados ----------
// retorna a altura do "chão" sob (x,z) considerando tudo em que dá para pisar
function groundAt(x, z, curY) {
  let g = activeMapId==='serra'?BattleAssets.groundAt(x,z,curY):terrainHeight(x, z);
  for (const a of game.worldColliders) {
    if (x >= a.minX && x <= a.maxX && z >= a.minZ && z <= a.maxZ) {
      if (a.top <= curY + 0.6 && a.top > g) g = a.top;
    }
  }
  for (const s of game.build.structures) {
    if (x < s.aabb.minX || x > s.aabb.maxX || z < s.aabb.minZ || z > s.aabb.maxZ) continue;
    const top = s.surfaceY(x, z);
    if (top <= curY + 0.6 && top > g) g = top;
  }
  return g;
}

// ---------- colisão no plano XZ ----------
function circleRectOverlapXZ(x, z, r, aabb) {
  const nx = Math.max(aabb.minX, Math.min(x, aabb.maxX));
  const nz = Math.max(aabb.minZ, Math.min(z, aabb.maxZ));
  const dx = x - nx;
  const dz = z - nz;
  return dx * dx + dz * dz < r * r;
}

// move uma entidade resolvendo colisão eixo a eixo (permite deslizar)
function resolveMovement3D(ent, dx, dz, colliders) {
  const oldX=ent.pos.x,oldZ=ent.pos.z;
  ent.pos.x += dx;
  if(BattleAssets.blockedAt(ent.pos.x,ent.pos.z,ent.pos.y,ent.radius,ent.height)||ent.phase==='playing'&&groundAt(ent.pos.x,ent.pos.z,ent.pos.y)>ent.pos.y+.6)ent.pos.x-=dx;
  for (const a of colliders) {
    if (ent.pos.y >= a.top - 0.2 || a.supportOnly || Number.isFinite(a.bottom)&&ent.pos.y+ent.height<a.bottom) continue;
    if (circleRectOverlapXZ(ent.pos.x, ent.pos.z, ent.radius, a)) {
      ent.pos.x = oldX;
      break;
    }
  }

  ent.pos.z += dz;
  if(BattleAssets.blockedAt(ent.pos.x,ent.pos.z,ent.pos.y,ent.radius,ent.height)||ent.phase==='playing'&&groundAt(ent.pos.x,ent.pos.z,ent.pos.y)>ent.pos.y+.6)ent.pos.z-=dz;
  for (const a of colliders) {
    if (ent.pos.y >= a.top - 0.2 || a.supportOnly || Number.isFinite(a.bottom)&&ent.pos.y+ent.height<a.bottom) continue;
    if (circleRectOverlapXZ(ent.pos.x, ent.pos.z, ent.radius, a)) {
      ent.pos.z = oldZ;
      break;
    }
  }

  ent.pos.x = Math.max(-HALF_WORLD + 1, Math.min(HALF_WORLD - 1, ent.pos.x));
  ent.pos.z = Math.max(-HALF_WORLD + 1, Math.min(HALF_WORLD - 1, ent.pos.z));
}
