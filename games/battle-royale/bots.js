// bots.js — bots que pulam do ônibus, planam até o chão e lutam com IA simples;
// cada um tem um nível de habilidade (ruim → médio, nunca bom)

const BOT_COLORS = [0xff5e5e, 0xffa93d, 0xc66bff, 0x4dd0a6, 0xf06292, 0x7986cb, 0xa1887f, 0x4db6e2];

class Bot {
  constructor(scene, index, dropT) {
    this.name = `Bot ${index + 1}`;
    this.colorHex = BOT_COLORS[index % BOT_COLORS.length];
    this.pos = new THREE.Vector3(0, 120, 0);
    this.radius = 0.5;
    this.height = 2.0;
    this.hp = 100;
    this.maxHp = 100;
    this.shield = 0;
    this.alive = true;
    this.flash = 0;
    this.yaw = Math.random() * Math.PI * 2;
    this.animT = 0;

    // nível: 0 = ruim, 0.5 = médio (nunca chega perto de "bom")
    this.skill = Math.random() * 0.5;
    this.speed = 4.8 + this.skill * 1.4;
    this.aimErr = 0.12 - this.skill * 0.12;        // erro de pontaria
    this.cdMult = 3.2 - this.skill * 2;            // demora entre tiros
    this.detect = 45 + this.skill * 30;            // distância que enxerga
    this.canBuild = this.skill > 0.22;             // os médios sabem construir
    this.buildCd = 2;
    this.lastHp = 100;

    this.phase = 'bus'; // 'bus' | 'air' | 'playing'
    this.dropT = dropT; // fração da rota do ônibus em que pula
    this.landSpot = null;
    this.glider = null;

    this.lootWeapon = randomWeapon(0);
    this.weapon = {
      ...this.lootWeapon,
      damage: Math.max(2, Math.round(this.lootWeapon.damage * (0.4 + this.skill * 0.3))),
    };
    this.fireCooldown = 1 + Math.random();
    this.decisionTimer = 0;
    this.strafeDir = 1;
    this.wanderTarget = null;

    this.characterId=['swat','forest','desert','night','classic','swat-bl'][index%6];
    const char = buildImportedCharacter(this.characterId)||buildCharacter({
      shirt: this.colorHex,
      pants: 0x33383f,
      hair: [0x2a1a10, 0x5a4a20, 0x1a1a1a][index % 3],
    });
    this.char = char;
    this.mesh = char.group;
    this.mesh.visible = false; // dentro do ônibus
    scene.add(this.mesh);
    char.gunMount.add(buildGunMesh(this.weapon));

    this.tag = makeNameTag(this.name);
    this.mesh.add(this.tag.sprite);
    this.shadow = makeBlobShadow(scene);
    this.shadow.visible = false;
  }

  startAir(busPos) {
    this.phase = 'air';
    this.pos.copy(busPos).add(new THREE.Vector3((Math.random() - 0.5) * 4, -3.2, (Math.random() - 0.5) * 4));
    this.mesh.visible = true;
    this.shadow.visible = true;
    // escolhe um lugar para pousar perto de onde pulou
    const a = Math.random() * Math.PI * 2;
    const d = 20 + Math.random() * 60;
    this.landSpot = {
      x: Math.max(-HALF_WORLD + 10, Math.min(HALF_WORLD - 10, this.pos.x + Math.cos(a) * d)),
      z: Math.max(-HALF_WORLD + 10, Math.min(HALF_WORLD - 10, this.pos.z + Math.sin(a) * d)),
    };
    this.vy = -10;
  }

  updateAir(dt) {
    const ground = terrainHeight(this.pos.x, this.pos.z);
    const high = this.pos.y - ground > 30;
    this.vy = high ? Math.max(-30, this.vy - 25 * dt) : -6;
    if (!high && !this.glider) {
      this.glider = makeGlider(this.colorHex);
      this.mesh.add(this.glider);
    }
    this.pos.y += this.vy * dt;

    // guia até o ponto de pouso
    const dx = this.landSpot.x - this.pos.x;
    const dz = this.landSpot.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 2) {
      this.pos.x += (dx / d) * 8 * dt;
      this.pos.z += (dz / d) * 8 * dt;
      this.yaw = Math.atan2(dx, dz);
    }

