// zone.js — a tempestade 3D: parede cilíndrica roxa que encolhe em fases

class Zone {
  constructor(scene) {
    this.x = 0;
    this.z = 0;
    this.radius = HALF_WORLD*Math.SQRT2+15;

    // 5 safes: a primeira fecha bem devagar e cada uma seguinte fecha mais
    // rápido; a última fecha POR COMPLETO (raio 0 = tempestade toma tudo)
    this.phases = [
      { wait: 45, shrink: 50, radius: 240, dps: 1 },
      { wait: 30, shrink: 35, radius: 150, dps: 2 },
      { wait: 22, shrink: 26, radius: 90,  dps: 4 },
      { wait: 18, shrink: 18, radius: 45,  dps: 7 },
      { wait: 14, shrink: 12, radius: 0,   dps: 12 },
    ];
    if(activeMapId!=='classic')for(const p of this.phases){p.radius*=WORLD_SIZE/800;p.wait*=Math.sqrt(WORLD_SIZE/800);p.shrink*=Math.sqrt(WORLD_SIZE/800);}
    this.phaseIndex = 0;
    this.state = 'waiting'; // 'waiting' | 'shrinking' | 'done'
    this.timer = this.phases[0].wait;
    this.duration = 0;

    this.computeNextTarget();

    // parede da tempestade (cilindro translúcido, raio 1 escalado)
    this.wallMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 260, 64, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xa03df0,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.wallMesh.frustumCulled = false;
    scene.add(this.wallMesh);

    // anel branco no chão marcando a próxima zona
    const ringPos = new Float32Array(64 * 3);
    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
    this.targetRing = new THREE.LineLoop(
      ringGeo,
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    this.targetRing.frustumCulled = false;
    scene.add(this.targetRing);

    this.updateMeshes();
  }

  get dps() {
    const i = Math.min(this.phaseIndex, this.phases.length - 1);
    return this.phases[i].dps;
  }

  // sorteia o próximo círculo, sempre contido no atual
  computeNextTarget() {
    const phase = this.phases[this.phaseIndex];
    const maxOffset = Math.max(0, this.radius - phase.radius);
    const angle = Math.random() * Math.PI * 2;
    const d = Math.random() * maxOffset * 0.8;
    this.targetX = this.x + Math.cos(angle) * d;
    this.targetZ = this.z + Math.sin(angle) * d;
    this.targetRadius = phase.radius;
  }

  update(dt) {
    if (this.state === 'done') return;
    this.timer -= dt;
    const phase = this.phases[this.phaseIndex];

    if (this.state === 'waiting') {
      if (this.timer <= 0) {
        this.state = 'shrinking';
        this.timer = phase.shrink;
        this.duration = phase.shrink;
        this.startX = this.x;
        this.startZ = this.z;
        this.startRadius = this.radius;
      }
    } else if (this.state === 'shrinking') {
      const t = Math.min(1, Math.max(0, 1 - this.timer / this.duration));
      this.x = this.startX + (this.targetX - this.startX) * t;
      this.z = this.startZ + (this.targetZ - this.startZ) * t;
      this.radius = this.startRadius + (this.targetRadius - this.startRadius) * t;

      if (this.timer <= 0) {
        this.x = this.targetX;
        this.z = this.targetZ;
        this.radius = this.targetRadius;
        this.phaseIndex++;
        if (this.phaseIndex >= this.phases.length) {
          this.state = 'done';
        } else {
          this.state = 'waiting';
          this.timer = this.phases[this.phaseIndex].wait;
          this.computeNextTarget();
        }
      }
    }
  }

  // sincroniza as malhas 3D com o estado lógico
  updateMeshes() {
    this.wallMesh.scale.set(this.radius, 1, this.radius);
    this.wallMesh.position.set(this.x, 120, this.z);

    this.targetRing.visible = this.state !== 'done';
    if (this.targetRing.visible) {
      const attr = this.targetRing.geometry.attributes.position;
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        const px = this.targetX + Math.cos(a) * this.targetRadius;
        const pz = this.targetZ + Math.sin(a) * this.targetRadius;
        attr.setXYZ(i, px, terrainHeight(px, pz) + 0.4, pz);
      }
      attr.needsUpdate = true;
    }
  }

  contains(x, z) {
    const dx = x - this.x;
    const dz = z - this.z;
    return dx * dx + dz * dz <= this.radius * this.radius;
  }

  statusText() {
    if (this.state === 'waiting') return `🌀 Zona ${this.phaseIndex + 1}/5 encolhe em ${Math.ceil(this.timer)}s`;
    if (this.state === 'shrinking') return '⚠️ A ZONA ESTÁ ENCOLHENDO!';
    return '⛈️ A tempestade fechou tudo!';
  }
}
