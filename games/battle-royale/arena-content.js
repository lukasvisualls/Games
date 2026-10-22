// Original game layouts, not extracted/copied from online model viewers.
const BATTLE_BOTS=75;
const BATTLE_MAPS={
 classic:{name:'Ilha clássica',size:800,description:'O mapa original, com montanhas, cidades e construções.',theme:'classic',color:'#7ead6b'},
 tropical:{name:'Horizonte tropical',size:4000,description:'4 × 4 km · porto, indústria, rio, praias e observatório.',theme:'tropical',color:'#3bbfac'},
 islands:{name:'Arquipélago',size:2000,description:'Ilhas conectadas por pontes, vilas e florestas.',theme:'islands',color:'#489ac4'},
 serra:{name:'Vale dos cenários',size:4000,description:'4 × 4 km · floresta, deserto, cidade, ponte, ruínas e os cenários enviados.',theme:'serra',color:'#c6a068'}
};
const BATTLE_CHARACTERS={
 classic:{name:'Explorador clássico',tint:0xffffff,description:'Personagem original do jogo'},
 'swat-bl':{name:'SWAT BL · simplificado',tint:0xffffff,description:'Modelo sem esqueleto: articulação rígida simplificada de pernas, braços e cabeça'},
 swat:{name:'Sentinela · original',tint:0xffffff,description:'Personagem JARVIS original articulado, com capacete, visor e equipamento tático'},
 forest:{name:'Sentinela · floresta',tint:0x9cab84,description:'Variação de uniforme oliva do Sentinela original'},
 desert:{name:'Sentinela · deserto',tint:0xd9bb8b,description:'Variação de uniforme areia do Sentinela original'},
 night:{name:'Sentinela · noturno',tint:0x8b9fb4,description:'Variação de uniforme azul-acinzentado do Sentinela original'}
};
function battlePreferences(){let p;try{p=JSON.parse(localStorage.getItem('br3d_setup')||'{}');}catch{}return {mapId:Object.hasOwn(BATTLE_MAPS,p?.mapId)?p.mapId:'classic',characterId:Object.hasOwn(BATTLE_CHARACTERS,p?.characterId)?p.characterId:'swat'};}
let ACTIVE_MAP=BATTLE_MAPS.classic,activeMapId='classic',MAP_ROADS=[];
const POI_LAYOUT=[['Pico',-.57,-.60,'observatory'],['Porto',.63,-.44,'harbor'],['Moinho',-.57,.14,'mill'],['Fábrica',.33,-.17,'factory'],['Posto militar',-.15,-.53,'military'],['Vila do rio',-.24,.36,'village'],['Estaleiro',.65,.38,'shipyard'],['Centro',.12,.10,'town'],['Baía',-.47,.64,'resort'],['Docas',.33,.65,'dockyard']];
function selectBattleMap(id){
 activeMapId=Object.hasOwn(BATTLE_MAPS,id)?id:'classic';ACTIVE_MAP=BATTLE_MAPS[activeMapId];WORLD_SIZE=ACTIVE_MAP.size;HALF_WORLD=WORLD_SIZE/2;
 if(activeMapId==='classic'){MOUNTAINS.splice(0,MOUNTAINS.length,...CLASSIC_MOUNTAINS.map(x=>({...x})));CITIES.splice(0,CITIES.length,...CLASSIC_CITIES.map(x=>({...x})));MAP_ROADS=[];return;}
 const h=HALF_WORLD;
 const layout=activeMapId==='islands'?[['Ilha norte',-.45,-.42,'village'],['Farol',.49,-.50,'observatory'],['Vila central',-.40,.47,'town'],['Porto sul',.47,.45,'harbor']]:activeMapId==='serra'?[['Vila da serra',-.29,.12,'town'],['Estação',.46,.44,'military'],['Fazenda',-.55,-.50,'mill'],['Oficinas',.44,-.52,'factory']]:POI_LAYOUT;
 CITIES.splice(0,CITIES.length,...layout.map(([name,x,z,type])=>({name,x:x*h,z:z*h,r:type==='town'?105:65,type})));
 MOUNTAINS.splice(0,MOUNTAINS.length,...[{x:-.57*h,z:-.6*h,r:.24*h,h:activeMapId==='tropical'?150:65},{x:.61*h,z:.05*h,r:.22*h,h:90}]);
 MAP_ROADS=CITIES.map((c,i)=>({a:c,b:CITIES[(i+1)%CITIES.length]}));
 if(activeMapId==='tropical')for(const i of [0,1,3,4,6,8,9])MAP_ROADS.push({a:CITIES[i],b:CITIES[7]});
 // Small roadside settlements fill the gaps, rather than enlarging the scans
 // or placing houses inside their existing buildings and roads.
 if(activeMapId!=='islands'){
  let number=0;
  for(const nx of [-.72,-.36,0,.36,.72])for(const nz of [-.72,-.36,0,.36,.72]){
   const x=nx*h,z=nz*h;
   if(CITIES.some(c=>Math.hypot(c.x-x,c.z-z)<220))continue;
   if(activeMapId==='serra'&&BattleAssets.scans.some(s=>Math.abs(x-s.x)<s.width/2+120&&Math.abs(z-s.z)<s.depth/2+120))continue;
   if(arenaBaseHeight(x,z)<4||arenaBaseHeight(x,z)>55)continue;
   const nearest=CITIES.reduce((a,b)=>Math.hypot(a.x-x,a.z-z)<Math.hypot(b.x-x,b.z-z)?a:b);
   const c={name:'Vila '+(++number),x,z,r:82,type:'hamlet'};CITIES.push(c);MAP_ROADS.push({a:c,b:nearest});
  }
 }
}
function arenaBaseHeight(x,z){
 const h=HALF_WORLD,nx=x/h,nz=z/h;
 let y=12+4*Math.sin(x*.008)*Math.cos(z*.009)+2*Math.sin(x*.026+z*.014);
 for(const m of MOUNTAINS)y+=m.h*Math.exp(-((x-m.x)**2+(z-m.z)**2)/(m.r*m.r*.5));
 if(activeMapId==='islands'){
  let land=0;for(const c of CITIES)land=Math.max(land,1-Math.hypot(x-c.x,z-c.z)/(h*.48));
  y=y*smooth01(clamp01((land+.08)/.3))-6*(1-smooth01(clamp01((land+.08)/.3)));
 }else{
  const edge=smooth01(clamp01((.96-Math.max(Math.abs(nx),Math.abs(nz)))/.18));y=y*edge-6*(1-edge);
  if(activeMapId==='tropical'){const river=Math.abs(x-Math.sin(z/h*4)*h*.12);const bank=smooth01(clamp01((river-12)/25));y=y*bank-3*(1-bank);}
 }
 for(const c of CITIES){const d=Math.hypot(x-c.x,z-c.z),t=smooth01(clamp01((d-c.r)/32));if(t<1)y=y*t+(c.type==='observatory'?38:5)*(1-t);}
 // Real scans get a flat blend around their border; their baked heightfields
 // supply walkable surfaces inside, instead of a giant invisible bounding box.
 if(activeMapId==='serra')for(const s of BattleAssets.scans){const d=Math.max(Math.abs(x-s.x)/(s.width/2+15),Math.abs(z-s.z)/(s.depth/2+15));if(d<1.25){const t=smooth01(clamp01((d-1)/.25));y=y*t+s.base*(1-t);}}
 return y;
}
function arenaMeshHeight(x,z){
 const step=WORLD_SIZE/400,gx=(x+HALF_WORLD)/step,gz=(z+HALF_WORLD)/step,ix=Math.floor(gx),iz=Math.floor(gz),fx=gx-ix,fz=gz-iz,x0=ix*step-HALF_WORLD,z0=iz*step-HALF_WORLD;
 const a=arenaBaseHeight(x0,z0),b=arenaBaseHeight(x0+step,z0),c=arenaBaseHeight(x0,z0+step),d=arenaBaseHeight(x0+step,z0+step);
 return fx+fz<=1?a+(b-a)*fx+(c-a)*fz:d+(c-d)*(1-fx)+(b-d)*(1-fz);
}
function arenaGroundBase(x,z){const y=arenaBaseHeight(x,z);for(const {a,b}of MAP_ROADS){const dx=b.x-a.x,dz=b.z-a.z,t=clamp01(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz));if(Math.hypot(x-a.x-t*dx,z-a.z-t*dz)<5)return Math.max(y,arenaMeshHeight(x,z),1.4)+.35;}return y;}
function arenaHeight(x,z){let y=arenaGroundBase(x,z);if(activeMapId==='serra')for(const s of BattleAssets.scans){const v=BattleAssets.heightAt(s,x,z);if(v!==null)y=Math.max(y,v);}return y;}
function arenaRoadHeight(x,z){return Math.max(arenaBaseHeight(x,z)+.14,1.4);}