    if (this.pos.y <= ground) {
      this.pos.y = ground;
      this.phase = 'playing';
      if (this.glider) {
        this.mesh.remove(this.glider);
        this.glider = null;
      }
    }
    this.syncMesh(false, dt);
  }

  update(dt) {
    if (!this.alive) return;
    if (this.phase === 'bus') return;
    if (this.phase === 'air') {
      this.updateAir(dt);
      return;
    }

    this.fireCooldown -= dt;
    this.decisionTimer -= dt;
    if (this.flash > 0) this.flash -= dt;

    const zone = game.zone;
    let moveX = 0;
    let moveZ = 0;
    let speed = this.speed;

    this.senseTimer=(this.senseTimer??Math.random()*.2)-dt;
    let target = this.target?.alive?this.target:null;
    let best = target?Math.hypot(target.pos.x-this.pos.x,target.pos.z-this.pos.z):Infinity;
    if(this.senseTimer<=0){this.senseTimer=.2;best=Infinity;target=null;
    for (const e of livingEntities()) {
      if (e === this || e.phase !== 'playing') continue;
      const d = Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z);
      if (d < best) {
        best = d;
        target = e;
      }
    }
    this.target=target;}

    const outside = !zone.contains(this.pos.x, this.pos.z);

    if (outside) {
      const a = Math.atan2(zone.x - this.pos.x, zone.z - this.pos.z);
      moveX = Math.sin(a);
      moveZ = Math.cos(a);
      this.yaw = a;
      speed *= 1.2;
    } else if (target && best < this.detect) {
      const a = Math.atan2(target.pos.x - this.pos.x, target.pos.z - this.pos.z);
      this.yaw = a;

      if (this.decisionTimer <= 0) {
        this.decisionTimer = 0.8 + Math.random();
        this.strafeDir = Math.random() < 0.5 ? -1 : 1;
      }

      let advance = 0;
      if (best > 30) advance = 1;
      else if (best < 16) advance = -1;

      moveX = Math.sin(a) * advance + Math.cos(a) * this.strafeDir * 0.8;
      moveZ = Math.cos(a) * advance - Math.sin(a) * this.strafeDir * 0.8;

      if (best < 45 && this.fireCooldown <= 0) {
        this.fireCooldown = this.weapon.fireRate * this.cdMult + Math.random() * 0.6;
        const muzzle = this.pos.clone().add(new THREE.Vector3(Math.sin(a) * 0.7, 1.4, Math.cos(a) * 0.7));
        const aimAt = target.pos.clone().add(new THREE.Vector3(0, 1.3, 0));
        const dir = aimAt.sub(muzzle).normalize();
        applySpread(dir, this.aimErr); // bots ruins erram MUITO
        fireWeapon(this, muzzle, dir, this.weapon);
        AudioSys.shot(this.weapon.typeId);
      }

      // bots médios levantam uma parede quando estão apanhando
      this.buildCd -= dt;
      if (this.canBuild && this.buildCd <= 0 && this.hp < this.lastHp - 0.5) {
        this.buildCd = 5 + Math.random() * 5;
        game.build.tryPlace('wall', this.pos.x, this.pos.y, this.pos.z, this.yaw, livingEntities(), { free: true });
      }
    } else {
      const needNew =
        !this.wanderTarget ||
        this.decisionTimer <= 0 ||
        Math.hypot(this.wanderTarget.x - this.pos.x, this.wanderTarget.z - this.pos.z) < 4;
      if (needNew) {
        this.decisionTimer = 3 + Math.random() * 4;
        const ang = Math.random() * Math.PI * 2;
        const r = Math.random() * zone.radius * 0.8;
        this.wanderTarget = { x: zone.x + Math.cos(ang) * r, z: zone.z + Math.sin(ang) * r };
      }
      const a = Math.atan2(this.wanderTarget.x - this.pos.x, this.wanderTarget.z - this.pos.z);
      moveX = Math.sin(a);
      moveZ = Math.cos(a);
      this.yaw = a;
      speed *= 0.6;
    }

    for (const b of game.bots) {
      if (b === this || !b.alive) continue;
      const d = Math.hypot(b.pos.x - this.pos.x, b.pos.z - this.pos.z);
      if (d < 2.5 && d > 0.01) {
        moveX += ((this.pos.x - b.pos.x) / d) * 0.6;
        moveZ += ((this.pos.z - b.pos.z) / d) * 0.6;
      }
    }

    const len = Math.hypot(moveX, moveZ);
    let moving = false;
    if (len > 0.01) {
      moving = true;
      const prior=this.pos.clone();resolveMovement3D(this, (moveX / len) * speed * dt, (moveZ / len) * speed * dt, game.frameColliders);
      if(this.pos.distanceToSquared(prior)<.0001){this.stuckTime=(this.stuckTime||0)+dt;const turn=this.yaw+Math.PI/2;resolveMovement3D(this,Math.sin(turn)*speed*dt,Math.cos(turn)*speed*dt,game.frameColliders);if(this.stuckTime>1){this.wanderTarget={x:this.pos.x+Math.sin(turn)*12,z:this.pos.z+Math.cos(turn)*12};this.decisionTimer=2;}}else this.stuckTime=0;
    }

    // bots acompanham o chão dinâmico (rampas, pisos, telhados)
    const ground = groundAt(this.pos.x, this.pos.z, this.pos.y + 0.6);
    this.pos.y += (ground - this.pos.y) * Math.min(1, dt * 10);

    this.lastHp = this.hp;
    this.syncMesh(moving, dt);
  }

  syncMesh(moving, dt) {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.yaw;
    if(game?.player&&this.pos.distanceToSquared(game.player.pos)>100*100)return;

    if (moving) this.animT += dt * 9;
    const swing = moving ? Math.sin(this.animT) * 0.55 : 0;
    this.char.legL.rotation.x = swing;
    this.char.legR.rotation.x = -swing;
    this.char.armL.rotation.x = -swing * 0.7;
    this.char.armR.rotation.x = -1.3; // braço direito sempre segurando a arma
    this.char.animate?.({moving,dt,phase:this.phase,weapon:true});

    this.shadow.position.set(this.pos.x, terrainHeight(this.pos.x, this.pos.z) + 0.05, this.pos.z);
    this.tag.update(this.hp / this.maxHp);

    const f = Math.max(0, this.flash / 0.12) * 0.9;
    for (const m of this.char.mats) m.emissive?.setRGB(f, f, f);
  }

  die() {
    this.alive = false;
    this.mesh.visible = false;
    this.shadow.visible = false;
    spawnPickup(game, this.pos.x, this.pos.z, this.lootWeapon);
  }
}
