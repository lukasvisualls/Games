/**
 * VICE CITY ENGINE - GTA 6 Fan Replica
 * Fully-featured 2D GTA simulation with physical cars, pedestrians, police, wanted levels, weapons, 
 * day/night cycle, mini-map, phone missions and procedural synth audio radio!
 */

// GLOBAL CONSTANTS & CONFIGURATION
const MAP_SIZE = 3600; // Game map width and height (pixels)
const ROAD_WIDTH = 220;
const SIDEWALK_WIDTH = 30;
const CHUNK_SIZE = 600; // Grid based procedural distribution

// Audio system handles sound effects and music procedurally (Web Audio API)
class AudioSystem {
  constructor() {
    this.ctx = null;
    this.isPlayingRadio = false;
    this.radioScheduler = null;
    this.radioStation = 0;
    this.tempo = 115;
    this.step = 0;
    this.currentInstrument = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.stations = [
      { name: 'VICE SYNTHWAVE', genre: 'Retrowave Synth', color: '#ec4899' },
      { name: 'LEONIDA BEATS', genre: 'Classic Latin Synth', color: '#a855f7' },
      { name: 'WAVE 103 AMBIENT', genre: 'Dreamy Ambient Retro', color: '#06b6d4' }
    ];
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Start procedural radio sequencer
    this.startRadio();
    // Setup motor hum
    this.setupEngineSynth();
  }

  setupEngineSynth() {
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(35, this.ctx.currentTime);
      
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // start silent
      
      // Lowpass filter to make it sound rumbling and deep like a car engine
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
    } catch(e) {
      console.warn("Failed to initiate synthetic engine sound", e);
    }
  }

  setEnginePitch(speed, active) {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    try {
      if (active) {
        const targetFreq = 35 + (speed * 12);
        const targetVol = Math.min(0.12, 0.02 + (speed * 0.015));
        this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
        this.engineGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.15);
      } else {
        this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      }
    } catch(e){}
  }

  playShot() {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      whiteNoise.start();
    } catch(e){}
  }

  playExplosion() {
    if (!this.ctx) return;
    try {
      const duration = 0.8;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch(e){}
  }

  playBeep() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch(e){}
  }

  startRadio() {
    this.isPlayingRadio = true;
    const interval = (60 / this.tempo) / 4 * 1000; // 16th notes
    
    // Procedural Music Synthesizer Loop (Generating infinite vice city style soundtrack)
    this.radioScheduler = setInterval(() => {
      if (!this.isPlayingRadio || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const bar = Math.floor(this.step / 16);
        const beat = Math.floor((this.step % 16) / 4);
        const sub = this.step % 4;

        // Base scales depending on current radio channel
        const scales = [
          [55, 65.41, 73.42, 82.41, 98.00], // Synthwave (A minor vibes)
          [65.41, 77.78, 87.31, 97.99, 116.54], // Latin (C minor/Phrygian)
          [48.99, 58.27, 65.41, 73.42, 87.31] // Dreamy Ambient
        ];
        const activeScale = scales[this.radioStation];

        // 1. Synth Bassline (every 8th note)
        if (sub === 0 || sub === 2) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = this.radioStation === 0 ? 'sawtooth' : 'triangle';
          
          let noteIdx = (bar % 4 === 3) ? 2 : (bar % 2);
          if (this.radioStation === 2) noteIdx = (bar % 3);

          osc.frequency.setValueAtTime(activeScale[noteIdx] * 0.5, t);
          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.002, t + 0.25);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.28);
        }

        // 2. Synthesizer Arpeggiator Lead
        if (this.radioStation === 0 && sub === 1) {
          // Rapid futuristic synth notes
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          const arpFreq = activeScale[this.step % activeScale.length] * 2;
          osc.frequency.setValueAtTime(arpFreq, t);
          gain.gain.setValueAtTime(0.03, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.16);
        }

        // 3. Simple rhythm beat (Kick & Snare simulation)
        // Kick on 1 and 3 beats
        if (this.radioStation !== 2 && sub === 0 && (beat === 0 || beat === 2)) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.frequency.setValueAtTime(150, t);
          kickOsc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
          kickGain.gain.setValueAtTime(0.25, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          kickOsc.connect(kickGain);
          kickGain.connect(this.ctx.destination);
          kickOsc.start(t);
          kickOsc.stop(t + 0.14);
        }
        // Snare on 2 and 4 beats
        if (this.radioStation !== 2 && sub === 0 && (beat === 1 || beat === 3)) {
          const snareFilter = this.ctx.createBiquadFilter();
          snareFilter.type = 'highpass';
          snareFilter.frequency.setValueAtTime(800, t);
          
          const snareOsc = this.ctx.createOscillator();
          const snareGain = this.ctx.createGain();
          snareOsc.type = 'triangle';
          snareOsc.frequency.setValueAtTime(180, t);
          
          snareGain.gain.setValueAtTime(0.12, t);
          snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
          
          snareOsc.connect(snareFilter);
          snareFilter.connect(snareGain);
          snareGain.connect(this.ctx.destination);
          snareOsc.start(t);
          snareOsc.stop(t + 0.16);
        }

        this.step = (this.step + 1) % 64;
      } catch(e) {}
    }, interval);
  }

  nextStation() {
    this.radioStation = (this.radioStation + 1) % this.stations.length;
    this.playBeep();
    this.updateHUD();
  }

  prevStation() {
    this.radioStation = (this.radioStation - 1 + this.stations.length) % this.stations.length;
    this.playBeep();
    this.updateHUD();
  }

  updateHUD() {
    const active = this.stations[this.radioStation];
    const radioNameEl = document.getElementById('radio-station-name');
    const radioGenreEl = document.getElementById('radio-track-title');
    const radioBadge = document.getElementById('radio-station-hud');

    if (radioNameEl) radioNameEl.innerText = active.name;
    if (radioGenreEl) radioGenreEl.innerText = active.genre;
    if (radioBadge) {
      radioBadge.style.borderColor = `${active.color}40`;
    }
  }
}

