// Original procedural music: no remote media or copyrighted recordings.
(() => {
  let ctx, master, timer, beat = 0, enabled = true;
  const game = document.currentScript.dataset.game;
  const notes = game === 'agario' ? [48,55,60,64,55,62,60,55] : [72,76,79,76,74,77,81,79,72,76,79,84,81,77,74,79];
  function tone(midi, duration=.15, volume=.1, type='sine') {
    if (!ctx || ctx.state !== 'running' || !enabled) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
    osc.type = type; osc.frequency.value = 440 * 2 ** ((midi-69)/12);
    gain.gain.setValueAtTime(0,now); gain.gain.linearRampToValueAtTime(volume,now+.01); gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain).connect(master); osc.start(now); osc.stop(now+duration+.02);
  }
  function start() {
    ctx ||= new AudioContext();
    if (!master) { master = ctx.createGain(); master.gain.value=.3; master.connect(ctx.destination); }
    if (enabled) void ctx.resume();
    if (!timer) timer = setInterval(() => { if (document.hidden) return; tone(notes[beat%notes.length], .25,.1,game==='agario'?'sine':'triangle'); if (beat%4===0) tone(notes[0]-24,.65,.13); beat++; }, game==='agario'?360:190);
  }
  const button = document.createElement('button');
  button.textContent='♫ Som ligado'; button.setAttribute('aria-label','Ativar ou silenciar música e efeitos');
  button.style.cssText='position:fixed;top:10px;right:10px;z-index:100000;background:#101827d9;color:white;border:1px solid #ffffff55;border-radius:8px;padding:8px;cursor:pointer';
  button.onclick=()=>{ enabled=!enabled;button.textContent=enabled?'♫ Som ligado':'♫ Som desligado';start(); if(!enabled) void ctx.suspend(); button.blur();window.focus(); };
  document.body.append(button);
  document.addEventListener('pointerdown',start,{once:true});
  document.addEventListener('keydown',start,{once:true});
  document.addEventListener('visibilitychange',()=>{ if(ctx) void (document.hidden?ctx.suspend():enabled?ctx.resume():Promise.resolve()); });
  window.addEventListener('pagehide',()=>{clearInterval(timer);void ctx?.close();});
  window.JarvisAudio={start,flap(){start();tone(84,.10,.24,'triangle');tone(91,.06,.12);},hit(){tone(40,.3,.3,'sawtooth');},get state(){return ctx?.state;}};
})();
