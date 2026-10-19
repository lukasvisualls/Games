/* Multiplayer is opt-in; no solo save is replaced or imported from the other player. */
(() => {
 const keys=['x','y','z','vx','vy','vz','heading','yaw','steerAngle','fx','fz','rx','rz','s','ti','lat','roadY','groundY','rampH','bank','bankRoll','tnx','tnz','ttx','ttz','trackSlope','crossings','prevS','lapStart','bestLap','finishTime','finishPos','progress','rank','nitro','gear','rpm','speedN','pitch','roll','wheelRot','airTime','slip','driftAngle','gripUse'];
 keys.push('normalF','longAcc','latAcc','impact','vcurv');
 const bools=['active','finished','airborne','nitroOn','sliding','cp','offRoad','drifting','esc'];
 const controls=value=>({throttle:clamp(Number(value?.throttle)||0,0,1),brake:clamp(Number(value?.brake)||0,0,1),steer:clamp(Number(value?.steer)||0,-1,1),handbrake:value?.handbrake===true,nitro:value?.nitro===true});
 const originalUpdate=Race.prototype.update,originalReset=Race.prototype.resetPlayer;
 const pack=c=>Object.fromEntries([...keys,...bools,'lapTimes'].map(k=>[k,c[k]??null]));
 const apply=(car,data)=>{if(!data||typeof data!=='object')throw Error('Carro remoto inválido');for(const k of keys){const v=data[k];if(v!==null&&(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e9))throw Error('Estado do carro inválido');car[k]=v;}for(const k of bools)car[k]=data[k]===true;car.lapTimes=Array.isArray(data.lapTimes)?data.lapTimes.filter(n=>Number.isFinite(n)&&n>=0).slice(0,20):[];};
 let link=null,received=null,localLoaded=false,remoteLoaded=false,lastInput=0,lastState=0,lastSend=0,lastProgress=0,guestCoins=0,credited=0,stopped=false,remoteResetAt=0;
 let inputSeq=0,ack=0,rate=1,history=[],snapshotSeq=0,lastSnapshotSeq=0;
 const predict=(r,dt,input)=>{Object.assign(r.player.input,input);const n=Math.max(1,Math.ceil(dt/(1/120)));for(let i=0;i<n;i++)r.physics.step([r.player],dt/n);r.physics.events.length=0;};
 const angle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
 // Only presentation is smoothed. Scores, pickups, laps and collisions remain host-owned.
 function visuals(r,dt,now){
  const saved=r.cars.map(c=>({x:c.x,y:c.y,z:c.z,heading:c.heading}));
  try{
   for(const c of r.cars){
    const remote=c!==r.player,age=remote?Math.min(.08,Math.max(0,(now-lastState)/1000))*rate:0;
    const target={x:c.x+c.vx*age,y:c.y+c.vy*age,z:c.z+c.vz*age,heading:c.heading};
    const v=c._netVisual||(c._netVisual={...target}),jump=Math.hypot(target.x-v.x,target.z-v.z)>12;
    const a=jump?1:1-Math.exp(-(remote?22:28)*dt);
    v.x+=(target.x-v.x)*a;v.y+=(target.y-v.y)*a;v.z+=(target.z-v.z)*a;v.heading+=angle(target.heading,v.heading)*a;
    Object.assign(c,v);c.updateEngine(dt);c.updateVisual(dt);c.mesh.updateMatrixWorld();
   }
   r.updateCamera(dt);r.updateLights(dt);
  }finally{r.cars.forEach((c,i)=>Object.assign(c,saved[i]));}
 }
 Race.prototype.resetPlayer=function(){if(link?.role==='guest'){send('input',{type:'reset'});return;}return originalReset.call(this);};
 const send=(kind,body)=>{if(link&&!stopped)Promise.resolve(link.send(kind,body)).catch(error=>stop(error.message));};
 const progress=()=>({coins:game().economy.coins,level:game().economy.level,best:game().race?Math.floor(game().race.player.progress):0});
 const game=()=>window.__nitro?.game;
 function stop(message='A sala foi encerrada.'){
  if(stopped)return;stopped=true;const g=game();if(g?.race)g.race.paused=true;if(g)g.ui.toast(message,'err');link?.onEnd?.(message);
 }
 function start(remote){
  const g=game();if(!remote||!Object.hasOwn(CARS,remote.model)||!/^#[0-9a-f]{6}$/i.test(remote.color)||typeof remote.name!=='string')throw Error('Perfil do piloto inválido.');
  g.multiplayer={role:link.role,name:link.name.slice(0,40),remote:{model:remote.model,color:remote.color,name:remote.name.slice(0,40)}};
  if(!TRACK_DEFS[link.track]||!DIFFICULTY[link.difficulty])throw Error('Pista incompatível.');
  g.startRace(link.track,link.difficulty,'race');
 }
 function scoreRemote(r,dt){
  const fields=['player','score','drift','driftTotal','wrongT','aheadFlags','passT'];
  const saved=Object.fromEntries(fields.map(k=>[k,r[k]]));
  const state=r._remoteScore||(r._remoteScore={player:r.remotePlayer,score:0,drift:{active:false,pts:0,t:0,idle:0,mult:1},driftTotal:0,wrongT:0,aheadFlags:new Map(),passT:new Map()});
  const ui=r.game.ui,audio=r.game.audio,popup=ui.popup,driftBank=audio.driftBank;
  try{Object.assign(r,state);ui.popup=()=>{};audio.driftBank=()=>{};r.updateScoring(dt);for(const k of fields)state[k]=r[k];}
  finally{Object.assign(r,saved);ui.popup=popup;audio.driftBank=driftBank;}
 }
 Race.prototype.update=function(dt){
  if(!link||!this.game.multiplayer)return originalUpdate.call(this,dt);
  if(stopped)return;
  const now=performance.now(),g=this.game;
  if(!localLoaded){localLoaded=true;send('progress',{type:'loaded'});}
  if(!remoteLoaded){g.ui.countdown('AGUARDANDO AMIGO');return;}
  if(!lastState)lastState=now;
  if(now-lastState>10000){stop('O outro jogador parou de responder.');return;}
  if(link.role==='host'){
   Object.assign(this.remotePlayer.input,now-lastInput<750?(received||controls({})):controls({}));
   originalUpdate.call(this,dt);
   if(this.started&&!this.remotePlayer.finished)scoreRemote(this,dt);
   if(this.started&&!this.remotePlayer.finished){guestCoins+=this.coins.collect(this.remotePlayer.x,this.remotePlayer.y+.7,this.remotePlayer.z)*COIN_VALUE;}
   if(now-lastSend>=33){lastSend=now;send('state',{type:'race',sample:++snapshotSeq,time:this.time,rate:this.paused?0:clamp(g.timeScale,0,1),ack,started:this.started,cars:this.cars.map(pack),coins:this.coins.active,guestCoins,guestScore:this._remoteScore?.score||0,guestDrift:this._remoteScore?.driftTotal||0,finishCount:this.finishCount});}
  }else{
   this.playerCtl.update(dt);
   const input=controls(this.player.input),step=Math.min(.05,Math.max(0,dt))*rate;
   const seq=++inputSeq;
   if(this.started&&!this.player.finished&&rate>0&&now-lastState<250){
    history.push({seq,dt:step,input,at:now});history=history.filter(h=>now-h.at<250).slice(-40);
    predict(this,step,input);
   }
   // Coalesce to the newest controls; never queue obsolete steering under congestion.
   if(now-lastSend>=16){lastSend=now;send('input',{type:'drive',seq,controls:input});}
   this.time+=step;
   visuals(this,Math.min(.1,Math.max(.001,dt)),now);
   this.resetCD-=dt;this.updateRanking();
   this.coins.update(dt,this.time);this.track.update(dt,this.time,g.camera.position);
   if(this.weather)this.weather.update(this.time,g.camera.position,this.pointScale);
   this.updateAudio();g.ui.updateHUD(this);
   if(!this.started)g.ui.countdown(String(Math.max(1,Math.ceil(-this.time))));
   else if(!this._announcedStart){this._announcedStart=true;g.ui.countdown('GO!',true);g.audio.beep(true);}
   if(this.player.finished&&!this._announcedFinish){this._announcedFinish=true;this.onPlayerFinish();}
   if(this.player.finished&&!this.resultsShown&&this.time-this.player.finishTime>2.5)this.showResults();
  }
  if(now-lastProgress>2000){lastProgress=now;send('progress',{type:'summary',...progress()});link.onProgress?.(progress());}
 };
 function receive(packet){
  if(stopped||!link)return;const body=packet.body;
  try{
   if(packet.kind==='progress'&&body?.type==='pilot'){
    if(game().multiplayer)return;start(body);
   }else if(packet.kind==='progress'&&body?.type==='loaded'){remoteLoaded=true;lastState=performance.now();}
   else if(packet.kind==='progress'&&body?.type==='summary'){link.onRemoteProgress?.(body);}
   else if(link.role==='host'&&packet.kind==='input'&&body?.type==='reset'){
    const r=game().race,now=performance.now();if(r?.started&&!r.remotePlayer.finished&&now-remoteResetAt>=1500){remoteResetAt=now;r.respawn(r.remotePlayer);}
   }
   else if(link.role==='host'&&packet.kind==='input'&&body?.type==='drive'){
    if(!Number.isSafeInteger(body.seq)||body.seq<=ack)return;
    ack=body.seq;received=controls(body.controls);lastInput=lastState=performance.now();
   }
   else if(link.role==='guest'&&packet.kind==='state'&&body?.type==='race'){
    const r=game().race;if(!r||body.cars?.length!==2)return;
    if(!Number.isSafeInteger(body.sample)||body.sample<1)throw Error('Amostra inválida.');
    if(body.sample<=lastSnapshotSeq)return;lastSnapshotSeq=body.sample;
    if(!Number.isFinite(body.time)||!Number.isFinite(body.guestCoins)||body.guestCoins<credited||body.guestCoins>1e7||!Array.isArray(body.coins)||body.coins.length!==r.coins.active.length)throw Error('Estado da corrida inválido.');
    for(const value of [body.guestScore,body.guestDrift])if(!Number.isFinite(value)||value<0||value>1e9)throw Error('Pontuação inválida.');
    if(!Number.isSafeInteger(body.ack)||body.ack<0||body.ack>inputSeq||!Number.isFinite(body.rate)||body.rate<0||body.rate>1)throw Error('Confirmação de entrada inválida.');
    body.cars.forEach((car,i)=>apply(r.cars[i],car));r.time=body.time;r.started=body.started===true;r.finishCount=body.finishCount;r.coins.active=body.coins.map(v=>v===true);
    rate=body.rate;const now=performance.now();
    history=rate>0&&!r.player.finished?history.filter(h=>h.seq>body.ack&&now-h.at<250):[];
    for(const h of history)predict(r,h.dt,h.input);
    if(!r.resultsShown){r.score=body.guestScore;r.driftTotal=body.guestDrift;}
    const delta=body.guestCoins-credited;if(delta){gCredit(delta);credited=body.guestCoins;r.raceCoins=credited;}
    lastState=performance.now();
   }
  }catch(error){stop(error.message);}
 }
 const gCredit=n=>{game().economy.addCoins(n);game().ui.refreshCoins(true);};
 window.JarvisNitroMultiplayer={protocol:1,version:'1.1.1',connect(options){
  if(link)throw Error('Já há uma sala conectada.');if(!game())throw Error('O jogo ainda está carregando.');
  if(!['host','guest'].includes(options.role)||typeof options.send!=='function')throw Error('Conexão inválida.');
  link=options;const g=game(),quit=g.quitRace.bind(g);g.quitRace=(...args)=>{stop('Você saiu da corrida.');return quit(...args);};const E=g.economy,model=E.data.selected;
  send('progress',{type:'pilot',model,color:E.color(model),name:options.name.slice(0,40)});
  return{receive,close:()=>stop('Você saiu da sala.'),summary:progress};
 }};
})();
