// audio.js — sons gerados proceduralmente com WebAudio (sem arquivos externos):
// ambiente (vento/pássaros), tiros, picareta, construção, baú, cura, tempestade, ônibus

const AudioSys = (() => {
  let ctx = null;
  let master, windGain, stormGain, busGain, musicGain;
  let musicTimer = null;
  let volume = 0.7;
  let flags = { wind: 0.1, storm: false, bus: false, calm: false };

  function noiseBuffer(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);

    // vento: ruído em loop com filtro grave + oscilação lenta
    const wind = ctx.createBufferSource();
    wind.buffer = noiseBuffer(3);
    wind.loop = true;
    const windLp = ctx.createBiquadFilter();
    windLp.type = 'lowpass';
    windLp.frequency.value = 380;
    windGain = ctx.createGain();
    windGain.gain.value = 0.1;
    wind.connect(windLp).connect(windGain).connect(master);
    wind.start();
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.13;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.04;
    lfo.connect(lfoG).connect(windGain.gain);
    lfo.start();

    // tempestade: rumble grave (mudo até precisar)
    const storm = ctx.createBufferSource();
    storm.buffer = noiseBuffer(3);
    storm.loop = true;
    const stormLp = ctx.createBiquadFilter();
    stormLp.type = 'lowpass';
    stormLp.frequency.value = 120;
    stormGain = ctx.createGain();
    stormGain.gain.value = 0;
    storm.connect(stormLp).connect(stormGain).connect(master);
    storm.start();

    // ônibus: motor (serra grave)
    const bus = ctx.createOscillator();
    bus.type = 'sawtooth';
    bus.frequency.value = 55;
    const busLp = ctx.createBiquadFilter();
    busLp.type = 'lowpass';
    busLp.frequency.value = 200;
    busGain = ctx.createGain();
    busGain.gain.value = 0;
    bus.connect(busLp).connect(busGain).connect(master);
    bus.start();

    // canal da música de lobby (passa pelo volume geral)
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.9;
    musicGain.connect(master);

    // pássaros de vez em quando (só em terra e fora da tempestade)
    setInterval(() => {
      if (flags.calm && Math.random() < 0.6) chirp();
    }, 3800);
  }

  function env(gainNode, peak, attack, decay) {
    const t = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(t);
    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.linearRampToValueAtTime(peak, t + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function burst(dur, filterType, freq, peak, decay) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(dur);
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    const g = ctx.createGain();
    src.connect(f).connect(g).connect(master);
    env(g, peak, 0.005, decay);
    src.start();
    src.stop(ctx.currentTime + dur + 0.05);
  }

  function tone(type, f0, f1, dur, peak) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), ctx.currentTime + dur);
    const g = ctx.createGain();
    o.connect(g).connect(master);
    env(g, peak, 0.008, dur);
    o.start();
    o.stop(ctx.currentTime + dur + 0.1);
  }

  function chirp() {
    const base = 1800 + Math.random() * 900;
    tone('sine', base, base * 1.4, 0.12, 0.05);
    setTimeout(() => tone('sine', base * 1.2, base * 0.9, 0.1, 0.04), 160);
  }

  // tiro com "personalidade" por tipo de arma
  function shot(typeId) {
    if (!ctx) return;
    if (typeId === 'sniper') {
      burst(0.35, 'lowpass', 900, 0.5, 0.3);
      tone('square', 110, 40, 0.25, 0.25);
    } else if (typeId === 'escopeta') {
      burst(0.3, 'lowpass', 600, 0.5, 0.25);
      tone('square', 90, 45, 0.2, 0.22);
    } else if (typeId === 'revolver') {
      burst(0.18, 'bandpass', 1000, 0.38, 0.14);
      tone('square', 130, 55, 0.12, 0.18);
    } else if (typeId === 'lmg') {
      burst(0.09, 'bandpass', 1300, 0.26, 0.08);
      tone('square', 160, 75, 0.07, 0.13);
    } else if (typeId === 'smg') {
      burst(0.08, 'bandpass', 1800, 0.22, 0.07);
      tone('square', 200, 90, 0.06, 0.1);
    } else if (typeId === 'pistola') {
      burst(0.12, 'bandpass', 1400, 0.28, 0.1);
      tone('square', 170, 70, 0.08, 0.12);
    } else {
      burst(0.15, 'bandpass', 1100, 0.32, 0.12);
      tone('square', 150, 60, 0.1, 0.15);
    }
  }

  function play(name) {
    if (!ctx) return;
    switch (name) {
      case 'swing':    burst(0.12, 'highpass', 1200, 0.06, 0.1); break;
      case 'hit':      burst(0.08, 'lowpass', 700, 0.25, 0.08); tone('sine', 150, 90, 0.08, 0.15); break;
      case 'hitFlesh': tone('sine', 300, 150, 0.08, 0.15); break;
      case 'build':    tone('triangle', 220, 160, 0.09, 0.2); burst(0.06, 'lowpass', 900, 0.12, 0.06); break;
      case 'break':    burst(0.35, 'lowpass', 500, 0.35, 0.3); break;
      case 'chest':    tone('sine', 520, 520, 0.12, 0.12); setTimeout(() => tone('sine', 660, 660, 0.12, 0.12), 120); setTimeout(() => tone('sine', 880, 880, 0.18, 0.12), 240); break;
      case 'pickup':   tone('sine', 600, 950, 0.1, 0.12); break;
      case 'heal':     tone('sine', 700, 700, 0.15, 0.1); setTimeout(() => tone('sine', 1000, 1000, 0.2, 0.1), 150); break;
      case 'hurt':     tone('sine', 200, 90, 0.12, 0.2); break;
      case 'jump':     burst(0.08, 'highpass', 900, 0.04, 0.06); break;
      case 'glider':   burst(0.5, 'highpass', 600, 0.15, 0.4); break;
      case 'win':      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone('sine', f, f, 0.3, 0.15), i * 160)); break;
      case 'lose':     tone('sawtooth', 220, 80, 0.7, 0.15); break;
    }
  }

  // ---------- música de lobby (estilo chill, gerada em tempo real) ----------
  function padNote(freq, dur, type = 'sawtooth', peak = 0.028) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const o2 = ctx.createOscillator(); // levemente desafinado = som "largo"
    o2.type = type;
    o2.frequency.value = freq * 1.006;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.4);
    g.gain.setValueAtTime(peak, t + dur - 0.5);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(lp);
    o2.connect(lp);
    lp.connect(g).connect(musicGain);
    o.start();
    o2.start();
    o.stop(t + dur + 0.1);
    o2.stop(t + dur + 0.1);
  }

  function pluck(freq) {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = ctx.createGain();
    o.connect(g).connect(musicGain);
    env(g, 0.05, 0.005, 0.35);
    o.start();
    o.stop(ctx.currentTime + 0.5);
  }

  function startLobbyMusic() {
    if (!ctx || musicTimer) return;
    // progressão Am → F → C/G → G
    const chords = [
      [220.0, 261.63, 329.63],
      [174.61, 220.0, 261.63],
      [196.0, 261.63, 329.63],
      [196.0, 246.94, 293.66],
    ];
    let bar = 0;
    const playBar = () => {
      const chord = chords[bar % chords.length];
      for (const f of chord) padNote(f, 2.3);
      padNote(chord[0] / 2, 2.3, 'triangle', 0.05); // baixo
      const pattern = [0, 1, 2, 1];
      pattern.forEach((n, i) => {
        setTimeout(() => { if (musicTimer) pluck(chord[n] * 2); }, i * 560 + 90);
      });
      bar++;
    };
    playBar();
    musicTimer = setInterval(playBar, 2400);
  }

  function stopLobbyMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  // chamado a cada frame pelo jogo
  function setAmbience(f) {
    flags = f;
    if (!ctx) return;
    const t = ctx.currentTime;
    windGain.gain.setTargetAtTime(f.wind, t, 0.4);
    stormGain.gain.setTargetAtTime(f.storm ? 0.3 : 0, t, 0.5);
    busGain.gain.setTargetAtTime(f.bus ? 0.12 : 0, t, 0.4);
  }

  function setVolume(v) {
    volume = v;
    if (master) master.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
  }

  return {
    init, play, shot, setAmbience, setVolume,
    startLobbyMusic, stopLobbyMusic,
    get volume() { return volume; },
  };
})();
