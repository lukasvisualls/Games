const AudioEngine = (() => {
  let ctx = null;
  let musicGain = null;
  let sfxGain = null;
  let musicEnabled = true;
  let sfxEnabled = true;
  let volume = 0.7;
  let musicTimerId = null;
  let noteIndex = 0;

  const MUSIC_BASE = 0.14;
  const SFX_BASE = 0.28;

  // Korobeiniki, traditional Russian folk melody (public domain).
  const BEAT_MS = 180;
  const MELODY = [
    [659.25, 1], [493.88, 0.5], [523.25, 0.5], [587.33, 1], [523.25, 0.5], [493.88, 0.5],
    [440.0, 1], [440.0, 0.5], [523.25, 0.5], [659.25, 1], [587.33, 0.5], [523.25, 0.5],
    [493.88, 1.5], [523.25, 0.5], [587.33, 1], [659.25, 1],
    [523.25, 1], [440.0, 1], [440.0, 1],
    [0, 0.5], [587.33, 1], [698.46, 0.5], [880.0, 1], [784.0, 0.5], [698.46, 0.5],
    [659.25, 1.5], [523.25, 0.5], [659.25, 1], [587.33, 0.5], [523.25, 0.5],
    [493.88, 1], [493.88, 0.5], [523.25, 0.5], [587.33, 1], [659.25, 1],
    [523.25, 1], [440.0, 1], [440.0, 1], [0, 1],
  ];

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      musicGain = ctx.createGain();
      musicGain.gain.value = MUSIC_BASE * volume;
      musicGain.connect(ctx.destination);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = SFX_BASE * volume;
      sfxGain.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function beep(freq, duration, type, destination) {
    if (!freq) return;
    const audioCtx = getCtx();
    const osc = audioCtx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;

    const envelope = audioCtx.createGain();
    envelope.gain.setValueAtTime(1, audioCtx.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(envelope);
    envelope.connect(destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playMove() {
    if (!sfxEnabled) return;
    beep(220, 0.05, "square", sfxGain);
  }

  function playRotate() {
    if (!sfxEnabled) return;
    beep(330, 0.06, "square", sfxGain);
  }

  function playHardDrop() {
    if (!sfxEnabled) return;
    beep(150, 0.09, "square", sfxGain);
  }

  function playLock() {
    if (!sfxEnabled) return;
    beep(110, 0.1, "triangle", sfxGain);
  }

  function playLineClear(count) {
    if (!sfxEnabled) return;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.slice(0, Math.max(1, count)).forEach((f, i) => {
      setTimeout(() => beep(f, 0.15, "square", sfxGain), i * 60);
    });
  }

  function playGameOver() {
    if (!sfxEnabled) return;
    [392, 349.23, 329.63, 293.66].forEach((f, i) => {
      setTimeout(() => beep(f, 0.25, "sawtooth", sfxGain), i * 150);
    });
  }

  function scheduleNextNote() {
    const [freq, beats] = MELODY[noteIndex % MELODY.length];
    const duration = beats * BEAT_MS;
    beep(freq, (duration / 1000) * 0.85, "square", musicGain);
    noteIndex++;
    musicTimerId = setTimeout(scheduleNextNote, duration);
  }

  function startMusic() {
    if (!musicEnabled || musicTimerId) return;
    getCtx();
    noteIndex = 0;
    scheduleNextNote();
  }

  function stopMusic() {
    clearTimeout(musicTimerId);
    musicTimerId = null;
  }

  function setMusicEnabled(value) {
    musicEnabled = value;
    if (!musicEnabled) stopMusic();
  }

  function setSfxEnabled(value) {
    sfxEnabled = value;
  }

  function setVolume(value) {
    volume = Math.min(1, Math.max(0, value));
    if (musicGain) musicGain.gain.value = MUSIC_BASE * volume;
    if (sfxGain) sfxGain.gain.value = SFX_BASE * volume;
  }

  return {
    playMove,
    playRotate,
    playHardDrop,
    playLock,
    playLineClear,
    playGameOver,
    startMusic,
    stopMusic,
    setMusicEnabled,
    setSfxEnabled,
    setVolume,
  };
})();
