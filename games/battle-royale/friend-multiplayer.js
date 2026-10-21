// Two-human squad. Only the host advances combat, loot, building and the storm.
window.JarvisFriendMultiplayer={connect({role,room,name,remoteName,send}){
 if(friendBattle||!['host','guest'].includes(role))throw Error('Sala Battle Royale inválida.');
 const realRandom=Math.random;
 let seed=[...room].reduce((v,c)=>Math.imul(v^c.charCodeAt(0),16777619),2166136261)>>>0;
 Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 // Procedural texture caches must not change the sequence used to build the island.
 for(const cache of [_texCache,_clothCache,_structTex])for(const key of Object.keys(cache)){cache[key].dispose();delete cache[key];}
 try{startMatch();}finally{Math.random=realRandom;}
 document.getElementById('menu').classList.add('hidden');
 document.getElementById('lockHint').classList.remove('hidden');
 document.getElementById('menuBtn').hidden=true;
 const local=game.player,remote=new Player(game.scene,...game.player.pos.toArray());
 local.name=String(name||'Você').slice(0,24);remote.name=String(remoteName||'Amigo').slice(0,24);remote.friendRemote=true;
 const humans=role==='host'?[local,remote]:[remote,local];
 const net={role,humans,lastInput:0,input:null,materials:{wood:0,stone:0,metal:0},yaw:game.camYaw,pitch:game.camPitch,revision:0};
 friendBattle=net;
 const initialHarvest=[...game.harvestables];
 initialHarvest.forEach((h,i)=>h.netId=i);
 const finite=(v,n,limit=100000)=>Array.isArray(v)&&v.length===n&&v.every(x=>Number.isFinite(x)&&Math.abs(x)<limit);
 const itemOut=i=>!i?null:i.kind==='weapon'?['w',i.typeId,i.rarity.idx]:['h',i.id,i.usesLeft];
 const itemIn=i=>{
  if(i===null)return null;
  if(!Array.isArray(i)||i.length!==3)return null;
  if(i[0]==='w'&&WEAPON_TYPES.some(w=>w.id===i[1])&&Number.isInteger(i[2])&&RARITIES[i[2]])return makeWeapon(i[1],RARITIES[i[2]]);
  if(i[0]==='h'&&HEAL_TYPES.some(h=>h.id===i[1])&&Number.isInteger(i[2])&&i[2]>=0&&i[2]<=3)return {...makeHeal(i[1]),usesLeft:i[2]};
  return null;
 };
 const entityOut=(p,yaw)=>({p:p.pos.toArray(),yaw,hp:p.hp,shield:p.shield,alive:p.alive,phase:p.phase,crouching:p.crouching,slots:p.slots?.map(itemOut),slot:p.activeSlot??-1});
 const entityIn=(p,v)=>{
  if(!v||!finite(v.p,3)||!Number.isFinite(v.yaw)||!Number.isFinite(v.hp)||!Number.isFinite(v.shield)||!['bus','air','freefall','glider','playing'].includes(v.phase))return false;
  p.pos.fromArray(v.p);p.hp=clamp(v.hp,0,100);p.shield=clamp(v.shield,0,100);p.alive=v.alive===true;p.phase=v.phase;p.crouching=v.crouching===true;p.mesh.visible=p.shadow.visible=p.alive;
  if(p instanceof Player){
   if(Array.isArray(v.slots)&&v.slots.length===5){const before=JSON.stringify(p.slots.map(itemOut));p.slots=v.slots.map(itemIn);p.activeSlot=Number.isInteger(v.slot)?clamp(v.slot,-1,4):-1;if(before!==JSON.stringify(v.slots)||p.netSlot!==p.activeSlot){p.refreshHeld();p.netSlot=p.activeSlot;}}
   const yaw=game.camYaw,pitch=game.camPitch;if(p!==local){game.camYaw=v.yaw;game.camPitch=0;}p.syncMesh(false);game.camYaw=yaw;game.camPitch=pitch;
  }else{p.yaw=v.yaw;p.syncMesh(false,.05);}
  return true;
 };
 net.hostStep=dt=>{
  const saved={player:game.player,yaw:game.camYaw,pitch:game.camPitch,materials:game.materials,input:{...input},inv:invOpen,target:game.interactTarget,camPos:camera.position.clone(),camQuat:camera.quaternion.clone()};
  const action=net.input&&performance.now()-net.lastInput<500?net.input:{};
  game.player=remote;game.camYaw=net.yaw;game.camPitch=net.pitch;game.materials=net.materials;invOpen=action.inv===true;
  input.keys={KeyW:!!action.w,KeyA:!!action.a,KeyS:!!action.s,KeyD:!!action.d,[binds.crouch]:!!action.crouch};
  Object.assign(input,{mouseDown:!!action.fire,jumpQueued:!!action.jump,interactQueued:!!action.interact,buildQueued:action.build||null,slotQueued:action.slot??-1,pickaxeQueued:!!action.pickaxe});
  try{
   if(game.bus.done&&remote.phase==='bus')remote.startFreefall();
   updateCamera();remote.update(dt);updateInteraction();
  }finally{
   net.materials=game.materials;
   for(const key of ['jump','interact','build','slot','pickaxe'])delete action[key];
   game.player=saved.player;game.camYaw=saved.yaw;game.camPitch=saved.pitch;game.materials=saved.materials;Object.assign(input,saved.input);invOpen=saved.inv;game.interactTarget=saved.target;camera.position.copy(saved.camPos);camera.quaternion.copy(saved.camQuat);
  }
 };
 net.guestStep=(dt,t)=>{
  local.syncMesh(false,dt);
  for(const c of game.chests)c.update(dt,t);
  for(const p of game.pickups)p.update(dt,t);
  game.zone.updateMeshes();updateParticles(dt);updateCamera();
 };
 const worldOut=()=>({
  type:'world',revision:++net.revision,
  structures:game.build.structures.map(s=>({kind:s.kind,mat:s.mat,key:s.key,aabb:s.aabb,baseY:s.baseY,topY:s.topY,dirX:s.dirX,dirZ:s.dirZ,hp:s.hp,maxHp:s.maxHp})),
  harvest:game.harvestables.map(h=>h.netId),
  chests:game.chests.map(c=>c.opened),
  loot:game.pickups.map(p=>[p.x,p.z,itemOut(p.item)])
 });
 let worldSignature='',closed=false,lastWorld=0,guestRevision=0;
 const worldIn=body=>{
  if(!Array.isArray(body.structures)||body.structures.length>2000||!Array.isArray(body.harvest)||body.harvest.length>2000||!body.harvest.every(Number.isInteger)||!Array.isArray(body.chests)||body.chests.length!==game.chests.length||!Array.isArray(body.loot)||body.loot.length>1000)return;
  if(!body.structures.every(s=>s&&['wall','ramp','floor','pyramid'].includes(s.kind)&&['wood','stone','metal'].includes(s.mat)&&typeof s.key==='string'&&s.key.length<100&&[s.baseY,s.topY,s.dirX,s.dirZ,s.hp,s.maxHp,...Object.values(s.aabb||{})].every(Number.isFinite)&&Object.keys(s.aabb||{}).length===5))return;
  if(!body.loot.every(v=>Array.isArray(v)&&v.length===3&&finite(v.slice(0,2),2)&&itemIn(v[2])))return;
  for(const s of game.build.structures){game.scene.remove(s.mesh);s.mesh.traverse(o=>o.geometry?.dispose());s.material.dispose();}
  game.build.structures=body.structures.map(s=>{
   const a=s.aabb,cx=(a.minX+a.maxX)/2,cz=(a.minZ+a.maxZ)/2,material=new THREE.MeshLambertMaterial({map:makeStructTexture(s.mat)});let mesh;
   if(s.kind==='ramp'){
    mesh=new THREE.Group();const slab=new THREE.Mesh(new THREE.BoxGeometry(3,.25,Math.SQRT2*3),material);slab.rotation.x=-Math.PI/4;mesh.add(slab);mesh.position.set(cx,s.baseY+1.5,cz);mesh.rotation.y=Math.atan2(s.dirX,s.dirZ);
   }else if(s.kind==='pyramid'){mesh=new THREE.Mesh(new THREE.ConeGeometry(2.1,1.4,4),material);mesh.rotation.y=Math.PI/4;mesh.position.set(cx,s.baseY+.7,cz);}
   else {mesh=new THREE.Mesh(new THREE.BoxGeometry(a.maxX-a.minX,s.kind==='floor'?.25:3,a.maxZ-a.minZ),material);mesh.position.set(cx,s.kind==='floor'?s.baseY-.125:s.baseY+1.5,cz);}
   game.scene.add(mesh);
   return {...s,mesh,material,surfaceY(x,z){if(s.kind==='ramp')return s.baseY+clamp01(((x-cx)*s.dirX+(z-cz)*s.dirZ+1.5)/3)*3;if(s.kind==='pyramid')return s.baseY+1.4*(1-clamp01(Math.max(Math.abs(x-cx),Math.abs(z-cz))/1.5));return s.topY;},hitTest(){return false;}};
  });
  const alive=new Set(body.harvest);
  for(const h of [...game.harvestables])if(!alive.has(h.netId))destroyHarvestable(h);
  body.chests.forEach((opened,i)=>{game.chests[i].opened=opened===true;});
  for(const p of game.pickups)p.remove(game.scene);
  game.pickups=body.loot.map(v=>new Pickup(game.scene,v[0],v[1],itemIn(v[2])));
  guestRevision=body.revision;
 };
 const receive=packet=>{
  if(closed||packet.room!==room)return;const body=packet.body;if(!body||typeof body!=='object')return;
  if(role==='host'&&packet.kind==='input'){
   if(body.type==='hello'){send('state',worldOut());return;}
   if(body.type==='action'){
    const action=net.input ||= {};
    if(body.jump===true)action.jump=true;if(body.interact===true)action.interact=true;if(body.pickaxe===true)action.pickaxe=true;
    if(['wall','ramp','floor','pyramid'].includes(body.build))action.build=body.build;
    if(Number.isInteger(body.slot)&&body.slot>=0&&body.slot<5)action.slot=body.slot;
    return;
   }
   if(body.type!=='frame'||!Number.isFinite(body.yaw)||Math.abs(body.yaw)>1e9||!Number.isFinite(body.pitch))return;
   const prior=net.input||{};
   net.input={w:body.w===true,a:body.a===true,s:body.s===true,d:body.d===true,fire:body.fire===true,crouch:body.crouch===true,inv:body.inv===true,jump:prior.jump||body.jump===true,interact:prior.interact||body.interact===true,pickaxe:prior.pickaxe||body.pickaxe===true,build:['wall','ramp','floor','pyramid'].includes(body.build)?body.build:prior.build,slot:Number.isInteger(body.slot)&&body.slot>=0&&body.slot<5?body.slot:prior.slot};
   net.yaw=body.yaw;net.pitch=clamp(body.pitch,-1.15,1.3);net.lastInput=performance.now();
  }else if(role==='guest'&&packet.kind==='state'){
   if(body.type==='world'){worldIn(body);return;}
   if(body.type!=='frame'||!Array.isArray(body.bots)||body.bots.length!==game.bots.length||!finite(body.bus,4)||!body.zone||!finite(body.materials,3)||!Array.isArray(body.shots)||body.shots.length>512||!body.shots.every(v=>Array.isArray(v)&&v.length===4&&finite(v.slice(0,3),3)&&Number.isInteger(v[3])&&v[3]>=0&&v[3]<=0xffffff))return;
   if(!entityIn(local,body.own)||!entityIn(remote,body.other))return;
   body.bots.forEach((v,i)=>entityIn(game.bots[i],v));
   while(game.projectiles.length>body.shots.length){const p=game.projectiles.pop();game.scene.remove(p.mesh);}
   body.shots.forEach((v,i)=>{let p=game.projectiles[i];if(!p){p={mesh:new THREE.Mesh(_projGeo,projMat(v[3]))};game.projectiles.push(p);game.scene.add(p.mesh);}p.mesh.position.set(...v.slice(0,3));p.mesh.material=projMat(v[3]);});
   for(const key of ['x','z','radius','targetX','targetZ','targetRadius','timer','phaseIndex'])if(Number.isFinite(body.zone[key]))game.zone[key]=body.zone[key];
   if(['waiting','shrinking','done'].includes(body.zone.state))game.zone.state=body.zone.state;
   game.bus.group.position.set(...body.bus.slice(0,3));game.bus.group.rotation.y=body.bus[3];game.bus.done=body.busDone===true;game.bus.group.visible=!game.bus.done;
   [game.materials.wood,game.materials.stone,game.materials.metal]=body.materials.map(v=>clamp(v,0,999));
   game.victory=body.victory===true;game.playerPlacement=body.placement||0;net.lastState=performance.now();
   if(body.revision>guestRevision&&performance.now()-lastWorld>2000){send('input',{type:'hello'});lastWorld=performance.now();}
  }
 };
 let tick=0;
 const timer=setInterval(()=>{
  if(closed||!game)return;
  if(role==='host'){
   if(++tick%5===0){
    const state=worldOut(),signature=JSON.stringify({...state,revision:0});
    if(signature!==worldSignature){worldSignature=signature;send('state',state);}else net.revision--;
   }
   const z=game.zone;
   send('state',{type:'frame',own:entityOut(remote,net.yaw),other:entityOut(local,game.camYaw),bots:game.bots.map(b=>entityOut(b,b.yaw)),shots:game.projectiles.slice(0,512).map(p=>[...p.mesh.position.toArray(),p.mesh.material.color.getHex()]),zone:{x:z.x,z:z.z,radius:z.radius,targetX:z.targetX,targetZ:z.targetZ,targetRadius:z.targetRadius,timer:z.timer,phaseIndex:z.phaseIndex,state:z.state},bus:[...game.bus.group.position.toArray(),game.bus.group.rotation.y],busDone:game.bus.done,materials:Object.values(net.materials),victory:game.victory,placement:game.playerPlacement,revision:net.revision});
  }else{
   send('input',{type:'frame',yaw:game.camYaw,pitch:game.camPitch,w:!!input.keys.KeyW,a:!!input.keys.KeyA,s:!!input.keys.KeyS,d:!!input.keys.KeyD,crouch:!!input.keys[binds.crouch],fire:input.mouseDown,inv:invOpen});
   if(input.jumpQueued||input.interactQueued||input.pickaxeQueued||input.buildQueued||input.slotQueued>=0)send('input',{type:'action',jump:input.jumpQueued,interact:input.interactQueued,build:input.buildQueued,slot:input.slotQueued,pickaxe:input.pickaxeQueued});
   input.jumpQueued=input.interactQueued=input.pickaxeQueued=false;input.buildQueued=null;input.slotQueued=-1;
  }
 },50);
 if(role==='guest')send('input',{type:'hello'});
 window.__jarvisFriendDebug={get own(){return entityOut(local,game.camYaw);},get remote(){return entityOut(remote,net.yaw);},get world(){return {harvest:game.harvestables.length,chests:game.chests.length,loot:game.pickups.length,structures:game.build.structures.length};},get lastState(){return net.lastState;}};
 return {receive,close(){if(closed)return;closed=true;clearInterval(timer);document.exitPointerLock();if(game){disposeScene(game.scene);game=null;}friendBattle=null;}};
}};
