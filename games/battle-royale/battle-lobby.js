(()=>{
 const status=document.getElementById('assetStatus'),play=document.getElementById('playBtn'),menu=document.getElementById('menu');let pref=battlePreferences(),busy=false,preview=null;
 const save=()=>{try{localStorage.setItem('br3d_setup',JSON.stringify(pref));}catch{status.textContent='Seleção aplicada; não foi possível salvá-la neste aparelho.';}};
 const selected=()=>{document.querySelectorAll('[data-map-id]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapId===pref.mapId)));document.querySelectorAll('[data-character-id]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.characterId===pref.characterId)));};
 for(const [id,map]of Object.entries(BATTLE_MAPS)){
  const b=document.createElement('button');b.type='button';b.className='mapCard';b.dataset.mapId=id;
  const art=document.createElement('div');art.className='mapArt map-'+id;art.style.setProperty('--map-color',map.color);art.innerHTML='<i></i><i></i><i></i><i></i>';
  const title=document.createElement('strong');title.textContent=map.name;const detail=document.createElement('span');detail.textContent=map.description;b.append(art,title,detail);document.getElementById('mapChoices').append(b);
  b.addEventListener('click',async()=>{if(busy)return;busy=true;play.disabled=true;status.textContent=id==='serra'?'Carregando os cenários e a vegetação locais…':'Preparando mapa…';
   try{if(id==='serra')await BattleAssets.prepareScenery();pref.mapId=id;save();selected();status.textContent=BattleAssets.error||map.name+' · 75 bots · seleção salva';}
   catch(e){status.textContent='Falha ao carregar os cenários. Tente novamente ou selecione outro mapa.';console.warn(e);}finally{busy=false;play.disabled=false;}
  });
 }
 for(const [id,c]of Object.entries(BATTLE_CHARACTERS)){
  const b=document.createElement('button');b.type='button';b.className='characterChoice';b.dataset.characterId=id;b.textContent=c.name;b.title=c.description;document.getElementById('characterChoices').append(b);
   b.addEventListener('click',()=>{pref.characterId=id;save();selected();showCharacter();status.textContent=c.description+' · seleção salva';});
 }
 function showCharacter(){
  if(!preview)return;if(preview.character){const old=preview.character;preview.scene.remove(old.group);const skeletons=new Set();old.group.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);if(o.geometry&&!o.userData.sharedBattleGeometry)o.geometry.dispose();});skeletons.forEach(s=>s.dispose());old.mats.forEach(m=>m.dispose());}
  const c=buildImportedCharacter(pref.characterId)||buildCharacter({shirt:0x3fa7ff,pants:0x2b3a52});preview.character=c;c.group.rotation.y=-.28;c.gunMount.add(buildGunMesh(makeWeapon('fuzil',RARITIES[0])));preview.scene.add(c.group);
 }
 window.BattleMenu={ready(){
  play.disabled=false;status.textContent=BattleAssets.error||'Pronto · 75 bots em cada partida · escolhas salvas neste aparelho';selected();
  if(preview)return;const cv=document.getElementById('characterPreview'),r=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});r.outputEncoding=THREE.sRGBEncoding;r.setPixelRatio(Math.min(devicePixelRatio,1.5));r.setSize(260,290,false);
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(35,260/290,.1,30);cam.position.set(2.9,1.75,4.6);cam.lookAt(0,1.05,0);scene.add(new THREE.HemisphereLight(0xe4f6ff,0x55634c,1.3));const light=new THREE.DirectionalLight(0xffffff,1);light.position.set(3,5,4);scene.add(light);preview={scene,cam,renderer:r,character:null};showCharacter();
  let previous=0;function frame(t){requestAnimationFrame(frame);if(document.hidden||menu.classList.contains('hidden')||t-previous<33)return;const dt=Math.min(.05,(t-previous)/1000);previous=t;preview.character?.animate?.({moving:true,dt,weapon:true});r.render(scene,cam);}requestAnimationFrame(frame);
 }};
 selected();
 fetch('assets/credits.json').then(r=>r.json()).then(credits=>{const box=document.getElementById('assetCreditsText');for(const c of credits){const p=document.createElement('p');p.textContent=c.title+' — '+c.author+' · '+c.license+' · '+(c.source||'Original JARVIS')+' · Posicionado/redimensionado; malhas agrupadas e texturas reduzidas em memória.';box.append(p);}}).catch(()=>{});
})();