const audio = new AudioSystem();

// GAME ENTITIES CLASSES
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  set(x, y) {
    this.x = x;
    this.y = y;
  }
  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }
  sub(v) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }
  mult(n) {
    return new Vector2(this.x * n, this.y * n);
  }
  div(n) {
    return new Vector2(this.x / n, this.y / n);
  }
  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  normalize() {
    const m = this.mag();
    return m !== 0 ? this.div(m) : new Vector2(0, 0);
  }
  dist(v) {
    return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
  }
  heading() {
    return Math.atan2(this.y, this.x);
  }
}

// Particle system for visual sparks, smoke, explosions and gun sparks
class Particle {
  constructor(pos, vel, color, size, maxLife, type = 'smoke') {
    this.pos = new Vector2(pos.x, pos.y);
    this.vel = new Vector2(vel.x, vel.y);
    this.color = color;
    this.size = size;
    this.maxLife = maxLife;
    this.life = maxLife;
    this.type = type; // smoke, fire, bullet, spark, blood
  }

  update() {
    this.pos = this.pos.add(this.vel);
    this.life -= 1;
    if (this.type === 'smoke') {
      this.size += 0.15;
      this.vel = this.vel.mult(0.96);
    } else if (this.type === 'fire') {
      this.size = Math.max(0.1, this.size - 0.12);
      this.vel = this.vel.mult(0.95);
    } else if (this.type === 'spark') {
      this.vel = this.vel.mult(0.92);
    } else if (this.type === 'blood') {
      this.vel = this.vel.mult(0.88);
      this.size = Math.max(0.5, this.size - 0.05);
    }
  }

