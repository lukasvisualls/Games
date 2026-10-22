// player.js — boneco arredondado (cápsulas/esferas, rosto e mochila),
// jogador em 3ª pessoa com paraquedas, 5 slots, picareta, curas e agachar

// textura de tecido (leve ruído + sombreamento) por cor
const _clothCache = {};
function makeClothTexture(hexColor) {
  if (_clothCache[hexColor]) return _clothCache[hexColor];
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 64;
  const c = cv.getContext('2d');
  c.fillStyle = '#' + hexColor.toString(16).padStart(6, '0');
  c.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 300; i++) {
    c.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.06})`;
    c.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
  }
  const grad = c.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0.1)');
  grad.addColorStop(1, 'rgba(0,0,0,0.18)');
  c.fillStyle = grad;
  c.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(cv);
  _clothCache[hexColor] = tex;
  return tex;
}

// personagem estilizado com formas arredondadas e rosto
function buildCharacter({ shirt, pants, skin = 0xf0c8a0, hair = 0x4a3220 }) {
  const group = new THREE.Group();
  const mats = [];
  const clothMat = (c) => {
    const m = new THREE.MeshLambertMaterial({ map: makeClothTexture(c) });
    mats.push(m);
    return m;
  };
  const plainMat = (c) => {
    const m = new THREE.MeshLambertMaterial({ color: c });
    mats.push(m);
    return m;
  };

  // pernas (pivô no quadril)
  const mkLeg = (sx) => {
    const g = new THREE.Group();
    g.position.set(sx, 0.9, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.55, 4, 8), clothMat(pants));
    leg.position.y = -0.42;
    g.add(leg);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), plainMat(0x2a2d33));
    shoe.position.set(0, -0.82, 0.05);
    shoe.scale.set(1, 0.6, 1.4);
    g.add(shoe);
    return g;
  };
  const legL = mkLeg(-0.17);
  const legR = mkLeg(0.17);
  group.add(legL);
  group.add(legR);

  // quadril + tronco arredondado
  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), clothMat(pants));
  hip.position.y = 0.95;
  hip.scale.set(1.1, 0.7, 0.9);
  group.add(hip);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.42, 4, 10), clothMat(shirt));
  torso.position.y = 1.35;
  torso.scale.set(1.05, 1, 0.8);
  group.add(torso);

  // mochila (bem battle royale)
  const pack = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.3, 4, 8), plainMat(0x5a4632));
  pack.position.set(0, 1.4, -0.32);
  pack.scale.set(1.2, 1, 0.7);
  group.add(pack);

  // braços (pivô no ombro)
  const mkArm = (sx) => {
    const g = new THREE.Group();
    g.position.set(sx, 1.62, 0);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.42, 4, 8), clothMat(shirt));
    arm.position.y = -0.28;
    g.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), plainMat(skin));
    hand.position.y = -0.58;
    g.add(hand);
    return g;
  };
  const armL = mkArm(-0.42);
  const armR = mkArm(0.42);
  group.add(armL);
  group.add(armR);

  // cabeça com rosto (olhos/pupilas na frente, +Z)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), plainMat(skin));
  head.position.y = 2.02;
  head.scale.set(0.95, 1.05, 0.95);
  group.add(head);

  const eyeMat = plainMat(0xffffff);
  const pupilMat = plainMat(0x222222);
  for (const sx of [-0.1, 0.1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), eyeMat);
    eye.position.set(sx, 2.05, 0.22);
    eye.scale.set(1, 1.2, 0.5);
    group.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), pupilMat);
    pupil.position.set(sx, 2.05, 0.26);
    group.add(pupil);
  }
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.02), plainMat(0x8a4a3a));
  mouth.position.set(0, 1.92, 0.25);
  group.add(mouth);

  // cabelo
  const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), plainMat(hair));
  hairMesh.position.set(0, 2.12, -0.04);
  hairMesh.scale.set(1, 0.65, 1);
  group.add(hairMesh);

  // suporte da arma/ferramenta — na MÃO direita (braço fica erguido segurando)
  const gunMount = new THREE.Group();
  gunMount.position.set(0.42, 1.44, 0.52);
  group.add(gunMount);

  return { group, legL, legR, armL, armR, gunMount, mats };
}

// picareta
function buildPickaxeMesh() {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.75, 6),
    new THREE.MeshLambertMaterial({ color: 0x7a5230 })
  );
  handle.rotation.x = Math.PI / 2;
  handle.position.z = 0.3;
  g.add(handle);
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.09, 0.09),
    new THREE.MeshLambertMaterial({ color: 0x9aa3ad })
  );
  head.position.set(0, 0.04, 0.65);
  g.add(head);
  return g;
}

// paraquedas/asa-delta
function makeGlider(colorHex) {
  const g = new THREE.Group();
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(1.7, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: colorHex, side: THREE.DoubleSide })
  );
  canopy.scale.set(1, 0.55, 1);
  canopy.position.y = 3.4;
  g.add(canopy);
  const ropeMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  for (const [rx, rz] of [[-1.2, 0], [1.2, 0], [0, -1.2], [0, 1.2]]) {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.6, 4), ropeMat);
    rope.position.set(rx * 0.6, 2.6, rz * 0.6);
    rope.lookAt(new THREE.Vector3(rx, 3.4, rz));
    rope.rotateX(Math.PI / 2);
    g.add(rope);
  }
  return g;
}

function makeNameTag(name) {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 64;
  const c = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(2.6, 0.65, 1);
  sprite.position.y = 2.85;

  let lastFrac = -1;
  function redraw(frac) {
    c.clearRect(0, 0, 256, 64);
    c.font = 'bold 26px sans-serif';
    c.textAlign = 'center';
    c.lineWidth = 6;
    c.strokeStyle = 'rgba(0,0,0,0.7)';
    c.strokeText(name, 128, 26);
    c.fillStyle = '#fff';
    c.fillText(name, 128, 26);
    c.fillStyle = 'rgba(0,0,0,0.6)';
    c.fillRect(48, 38, 160, 14);
    c.fillStyle = frac > 0.5 ? '#5ad65a' : frac > 0.25 ? '#ffcc4a' : '#ff5a5a';
    c.fillRect(48, 38, 160 * Math.max(0, frac), 14);
    tex.needsUpdate = true;
  }
  redraw(1);
  return {
    sprite,
    update(frac) {
      if (Math.abs(frac - lastFrac) > 0.01) {
        lastFrac = frac;
        redraw(frac);
      }
    },
  };
}

function makeBlobShadow(scene) {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  scene.add(m);
  return m;
}

class Player {
  constructor(scene, x, y, z) {
    this.name = 'Você';
    this.scene = scene;
    this.pos = new THREE.Vector3(x, y, z);
    this.vy = 0;
    this.onGround = false;
    this.radius = 0.5;
    this.height = 2.0;
    this.speed = 6.5;
    this.hp = 100;
    this.maxHp = 100;
    this.shield = 0;      // barra azul, máx 100 (mini escudos até 50)
    this.maxShield = 100;
    this.alive = true;
    this.flash = 0;
    this.animT = 0;
    this.crouching = false;

    this.phase = 'bus'; // 'bus' | 'freefall' | 'glider' | 'playing'
    this.glider = null;

    // 5 slots (armas e curas); slot vazio = picareta
    this.slots = [null, null, null, null, null];
    this.activeSlot = 0;
    this.fireCooldown = 0;
    this.swingT = 0;
    this.healing = null; // { left, total, item }

    const char = buildCharacter({ shirt: 0x3fa7ff, pants: 0x2b3a52 });
    this.char = char;
    this.mesh = char.group;
    this.mesh.position.copy(this.pos);
    scene.add(this.mesh);

    this.shadow = makeBlobShadow(scene);
    this.refreshHeld();
  }

  // activeSlot -1 = modo picareta (tecla G)
  get item() {
    return this.activeSlot >= 0 ? this.slots[this.activeSlot] : null;
  }
  get weapon() {
    const it = this.item;
    return it && it.kind === 'weapon' ? it : null;
  }

  selectPickaxe() {
    if (this.activeSlot === -1) return;
    this.activeSlot = -1;
    this.healing = null;
    this.refreshHeld();
  }

  refreshHeld() {
    while (this.char.gunMount.children.length) {
      this.char.gunMount.remove(this.char.gunMount.children[0]);
    }
    const it = this.item;
    if (!it) this.char.gunMount.add(buildPickaxeMesh());
    else this.char.gunMount.add(buildItemMesh(it));
  }

  selectSlot(i) {
    if (i === this.activeSlot) return;
    this.activeSlot = i;
    this.healing = null;
    this.refreshHeld();
  }

  pickupItem(item) {
    let idx = this.slots.findIndex((s) => !s);
    if (idx === -1) {
      // inventário cheio: troca com o slot ativo (ou o 1º, se estiver de picareta)
      const swap = this.activeSlot >= 0 ? this.activeSlot : 0;
      if (this.slots[swap]) {
        spawnPickup(game, this.pos.x + 1, this.pos.z + 1, this.slots[swap]);
      }
      idx = swap;
    }
    this.slots[idx] = item;
    this.activeSlot = idx;
    this.healing = null;
    this.refreshHeld();
  }

  // --- fases aéreas ---
  startFreefall() {
    this.phase = 'freefall';
    this.vy = -2;
  }

  deployGlider() {
    if (this.phase !== 'freefall') return;
    this.phase = 'glider';
    this.glider = makeGlider(0x3fa7ff);
    this.mesh.add(this.glider);
    AudioSys.play('glider');
  }

  land() {
    this.phase = 'playing';
    if (this.glider) {
      this.mesh.remove(this.glider);
      this.glider = null;
    }
    this.mesh.rotation.x = 0;
  }

  update(dt, predictionOnly = false) {
    if (!this.alive) return;

    const yaw = game.camYaw;
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    // direita = forward × up
    const rxv = -fz;
    const rzv = fx;

    let mx = 0;
    let mz = 0;
    if (input.keys['KeyW']) { mx += fx;  mz += fz; }
    if (input.keys['KeyS']) { mx -= fx;  mz -= fz; }
    if (input.keys['KeyD']) { mx += rxv; mz += rzv; }
    if (input.keys['KeyA']) { mx -= rxv; mz -= rzv; }
    const len = Math.hypot(mx, mz) || 1;
    mx /= len;
    mz /= len;
    const hasMove = Math.hypot(mx, mz) > 0.01 && (input.keys['KeyW'] || input.keys['KeyA'] || input.keys['KeyS'] || input.keys['KeyD']);

    // ---------- NO ÔNIBUS ----------
    if (this.phase === 'bus') {
      this.pos.copy(game.bus.group.position).add(new THREE.Vector3(0, -3.2, 0));
      if (input.jumpQueued) {
        input.jumpQueued = false;
        this.startFreefall();
      }
      this.syncMesh(false);
      return;
    }

    // ---------- QUEDA LIVRE ----------
    if (this.phase === 'freefall') {
      this.vy = Math.max(-38, this.vy - 30 * dt);
      this.pos.y += this.vy * dt;
      if (hasMove) {
        this.pos.x += mx * 13 * dt;
        this.pos.z += mz * 13 * dt;
      }
      this.mesh.rotation.x = 0.9; // mergulho estilo skydive
      const ground = groundAt(this.pos.x, this.pos.z, this.pos.y);
      if (input.jumpQueued) {
        input.jumpQueued = false;
        this.deployGlider();
      } else if (this.pos.y - ground < 32) {
        this.deployGlider(); // abre sozinho perto do chão
      }
      this.syncMesh(false);
      return;
    }

    // ---------- PLANANDO ----------
    if (this.phase === 'glider') {
      input.jumpQueued = false; // evita pular sozinho ao pousar
      this.mesh.rotation.x = 0.15;
      this.vy += (-6 - this.vy) * Math.min(1, dt * 3);
      this.pos.y += this.vy * dt;
      if (hasMove) {
        this.pos.x += mx * 10 * dt;
        this.pos.z += mz * 10 * dt;
      }
      const ground = groundAt(this.pos.x, this.pos.z, this.pos.y);
      if (this.pos.y <= ground) {
        this.pos.y = ground;
        this.vy = 0;
        this.land();
      }
      this.syncMesh(false);
      return;
    }

    // ---------- JOGANDO ----------
    this.crouching = !!input.keys[binds.crouch];
    const speed = this.crouching ? this.speed * 0.5 : this.speed;

    if (hasMove && !invOpen) {
      resolveMovement3D(this, mx * speed * dt, mz * speed * dt, game.frameColliders);
    }

    // gravidade / pulo (chão dinâmico: terreno, pisos, rampas, telhados)
    const ground = groundAt(this.pos.x, this.pos.z, this.pos.y);
    this.vy -= 22 * dt;
    this.pos.y += this.vy * dt;
    if (this.pos.y <= ground) {
      this.pos.y = ground;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
    if (input.jumpQueued) {
      input.jumpQueued = false;
      if (this.onGround && !this.crouching) {
        this.vy = 8.5;
        this.onGround = false;
        AudioSys.play('jump');
      }
    }

    // O convidado prevê só movimento. Dano, loot, cura e construção ficam no host.
    if (predictionOnly) { this.syncMesh(hasMove && this.onGround, dt); return; }

    // ---------- clique esquerdo: atirar / picaretar / curar ----------
    this.fireCooldown -= dt;
    if (this.swingT > 0) this.swingT -= dt;

    if (input.mouseDown && !invOpen) {
      const it = this.item;
      if (!it) {
        // picareta
        if (this.fireCooldown <= 0) {
          this.fireCooldown = 0.5;
          this.swingT = 0.4;
          doPickaxeHit(this);
        }
      } else if (it.kind === 'weapon') {
        if (this.fireCooldown <= 0) {
          this.fireCooldown = it.fireRate;
          const aimPoint = aimRaycast(); // ponto exato sob a mira
          const muzzle = this.pos.clone().add(new THREE.Vector3(fx * 0.7, 1.4, fz * 0.7));
          const dir = aimPoint.sub(muzzle).normalize();
          fireWeapon(this, muzzle, dir, it, 0.35); // jogador atira BEM mais preciso que os bots
          AudioSys.shot(it.typeId);
        }
      } else if (it.kind === 'heal' && !this.healing) {
        const cur = it.stat === 'shield' ? this.shield : this.hp;
        if (cur < it.cap) this.healing = { left: it.castTime, total: it.castTime, item: it };
      }
    }

    // canal de cura em andamento
    if (this.healing) {
      const h = this.healing;
      if (this.item !== h.item) {
        this.healing = null;
      } else {
        h.left -= dt;
        if (h.left <= 0) {
          if (h.item.stat === 'shield') {
            this.shield = Math.min(h.item.cap, this.shield + h.item.heal);
          } else {
            this.hp = Math.min(h.item.cap, this.hp + h.item.heal);
          }
          h.item.usesLeft--;
          AudioSys.play('heal');
          if (h.item.usesLeft <= 0) {
            this.slots[this.activeSlot] = null;
            this.refreshHeld();
          }
          this.healing = null;
        }
      }
    }

    // construir (parede/rampa/piso/pirâmide)
    if (input.buildQueued && !invOpen) {
      const kind = input.buildQueued;
      input.buildQueued = null;
      if (game.build.tryPlace(kind, this.pos.x, this.pos.y, this.pos.z, game.camYaw, livingEntities())) {
        AudioSys.play('build');
      }
    } else {
      input.buildQueued = null;
    }

    // trocar slot / sacar picareta (G)
    if (input.slotQueued >= 0) {
      this.selectSlot(input.slotQueued);
      input.slotQueued = -1;
    }
    if (input.pickaxeQueued) {
      input.pickaxeQueued = false;
      this.selectPickaxe();
    }

    this.syncMesh(hasMove && this.onGround, dt);
  }

  syncMesh(walking, dt = 0.016) {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = game.camYaw;

    // agachar: encolhe o boneco
    const targetScale = this.crouching && this.phase === 'playing' ? 0.75 : 1;
    this.mesh.scale.y += (targetScale - this.mesh.scale.y) * 0.25;
    this.height = 2.0 * this.mesh.scale.y;

    // arma/picareta acompanha a mira; balanço da picareta
    let swingRot = 0;
    if (this.swingT > 0) swingRot = -Math.sin((this.swingT / 0.4) * Math.PI) * 1.6;
    this.char.gunMount.rotation.x = (this.phase === 'playing' ? -game.camPitch : 0) + swingRot;

    if (walking) this.animT += dt * 9;
    const swing = walking ? Math.sin(this.animT) * 0.55 : 0;
    this.char.legL.rotation.x = swing;
    this.char.legR.rotation.x = -swing;
    this.char.armL.rotation.x = -swing * 0.7;
    // braço direito segura a arma/picareta erguida (acompanha a mira)
    this.char.armR.rotation.x =
      this.phase === 'playing' ? -1.3 - game.camPitch * 0.4 + swingRot * 0.5 : swing * 0.7;

    const ground = this.phase === 'playing'
      ? groundAt(this.pos.x, this.pos.z, this.pos.y)
      : terrainHeight(this.pos.x, this.pos.z);
    this.shadow.position.set(this.pos.x, ground + 0.05, this.pos.z);

    if (this.flash > 0) this.flash -= dt;
    const f2 = Math.max(0, this.flash / 0.12) * 0.9;
    for (const m of this.char.mats) m.emissive.setRGB(f2, f2, f2);
  }

  die() {
    this.alive = false;
    this.mesh.visible = false;
    this.shadow.visible = false;
  }
}