function buildBattleMapTexture(){
 const cv=document.createElement('canvas');cv.width=cv.height=160;const ctx=cv.getContext('2d'),image=ctx.createImageData(160,160);
 for(let z=0;z<160;z++)for(let x=0;x<160;x++){const wx=(x/160-.5)*WORLD_SIZE,wz=(z/160-.5)*WORLD_SIZE,h=arenaBaseHeight(wx,wz),c=h<0?[45,99,125]:activeMapId==='serra'&&wx>0?[172,153,112]:h>50?[107,111,102]:[62,105,79],at=(z*160+x)*4;image.data.set([...c,255],at);}
 ctx.putImageData(image,0,0);const to=v=>(v/WORLD_SIZE+.5)*160;ctx.strokeStyle='#b3b29a';ctx.lineWidth=1;
 for(const {a,b}of MAP_ROADS){ctx.beginPath();ctx.moveTo(to(a.x),to(a.z));ctx.lineTo(to(b.x),to(b.z));ctx.stroke();}
 if(activeMapId==='serra'){ctx.fillStyle='#b2b6b3';for(const s of BattleAssets.scans)ctx.fillRect(to(s.x-s.width/2),to(s.z-s.depth/2),Math.max(1,s.width/WORLD_SIZE*160),Math.max(1,s.depth/WORLD_SIZE*160));}
 return cv;
}