  draw(ctx, camera) {
    const screenX = this.pos.x - camera.pos.x + camera.offset.x;
    const screenY = this.pos.y - camera.pos.y + camera.offset.y;
    
    ctx.save();
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = this.type === 'fire' || this.type === 'spark' ? 10 : 0;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Weapon configuration
const WEAPONS = [
  { id: 'pistol', name: 'PISTOLA 9MM', icon: 'https://img.icons8.com/ios-filled/100/ffffff/pistol.png', damage: 25, maxAmmo: 120, clipSize: 12, ammo: 12, maxRange: 450, fireRate: 350 },
  { id: 'smg', name: 'SUBMETRALHADORA', icon: 'https://img.icons8.com/ios-filled/100/ffffff/submachine-gun.png', damage: 30, maxAmmo: 250, clipSize: 30, ammo: 30, maxRange: 550, fireRate: 110 },
  { id: 'bazooka', name: 'LANÇA-FOGUETES', icon: 'https://img.icons8.com/ios-filled/100/ffffff/bazooka.png', damage: 150, maxAmmo: 5, clipSize: 1, ammo: 1, maxRange: 700, fireRate: 1800 }
];

// Pedestrian (AI civilians and target/mission targets)
class Pedestrian {
  constructor(x, y, isCop = false) {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(0, 0);
    this.angle = Math.random() * Math.PI * 2;
    this.speed = isCop ? 2.5 : 1.2;
    this.health = 100;
    this.radius = 14;
    this.isCop = isCop;
    this.alerted = false;
    this.shootCooldown = 0;
    this.patrolDir = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    this.patrolTimer = Math.random() * 200;
    this.color = isCop ? '#1e3a8a' : ['#f43f5e', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#d946ef'][Math.floor(Math.random() * 6)];
  }

  update(player, game) {
    if (this.health <= 0) return;

    if (this.shootCooldown > 0) this.shootCooldown--;

    const distToPlayer = this.pos.dist(player.pos);

    if (this.isCop) {
      // Police chasing player if wanted level is above 0
      if (game.wantedLevel > 0 && !player.isDead) {
        this.alerted = true;
        const dir = player.pos.sub(this.pos).normalize();
        this.angle = dir.heading();
        
        if (distToPlayer > 120) {
          this.pos = this.pos.add(dir.mult(this.speed));
        }

        // Shoot at player within range
        if (distToPlayer < 400 && this.shootCooldown <= 0) {
          this.shootAt(player, game);
          this.shootCooldown = 60 + Math.random() * 40;
        }
      } else {
        this.alerted = false;
        this.patrol();
      }
    } else {
      // Civilian reaction to threats
      if (game.wantedLevel > 0 && distToPlayer < 350) {
        this.alerted = true;
        // Run away from player/shooting
        const escapeDir = this.pos.sub(player.pos).normalize();
        this.angle = escapeDir.heading();
        this.pos = this.pos.add(escapeDir.mult(this.speed * 2));
      } else {
        this.alerted = false;
        this.patrol();
      }
    }

    // Border collision limiters
    this.pos.x = Math.max(50, Math.min(MAP_SIZE - 50, this.pos.x));
    this.pos.y = Math.max(50, Math.min(MAP_SIZE - 50, this.pos.y));
  }

  patrol() {
    this.patrolTimer--;
    if (this.patrolTimer <= 0) {
      this.patrolDir = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
      this.patrolTimer = 100 + Math.random() * 200;
    }
    this.angle = this.patrolDir.heading();
    this.pos = this.pos.add(this.patrolDir.mult(this.speed));
  }

  shootAt(target, game) {
    audio.playShot();
    game.createSparks(this.pos, this.angle, '#fbbf24', 5);
    
    // Check hit rate based on distance
    const chance = Math.random();
    if (chance > 0.4) {
      const damage = 12;
      target.damage(damage, game);
    }
  }

  damage(amount, game) {
    this.health -= amount;
    game.createSparks(this.pos, this.angle + Math.PI, '#ef4444', 12, 'blood'); // Blood splatters
    if (this.health <= 0) {
      game.score += 150;
      game.hudCash += 150;
      game.pedsKilled++;
      if (this.isCop) {
        game.wantedLevel = Math.min(5, game.wantedLevel + 1);
        game.score += 300;
        game.hudCash += 300;
      } else {
        if (Math.random() > 0.5) game.wantedLevel = Math.min(5, game.wantedLevel + 1);
      }
      game.triggerStarsFlash();
    }
  }

  draw(ctx, camera) {
    const screenX = this.pos.x - camera.pos.x + camera.offset.x;
    const screenY = this.pos.y - camera.pos.y + camera.offset.y;

    if (screenX < -50 || screenX > camera.width + 50 || screenY < -50 || screenY > camera.height + 50) return;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(this.angle);

    // Dead / Wasted drawing
    if (this.health <= 0) {
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(-2, 2, this.radius + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#27272a';
      ctx.fillRect(-this.radius, -this.radius / 2, this.radius * 2, this.radius);
      ctx.restore();
      return;
    }

    // Shadow
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetY = 4;

    // Pedestrian body (head, arms, clothes)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fbcfe8'; // Skin tone
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Cap/Hair
    ctx.fillStyle = this.isCop ? '#1e3a8a' : '#111827';
    ctx.beginPath();
    ctx.arc(-3, 0, this.radius * 0.5, -Math.PI/2, Math.PI/2);
    ctx.fill();

    // Gun if Cop
    if (this.isCop || this.alerted) {
      ctx.fillStyle = '#374151';
      ctx.fillRect(8, 6, 12, 4);
    }

    ctx.restore();
  }
}

// Vehicle Class (Physically simulated cars)
class Vehicle {
  constructor(x, y, type = 'sedan') {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(0, 0);
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 0;
    this.maxSpeed = type === 'sports' ? 9.5 : type === 'police' ? 8.5 : 6.0;
    this.acceleration = type === 'sports' ? 0.22 : type === 'police' ? 0.20 : 0.14;
    this.friction = 0.985;
    this.steerSpeed = type === 'sports' ? 0.05 : 0.04;
    
    this.width = 75;
    this.height = 145;
    this.type = type; // sports, sedan, police, truck
    this.health = 200;
    this.isDead = false;
    this.occupied = false;
    
    // Choose neon color style
    this.color = type === 'sports' ? '#ec4899' : type === 'police' ? '#ffffff' : '#06b6d4';
    this.neonGlow = type === 'sports' || type === 'police';
  }

  update(player, game) {
    if (this.isDead) return;

    // Apply friction/drag
    this.speed *= this.friction;

    // Standard vector calculations for steering & movement vector
    const dir = new Vector2(Math.cos(this.angle), Math.sin(this.angle));
    this.vel = dir.mult(this.speed);
    this.pos = this.pos.add(this.vel);

    // Dynamic camera and particle fumes if driven by player
    if (this.occupied) {
      if (Math.abs(this.speed) > 2 && Math.random() > 0.6) {
        // Emit smoke particles from exhaust
        const exhaustPos = this.pos.sub(dir.mult(this.height/2));
        game.particles.push(new Particle(exhaustPos, new Vector2(-dir.x * 2, -dir.y * 2), 'rgba(156,163,175,0.4)', 6, 25, 'smoke'));
      }
    }

    // Limit screen boundaries
    this.pos.x = Math.max(100, Math.min(MAP_SIZE - 100, this.pos.x));
    this.pos.y = Math.max(100, Math.min(MAP_SIZE - 100, this.pos.y));
  }

  drive(forward, steer, handbrake) {
    if (forward === 1) {
      this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration);
    } else if (forward === -1) {
      this.speed = Math.max(-this.maxSpeed * 0.4, this.speed - this.acceleration);
    }

    if (steer !== 0 && Math.abs(this.speed) > 0.5) {
      const dirMultiplier = this.speed > 0 ? 1 : -1;
      this.angle += steer * this.steerSpeed * dirMultiplier;
    }

    if (handbrake) {
      this.speed *= 0.94; // Slide / Handbrake action
    }
  }

  damage(amount, game) {
    if (this.isDead) return;
    this.health -= amount;
    
    // Emit black smoke from engine when damaged
    if (this.health < 80 && Math.random() > 0.4) {
      const dir = new Vector2(Math.cos(this.angle), Math.sin(this.angle));
      const enginePos = this.pos.add(dir.mult(this.height/2));
      game.particles.push(new Particle(enginePos, new Vector2(Math.random() - 0.5, Math.random() - 0.5), '#374151', 8, 45, 'smoke'));
    }

    if (this.health <= 0) {
      this.isDead = true;
      audio.playExplosion();
      game.createExplosionEffect(this.pos);
      // If player inside, kill player
      if (this.occupied) {
        game.player.damage(100, game);
      }
    }
  }

  draw(ctx, camera) {
    const screenX = this.pos.x - camera.pos.x + camera.offset.x;
    const screenY = this.pos.y - camera.pos.y + camera.offset.y;

    if (screenX < -200 || screenX > camera.width + 200 || screenY < -200 || screenY > camera.height + 200) return;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(this.angle);

    // Neon Glow Underglow under sports cars
    if (this.neonGlow && !this.isDead) {
      ctx.shadowBlur = 24;
      ctx.shadowColor = this.color;
    }

    // Car shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-this.width / 2 + 5, -this.height / 2 + 5, this.width, this.height);

    // Main Chassis
    ctx.fillStyle = this.isDead ? '#1c1917' : this.color;
    ctx.beginPath();
    ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 12);
    ctx.fill();

    // Windshield / Windows
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(-this.width / 2 + 8, -this.height * 0.15, this.width - 16, this.height * 0.4, 6);
    ctx.fill();

    // Headlights (glowing yellow at night)
    if (!this.isDead) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-this.width / 2 + 10, -this.height / 2 + 5, 12, 6);
      ctx.fillRect(this.width / 2 - 22, -this.height / 2 + 5, 12, 6);
      
      // Tail lights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-this.width / 2 + 10, this.height / 2 - 10, 12, 6);
      ctx.fillRect(this.width / 2 - 22, this.height / 2 - 10, 12, 6);
    }

    // Police decals / Roof Siren
    if (this.type === 'police' && !this.isDead) {
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-this.width / 2, -15, 6, 30);
      ctx.fillRect(this.width / 2 - 6, -15, 6, 30);
      
      // Siren flashes dynamically
      const sirenColor = Math.floor(Date.now() / 150) % 2 === 0 ? '#ef4444' : '#3b82f6';
      ctx.fillStyle = sirenColor;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// MAIN PLAYER CHARACTER
class Player {
  constructor(x, y) {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(0, 0);
    this.angle = 0;
    this.speed = 3.6;
    this.health = 100;
    this.armor = 50;
    this.radius = 16;
    this.isDead = false;
    
    this.currentWeaponIndex = 0;
    this.inVehicle = false;
    this.vehicle = null;
  }

  update(keys, mouse, game) {
    if (this.isDead) return;

    if (this.inVehicle) {
      // Sync player coordinates directly to current vehicle
      this.pos.set(this.vehicle.pos.x, this.vehicle.pos.y);
      this.angle = this.vehicle.angle;
      return;
    }

    // Direct movement steering logic
    let moveDir = new Vector2(0, 0);
    if (keys['w'] || keys['arrowup']) moveDir.y = -1;
    if (keys['s'] || keys['arrowdown']) moveDir.y = 1;
    if (keys['a'] || keys['arrowleft']) moveDir.x = -1;
    if (keys['d'] || keys['arrowright']) moveDir.x = 1;

    if (moveDir.mag() > 0) {
      moveDir = moveDir.normalize();
      this.pos = this.pos.add(moveDir.mult(this.speed));
      
      // Sway angle slightly during movement
      this.angle = moveDir.heading();
    }

    // Screen border checking
    this.pos.x = Math.max(40, Math.min(MAP_SIZE - 40, this.pos.x));
    this.pos.y = Math.max(40, Math.min(MAP_SIZE - 40, this.pos.y));
  }

  damage(amount, game) {
    if (this.isDead) return;

    if (this.armor > 0) {
      this.armor -= amount * 0.6;
      this.health -= amount * 0.4;
    } else {
      this.health -= amount;
    }

    // Blood particles
    game.createSparks(this.pos, this.angle, '#ef4444', 8, 'blood');

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      game.triggerWastedScreen();
    }

    game.updateHUD();
  }

  draw(ctx, camera, mousePos) {
    if (this.inVehicle) return; // Hidden inside vehicle

    const screenX = this.pos.x - camera.pos.x + camera.offset.x;
    const screenY = this.pos.y - camera.pos.y + camera.offset.y;

    // Get real angle looking towards mouse position crosshair
    const targetAngle = Math.atan2(mousePos.y - screenY, mousePos.x - screenX);
    this.angle = targetAngle;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(this.angle);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(3, 3, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Body (Tropical flowery shirt of GTA VI Jason/Lucia style)
    ctx.fillStyle = '#f43f5e'; // Vibrant pink/magenta Hawaiian style shirt
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Floral shirt patterns
    ctx.fillStyle = '#67e8f9';
    ctx.beginPath();
    ctx.arc(-5, -5, 3, 0, Math.PI * 2);
    ctx.arc(5, 5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Head/Hair (Lucia hair style or Jason backwards cap)
    ctx.fillStyle = '#1e1b4b'; // Dark blue hair
    ctx.beginPath();
    ctx.arc(-2, 0, this.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Skin (Face)
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(2, 0, this.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Gun/Aim direction indicator
    ctx.fillStyle = '#111827';
    ctx.fillRect(8, 5, 15, 5); // Holding gun

    ctx.restore();
  }
}

// MAIN ENGINE GAME CONTROLLER
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Set screen sizing
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.player = new Player(1200, 1500);
    this.camera = {
      pos: new Vector2(1200, 1500),
      offset: new Vector2(this.canvas.width / 2, this.canvas.height / 2),
      width: this.canvas.width,
      height: this.canvas.height
    };

    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false };
    this.peds = [];
    this.vehicles = [];
    this.particles = [];
    this.wantedLevel = 0;
    this.hudCash = 5000;
    this.score = 0;
    this.pedsKilled = 0;
    
    // Core game state
    this.isLoaded = false;
    this.currentMission = null;
    this.missionState = 'idle'; // idle, active, complete

    // Minimap configuration
    this.minimapCanvas = document.getElementById('minimap');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    // Web Audio setup listener
    this.initEventListeners();
    this.setupProceduralMap();
    this.startLoadingProcess();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.camera) {
      this.camera.width = this.canvas.width;
      this.camera.height = this.canvas.height;
      this.camera.offset.set(this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  initEventListeners() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = true;
      
      // Audio engine warm up
      audio.init();

      // Hijack vehicle (E or F)
      if (key === 'f' || key === 'e') {
        this.toggleVehicleState();
      }

      // Quick weapon swaps
      if (key === '1') this.selectWeapon(0);
      if (key === '2') this.selectWeapon(1);
      if (key === '3') this.selectWeapon(2);

      // Change station (R while in vehicle)
      if (key === 'r') {
        if (this.player.inVehicle) {
          audio.nextStation();
        } else {
          // Normal weapon reload
          this.reloadWeapon();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      this.mouse.down = true;
      audio.init(); // ensure Web Audio Context initialized
      this.fireActiveWeapon();
    });

    window.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });

    // Start Button
    document.getElementById('start-btn').addEventListener('click', () => {
      document.getElementById('loading-screen').classList.add('opacity-0');
      setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('game-hud').classList.remove('hidden');
        audio.init();
        audio.updateHUD();
        this.triggerPhoneCall("Jason, o contato das docas tem um Cheetah neon guardado de forma suspeita na orla de Vice Beach. Vá lá, tome o carro e escape da patrulha!", "ROUBO DE CHEETAH");
      }, 1000);
    });

    // Respawn button click
    document.getElementById('btn-respawn').addEventListener('click', () => {
      this.respawnPlayer();
    });

    // Radio controls buttons
    document.getElementById('btn-radio-prev').addEventListener('click', () => audio.prevStation());
    document.getElementById('btn-radio-next').addEventListener('click', () => audio.nextStation());

    // Setup Mobile controls context support
    this.setupMobileControls();
  }

  setupMobileControls() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isTouch) return;

    // Make touch buttons visible
    document.getElementById('mobile-controls').classList.remove('hidden');

    // Touch events for dynamic joystick positioning
    const joystickBg = document.getElementById('mobile-joystick-bg');
    const joystickThumb = document.getElementById('mobile-joystick-thumb');
    
    joystickBg.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = joystickBg.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      let deltaX = touch.clientX - centerX;
      let deltaY = touch.clientY - centerY;
      const distance = Math.min(60, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
      
      const angle = Math.atan2(deltaY, deltaX);
      const thumbX = Math.cos(angle) * distance;
      const thumbY = Math.sin(angle) * distance;
      
      joystickThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;
      
      // Feed move parameters into dynamic key listener emulation
      this.keys['w'] = thumbY < -15;
      this.keys['s'] = thumbY > 15;
      this.keys['a'] = thumbX < -15;
      this.keys['d'] = thumbX > 15;
    });

    joystickBg.addEventListener('touchend', () => {
      joystickThumb.style.transform = `translate(0px, 0px)`;
      this.keys['w'] = false;
      this.keys['s'] = false;
      this.keys['a'] = false;
      this.keys['d'] = false;
    });

    // Direct actions emulators
    document.getElementById('btn-mobile-enter').addEventListener('touchstart', () => {
      this.toggleVehicleState();
    });
    document.getElementById('btn-mobile-shoot').addEventListener('touchstart', () => {
      this.fireActiveWeapon();
    });
    document.getElementById('btn-mobile-weapon').addEventListener('touchstart', () => {
      this.selectWeapon((this.player.currentWeaponIndex + 1) % WEAPONS.length);
    });
    document.getElementById('btn-mobile-dash').addEventListener('touchstart', () => {
      if (this.player.inVehicle) {
        this.vehicle.speed *= 0.6; // handbrake drift emulation
      }
    });
  }

  startLoadingProcess() {
    let progress = 0;
    const loadingBar = document.getElementById('loading-bar');
    const loadingStatus = document.getElementById('loading-status');
    const startBtn = document.getElementById('start-btn');

    const loadingPhases = [
      "Processando ruas e mapas de Leonida State...",
      "Carregando rádio digital Vice Synthwave...",
      "Rastreando tráfego urbano e viaturas...",
      "Renderizando coqueiros e orla de Vice Beach...",
      "Sincronizando gangues e pedestres locais...",
      "Tudo pronto!"
    ];

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        loadingBar.style.width = '100%';
        loadingStatus.innerText = loadingPhases[loadingPhases.length - 1];
        startBtn.classList.remove('hidden');
        loadingBar.parentElement.classList.add('hidden');
      } else {
        loadingBar.style.width = `${progress}%`;
        const phaseIndex = Math.floor((progress / 100) * loadingPhases.length);
        loadingStatus.innerText = loadingPhases[Math.min(phaseIndex, loadingPhases.length - 2)];
      }
    }, 120);
  }

  // Generate grid roads, palm trees, building zones and sandy shores
  setupProceduralMap() {
    // Parked vehicle locations
    this.vehicles.push(new Vehicle(1000, 1400, 'sports')); // The cheetah
    this.vehicles.push(new Vehicle(1800, 1600, 'sedan'));
    this.vehicles.push(new Vehicle(600, 800, 'sedan'));
    this.vehicles.push(new Vehicle(2200, 2400, 'sports'));
    
    // Spawn initial civilians & cops patrol
    for (let i = 0; i < 45; i++) {
      const rx = 100 + Math.random() * (MAP_SIZE - 200);
      const ry = 100 + Math.random() * (MAP_SIZE - 200);
      // Ensure we don't spawn right on top of player start
      if (Math.abs(rx - 1200) > 200) {
        this.peds.push(new Pedestrian(rx, ry, Math.random() > 0.82));
      }
    }
  }

  toggleVehicleState() {
    if (this.player.isDead) return;

    if (this.player.inVehicle) {
      // EXIT VEHICLE
      const car = this.player.vehicle;
      car.occupied = false;
      
      // Position player next to car driver side
      this.player.pos.x = car.pos.x - Math.cos(car.angle + Math.PI / 2) * 45;
      this.player.pos.y = car.pos.y - Math.sin(car.angle + Math.PI / 2) * 45;
      
      this.player.inVehicle = false;
      this.player.vehicle = null;
      
      document.getElementById('hud-speedometer').classList.add('hidden');
      audio.setEnginePitch(0, false);
    } else {
      // ENTER NEAREST VEHICLE IF CLOSE ENOUGH
      let nearestCar = null;
      let minDist = 75;

      for (const car of this.vehicles) {
        const d = this.player.pos.dist(car.pos);
        if (d < minDist && !car.isDead) {
          minDist = d;
          nearestCar = car;
        }
      }

      if (nearestCar) {
        this.player.inVehicle = true;
        this.player.vehicle = nearestCar;
        nearestCar.occupied = true;
        
        document.getElementById('hud-speedometer').classList.remove('hidden');
        document.getElementById('vehicle-name').innerText = nearestCar.type === 'sports' ? 'CHEETAH V8 SPORT' : nearestCar.type === 'police' ? 'VCPD INTERCEPTOR' : 'REGINA COUPE';
        
        // Audio hook
        audio.setEnginePitch(1, true);

        // Track mission progress if stealing target vehicle
        if (this.currentMission && nearestCar.type === 'sports') {
          this.triggerPhoneCall("Perfeito! Você tem o Cheetah. Leve-o de volta ao esconderijo nas docas marcadas no mapa no canto inferior esquerdo!", "CARRO ADQUIRIDO");
        }
      }
    }
  }

  selectWeapon(index) {
    if (index >= 0 && index < WEAPONS.length) {
      this.player.currentWeaponIndex = index;
      this.updateHUD();
    }
  }

  reloadWeapon() {
    const activeWep = WEAPONS[this.player.currentWeaponIndex];
    activeWep.ammo = activeWep.clipSize;
    audio.playBeep();
    this.updateHUD();
  }

  fireActiveWeapon() {
    if (this.player.isDead || this.player.inVehicle) return;

    const weapon = WEAPONS[this.player.currentWeaponIndex];
    if (weapon.ammo <= 0) {
      audio.playBeep();
      return;
    }

    weapon.ammo--;
    audio.playShot();
    this.updateHUD();

    // Trigger visual screen shake & muzzle flash particle effect
    const muzzlePos = this.player.pos.add(new Vector2(Math.cos(this.player.angle) * 22, Math.sin(this.player.angle) * 22));
    this.createSparks(muzzlePos, this.player.angle, '#fde047', 6);

    // Compute direct raycast hit on objects
    const rayDir = new Vector2(Math.cos(this.player.angle), Math.sin(this.player.angle));
    
    // Check hit against pedestrians
    let hitSomething = false;
    for (const ped of this.peds) {
      if (ped.health <= 0) continue;
      const d = ped.pos.dist(this.player.pos);
      if (d < weapon.maxRange) {
        // Simple angle threshold intersection
        const toPedVec = ped.pos.sub(this.player.pos).normalize();
        const dot = rayDir.x * toPedVec.x + rayDir.y * toPedVec.y;
        if (dot > 0.985) { // Narrow cone check
          ped.damage(weapon.damage, this);
          hitSomething = true;
          break;
        }
      }
    }

    // Check hit against vehicles
    if (!hitSomething) {
      for (const car of this.vehicles) {
        if (car.isDead) continue;
        const d = car.pos.dist(this.player.pos);
        if (d < weapon.maxRange) {
          const toCarVec = car.pos.sub(this.player.pos).normalize();
          const dot = rayDir.x * toCarVec.x + rayDir.y * toCarVec.y;
          if (dot > 0.97) {
            car.damage(weapon.damage, this);
            this.createSparks(car.pos, this.player.angle, '#e2e8f0', 8);
            hitSomething = true;
            break;
          }
        }
      }
    }

    // Trigger local crime alert status
    if (Math.random() > 0.4) {
      this.wantedLevel = Math.min(5, this.wantedLevel + 1);
      this.triggerStarsFlash();
    }
  }

  triggerPhoneCall(message, title) {
    const notifyEl = document.getElementById('phone-notifier');
    const msgEl = document.getElementById('phone-message');
    
    msgEl.innerText = `"${message}"`;
    notifyEl.classList.remove('translate-x-80');
    audio.playBeep();

    // Setup HUD mission banner info
    const alertEl = document.getElementById('mission-alert');
    const mTitleEl = document.getElementById('mission-title');
    const mDescEl = document.getElementById('mission-desc');
    
    mTitleEl.innerText = title;
    mDescEl.innerText = message.slice(0, 70) + "...";
    alertEl.classList.remove('-translate-y-20');

    setTimeout(() => {
      notifyEl.classList.add('translate-x-80');
    }, 8500);
  }

  triggerStarsFlash() {
    const container = document.getElementById('stars-container');
    container.innerHTML = '';
    
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('i');
      star.className = 'fas fa-star transition-all duration-300';
      if (i <= this.wantedLevel) {
        star.classList.add('wanted-star-active');
      } else {
        star.className = 'fas fa-star text-zinc-700';
      }
      container.appendChild(star);
    }

    // Spawn cops dynamically when wanted levels spike
    if (this.wantedLevel > 0 && this.peds.filter(p => p.isCop && p.health > 0).length < this.wantedLevel * 2) {
      const offsetPos = this.player.pos.add(new Vector2(Math.random() * 500 - 250, -400));
      this.peds.push(new Pedestrian(offsetPos.x, offsetPos.y, true));
    }
  }

  createSparks(pos, angle, color, count, type = 'spark') {
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() * 0.5 - 0.25);
      const speed = 2 + Math.random() * 5;
      const vel = new Vector2(Math.cos(a) * speed, Math.sin(a) * speed);
      this.particles.push(new Particle(pos, vel, color, 2 + Math.random() * 3, 15 + Math.random() * 15, type));
    }
  }

  createExplosionEffect(pos) {
    // Large fire & smoke cloud
    for (let i = 0; i < 20; i++) {
      const vel = new Vector2(Math.random() * 8 - 4, Math.random() * 8 - 4);
      this.particles.push(new Particle(pos, vel, '#f97316', 15 + Math.random() * 10, 30 + Math.random() * 20, 'fire'));
    }
    for (let i = 0; i < 15; i++) {
      const vel = new Vector2(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5);
      this.particles.push(new Particle(pos, vel, '#4b5563', 20 + Math.random() * 15, 45 + Math.random() * 30, 'smoke'));
    }
  }

  updateHUD() {
    // Health and armor bar transitions
    document.getElementById('bar-health').style.width = `${this.player.health}%`;
    document.getElementById('bar-armor').style.width = `${this.player.armor}%`;
    
    // Cash counter
    document.getElementById('hud-money').innerText = `$${this.hudCash.toLocaleString('en-US', { minimumIntegerDigits: 6, useGrouping: false })}`;
    
    // Weapon card
    const activeWep = WEAPONS[this.player.currentWeaponIndex];
    document.getElementById('weapon-name').innerText = activeWep.name;
    document.getElementById('weapon-ammo').innerHTML = `${activeWep.ammo} <span class="text-xs text-zinc-400">/ ${activeWep.maxAmmo}</span>`;
    document.getElementById('weapon-icon').src = activeWep.icon;
  }

  triggerWastedScreen() {
    const overlay = document.getElementById('game-overlay-screen');
    const title = document.getElementById('overlay-title');
    const subtitle = document.getElementById('overlay-subtitle');
    
    title.innerText = "WASTED";
    title.style.color = "#dc2626"; // Crimson RED
    subtitle.innerText = "Você morreu após causar estragos nas ruas de Vice City.";
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    
    audio.setEnginePitch(0, false);
  }

  respawnPlayer() {
    this.player.pos.set(1200, 1500);
    this.player.health = 100;
    this.player.armor = 50;
    this.player.isDead = false;
    this.player.inVehicle = false;
    this.player.vehicle = null;
    this.wantedLevel = 0;
    this.triggerStarsFlash();
    
    // Deduct cash penalty
    this.hudCash = Math.max(0, this.hudCash - 1000);
    this.updateHUD();

    document.getElementById('game-overlay-screen').classList.add('hidden');
    document.getElementById('game-overlay-screen').classList.remove('flex');
    document.getElementById('hud-speedometer').classList.add('hidden');
  }

  // Draw modern clean urban tiles: beach side on right, major highway, crosswalks & city grid
  drawEnvironmentGrid() {
    const camera = this.camera;
    this.ctx.fillStyle = '#0f172a'; // Deep slate dark ground
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context transform to align with world space camera
    this.ctx.save();
    this.ctx.translate(-camera.pos.x + camera.offset.x, -camera.pos.y + camera.offset.y);

    // Draw Ocean Beach on the right border of the map
    this.ctx.fillStyle = '#fef08a'; // Sand color
    this.ctx.fillRect(MAP_SIZE - 650, 0, 650, MAP_SIZE);

    this.ctx.fillStyle = '#0e7490'; // Deep water blue
    this.ctx.fillRect(MAP_SIZE - 250, 0, 250, MAP_SIZE);

    // Render city main highways & asphalt intersection grids
    this.ctx.fillStyle = '#1e293b'; // Road gray slate
    
    // Let's create roads in dynamic grid loops
    for (let r = 500; r < MAP_SIZE - 800; r += 800) {
      // Horizontal Road lanes
      this.ctx.fillRect(0, r, MAP_SIZE - 650, ROAD_WIDTH);
      
      // Vertical Road lanes
      this.ctx.fillRect(r, 0, ROAD_WIDTH, MAP_SIZE);

      // Dash lines
      this.ctx.strokeStyle = '#e2e8f0';
      this.ctx.lineWidth = 4;
      this.ctx.setLineDash([20, 15]);

      // Draw center lane markers
      this.ctx.beginPath();
      this.ctx.moveTo(0, r + ROAD_WIDTH/2);
      this.ctx.lineTo(MAP_SIZE - 650, r + ROAD_WIDTH/2);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(r + ROAD_WIDTH/2, 0);
      this.ctx.lineTo(r + ROAD_WIDTH/2, MAP_SIZE);
      this.ctx.stroke();
    }

    // Reset dash pattern
    this.ctx.setLineDash([]);

    // Draw tall skyscraper outlines & beach side palm tree clusters
    for (let x = 200; x < MAP_SIZE - 800; x += 400) {
      for (let y = 200; y < MAP_SIZE - 800; y += 400) {
        // Skip positions close to main road intersections
        if (Math.abs((x % 800) - 500) < 150 || Math.abs((y % 800) - 500) < 150) continue;

        // Building blocks
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        this.ctx.strokeStyle = '#ec4899'; // Gorgeous glowing neon pink borders
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, 220, 220, 16);
        this.ctx.fill();
        this.ctx.stroke();

        // Highrise interior pattern
        this.ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
        this.ctx.fillRect(x + 20, y + 20, 180, 180);
      }
    }

    // Draw ocean waves sways
    const waveOffset = Math.sin(Date.now() / 1000) * 8;
    this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
    this.ctx.fillRect(MAP_SIZE - 250 + waveOffset, 0, 15, MAP_SIZE);

    // Draw Palm Trees around beachfront sand
    for (let ty = 100; ty < MAP_SIZE; ty += 180) {
      this.drawPalmTree(MAP_SIZE - 500, ty);
    }

    this.ctx.restore();
  }

  drawPalmTree(x, y) {
    this.ctx.save();
    // Trunk
    this.ctx.fillStyle = '#78350f';
    this.ctx.fillRect(x - 5, y, 10, 50);

    // Foliage swaying
    const wind = Math.sin(Date.now() / 800) * 0.15;
    this.ctx.fillStyle = '#065f46';
    
    this.ctx.translate(x, y);
    this.ctx.rotate(wind);

    for (let j = 0; j < 5; j++) {
      this.ctx.rotate((Math.PI * 2) / 5);
      this.ctx.beginPath();
      this.ctx.ellipse(25, 0, 22, 6, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  // Draw customized high resolution mini-map system in real time
  updateMinimap() {
    const ctx = this.minimapCtx;
    const player = this.player;

    // Clear and draw layout bounds
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

    // Draw scale grid centered around player position
    ctx.save();
    ctx.translate(this.minimapCanvas.width / 2, this.minimapCanvas.height / 2);
    
    // Scale factor
    const zoom = 0.05; 

    // Draw representation of roads
    ctx.fillStyle = '#334155';
    for (let r = 500; r < MAP_SIZE - 800; r += 800) {
      ctx.fillRect((0 - player.pos.x) * zoom, (r - player.pos.y) * zoom, (MAP_SIZE - 650) * zoom, ROAD_WIDTH * zoom);
      ctx.fillRect((r - player.pos.x) * zoom, (0 - player.pos.y) * zoom, ROAD_WIDTH * zoom, MAP_SIZE * zoom);
    }

    // Highlight target mission destination dock
    ctx.fillStyle = '#ec4899'; // Glowing neon dock dropoff target
    ctx.beginPath();
    ctx.arc((MAP_SIZE - 500 - player.pos.x) * zoom, (1000 - player.pos.y) * zoom, 8, 0, Math.PI*2);
    ctx.fill();

    // Draw vehicles on map (cyan/blue squares)
    for (const car of this.vehicles) {
      ctx.fillStyle = car.type === 'sports' ? '#db2777' : '#06b6d4';
      ctx.fillRect((car.pos.x - player.pos.x) * zoom - 3, (car.pos.y - player.pos.y) * zoom - 3, 6, 6);
    }

    // Draw other AI cops (blue dots)
    for (const ped of this.peds) {
      if (ped.health > 0 && ped.isCop) {
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc((ped.pos.x - player.pos.x) * zoom, (ped.pos.y - player.pos.y) * zoom, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Player marker (Self flashing arrow pointing current heading direction)
    ctx.restore();

    ctx.fillStyle = '#10b981';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.minimapCanvas.width / 2, this.minimapCanvas.height / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  update() {
    // 1. Camera interpolation smoothing
    const targetCamX = this.player.pos.x;
    const targetCamY = this.player.pos.y;
    this.camera.pos.x += (targetCamX - this.camera.pos.x) * 0.1;
    this.camera.pos.y += (targetCamY - this.camera.pos.y) * 0.1;

    // 2. Update entities physics
    this.player.update(this.keys, this.mouse, this);

    // Update active vehicles
    this.vehicles.forEach(car => {
      if (car.occupied) {
        let forward = 0;
        let steer = 0;
        if (this.keys['w'] || this.keys['arrowup']) forward = 1;
        if (this.keys['s'] || this.keys['arrowdown']) forward = -1;
        if (this.keys['a'] || this.keys['arrowleft']) steer = -1;
        if (this.keys['d'] || this.keys['arrowright']) steer = 1;

        car.drive(forward, steer, this.keys[' ']);
        audio.setEnginePitch(Math.abs(car.speed), true);

        // Update Speedometer UI
        document.getElementById('speed-value').innerText = Math.round(Math.abs(car.speed) * 22);
      }
      car.update(this.player, this);
    });

    // Handle pedestrian simulation updates
    this.peds.forEach(ped => ped.update(this.player, this));

    // Update dynamic particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Mission Check progress
    this.checkMissionStatus();

    // 4. Update minimap tracker view
    this.updateMinimap();
  }

  checkMissionStatus() {
    // Deliver target Cheetah to docks on right beach end
    if (this.player.inVehicle && this.player.vehicle.type === 'sports') {
      const distToDock = this.player.pos.dist(new Vector2(MAP_SIZE - 500, 1000));
      if (distToDock < 150) {
        // Complete mission!
        this.triggerPhoneCall("Incrível Jason! O carro está guardado na garagem. Aqui está a sua fatia de lucros!", "MISSÃO CUMPRIDA");
        this.hudCash += 5000;
        this.score += 2000;
        this.wantedLevel = 0;
        this.triggerStarsFlash();
        this.updateHUD();

        // Respawn Cheetah as ordinary sports car
        this.player.inVehicle = false;
        this.player.vehicle.occupied = false;
        this.player.vehicle.pos.set(1200, 1500); // return to baseline park
        this.player.vehicle = null;
        document.getElementById('hud-speedometer').classList.add('hidden');
        audio.setEnginePitch(0, false);
      }
    }
  }

  render() {
    // Clear screen
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw full map terrain
    this.drawEnvironmentGrid();

    // Draw vehicles
    this.vehicles.forEach(car => car.draw(this.ctx, this.camera));

    // Draw pedestrians
    this.peds.forEach(ped => ped.draw(this.ctx, this.camera));

    // Draw Player
    this.player.draw(this.ctx, this.camera, this.mouse);

    // Draw particles
    this.particles.forEach(p => p.draw(this.ctx, this.camera));

    // Render simple crosshair aiming circle
    if (!this.player.inVehicle) {
      this.ctx.strokeStyle = 'rgba(236,72,153,0.6)';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, 8, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  run() {
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

// Instantiate and start gameplay loop
const game = new Game();
game.run();