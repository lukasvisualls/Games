// Original low-poly settlements around the provided scans. Shared instance
// batches keep trees/buildings inexpensive even with 75 independently moving bots.
function buildArenaWorld(scene){
 const colliders=[],harvestables=[],chestSpots=[],lootSpots=[],houses=[],batches=new Map(),roads=[],details={grass:0,shrubs:0,pebbles:0,cars:0};
 const lambert=options=>{const material=new THREE.MeshLambertMaterial(options);material.color.convertSRGBToLinear();return material;};
 const batch=(shape,color)=>{const key=shape+':'+color;if(!batches.has(key))batches.set(key,{shape,color,items:[],mesh:null});return batches.get(key);};
 const piece=(shape,color,x,y,z,w,h,d,rotation=0)=>{const b=batch(shape,color),i=b.items.length;const matrix=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rotation),new THREE.Vector3(w,h,d));b.items.push(matrix);return {batch:b,index:i};};
 const box=(color,x,y,z,w,h,d,rotation=0)=>piece('box',color,x,y,z,w,h,d,rotation);
 const removePieces=parts=>{const zero=new THREE.Matrix4().makeScale(0,0,0);for(const p of parts)if(p.batch.mesh){p.batch.mesh.setMatrixAt(p.index,zero);p.batch.mesh.instanceMatrix.needsUpdate=true;}};
 const collider=(x,z,w,d,bottom,top)=>{const a={minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,bottom,top};colliders.push(a);return a;};
 const geo=new THREE.PlaneGeometry(WORLD_SIZE,WORLD_SIZE,400,400);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,colors=[];
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i),h=arenaBaseHeight(x,z);pos.setY(i,h);
  const desert=activeMapId==='serra'&&x>0,sand=h<4,rock=h>50,c=new THREE.Color(rock?0x737369:sand||desert?0xb7a27a:0x547957);
  c.convertSRGBToLinear().multiplyScalar(.94+Math.random()*.1);colors.push(c.r,c.g,c.b);
 }
 // Repeated low-resolution ground grain keeps bare land visibly grass/soil,
 // without loading another image or allocating one texture per patch.
 const pixels=new Uint8Array(64*64*4);for(let i=0;i<64*64;i++){const grain=166+((i*73^(i>>>6)*151)%78);pixels.set([grain,grain,grain,255],i*4);}
 const groundTexture=new THREE.DataTexture(pixels,64,64,THREE.RGBAFormat);groundTexture.wrapS=groundTexture.wrapT=THREE.RepeatWrapping;groundTexture.repeat.set(WORLD_SIZE/10,WORLD_SIZE/10);groundTexture.generateMipmaps=true;groundTexture.minFilter=THREE.LinearMipmapLinearFilter;groundTexture.magFilter=THREE.LinearFilter;groundTexture.needsUpdate=true;
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();scene.add(new THREE.Mesh(geo,lambert({vertexColors:true,map:groundTexture})));
 const water=new THREE.Mesh(new THREE.PlaneGeometry(WORLD_SIZE*2,WORLD_SIZE*2),lambert({color:0x347e9b}));water.rotation.x=-Math.PI/2;water.position.y=0;scene.add(water);
 // Roads conform to the terrain; water crossings have solid walkable decks.
 for(const {a,b}of MAP_ROADS){
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),nx=-dz/len*5,nz=dx/len*5,points=[],N=Math.ceil(len/3);
  for(let i=0;i<N;i++){
   const p=i/N,q=(i+1)/N;for(const [t,side]of [[p,-1],[q,-1],[q,1],[p,-1],[q,1],[p,1]]){const x=a.x+dx*t+nx*side,z=a.z+dz*t+nz*side;points.push(x,Math.max(arenaBaseHeight(x,z),arenaMeshHeight(x,z),1.4)+.40,z);}
   if(i%5===0){const x=a.x+dx*p,z=a.z+dz*p;if(arenaBaseHeight(x,z)<0)box(0x858b89,x,.1,z,1.5,2.5,1.5);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.computeVertexNormals();scene.add(new THREE.Mesh(g,lambert({color:0x4e5355,side:THREE.DoubleSide})));
  roads.push({a:{x:a.x,z:a.z},b:{x:b.x,z:b.z}});
 }
 function house(x,z,variant){
  const w=7+(variant%5)*1.1,d=8+(Math.floor(variant/5)%5)*.85,h=3.2+(variant%3)*.45,y=arenaHeight(x,z),color=[0xc8b5a0,0xb38b74,0x9caeac,0xe0cda5,0x9ba6b4][variant%5],parts=[],walls=[];
  const wall=(cx,cz,ww,dd)=>{parts.push(box(color,cx,y+h/2,cz,ww,h,dd));walls.push(collider(cx,cz,ww,dd,y,y+h));};
  wall(x-w/2,z,.32,d);wall(x+w/2,z,.32,d);wall(x,z-d/2,w,.32);
  const gap=1.8,segment=(w-gap)/2;wall(x-gap/2-segment/2,z+d/2,segment,.32);wall(x+gap/2+segment/2,z+d/2,segment,.32);
  parts.push(box(color,x,y+h-.4,z+d/2,gap,.8,.32));
  const roof=box([0x755b4c,0x505c65,0x7c6c57][variant%3],x,y+h+.16,z,w+.8,.3,d+.8);parts.push(roof);
  const roofSurface=collider(x,z,w+.8,d+.8,y+h,y+h+.32);roofSurface.supportOnly=true;walls.push(roofSurface);
  for(const side of [-1,1])parts.push(box(0x45626a,x+side*(w/2+.18),y+1.7,z, .06,1.25,1.6));
  if(variant%2)parts.push(box(0x765d43,x+w*.3,y+h+.9,z-d*.2,.9,1.5,.9));
  houses.push({x,z,y,width:w,depth:d,height:h,variant,door:{x,z:z+d/2}});
  harvestables.push({kind:'building',aabb:{minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,top:y+h},meshes:[],hp:600,material:'stone',yield:10,cx:x,cz:z,cy:y+h/2,onDestroy(){removePieces(parts);for(const a of walls){const at=colliders.indexOf(a);if(at>=0)colliders.splice(at,1);}}});
  // The doorway is open, the interior is traversable and contains actual loot.
  chestSpots.push({x,z});lootSpots.push({x:x+1.5,z:z+1.5});
 }
 function sign(text,x,z){const cv=document.createElement('canvas');cv.width=512;cv.height=96;const ctx=cv.getContext('2d');ctx.fillStyle='#081b25dd';ctx.fillRect(0,0,512,96);ctx.fillStyle='#d5e9db';ctx.font='bold 34px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,60);const t=new THREE.CanvasTexture(cv),s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));s.position.set(x,terrainHeight(x,z)+12,z);s.scale.set(20,3.75,1);scene.add(s);}
 function car(x,z,index){
  details.cars++;
  const y=arenaHeight(x,z),parts=[],color=[0x8f3931,0x436b78,0xc5b06a,0x8c9487][index%4];
  parts.push(box(color,x,y+.7,z,1.9,.8,4));parts.push(box(0x273b43,x,y+1.35,z-.25,1.7,.65,2));
  for(const side of [-1,1])for(const end of [-1,1])parts.push(box(0x252b2d,x+side*.96,y+.35,z+end*1.15,.2,.6,.7));
  const a=collider(x,z,2.1,4.2,y,y+1.7);harvestables.push({kind:'car',x,z,r:2.4,collider:a,meshes:[],hp:250,material:'metal',yield:10,cy:y+.8,onDestroy(){removePieces(parts);}});
 }
 for(const [index,c]of CITIES.entries()){
  const n=c.type==='town'?25:c.type==='village'?10:4;
  for(let i=0;i<n;i++){const col=i%5,row=Math.floor(i/5);house(c.x+[-60,-34,18,44,70][col],c.z-54+row*25,i);}
  // Central lanes and a readable, distinct landmark at every settlement.
  for(const axis of [0,1])for(let k=-8;k<=8;k++){const x=c.x+(axis?k*10:0),z=c.z+(axis?0:k*10);box(0x646761,x,arenaHeight(x,z)+.08,z,axis?10:8,.1,axis?8:10);}
  sign(c.name,c.x,c.z);
  for(let i=0;i<3;i++)car(c.x+7,c.z-32+i*25,index+i);
  const x=c.x,z=c.z,y=arenaHeight(x,z);
  if(c.type==='town'){
   box(0xc2b695,x,y+8,z,5,16,5);collider(x,z,5,5,y,y+16);
   piece('cone',0x5c695f,x,y+18,z,5,4,5,Math.PI/4);
   for(const s of [-1,1]){box(0xf2e4c3,x+s*2.55,y+13,z,.1,2.3,2.3);box(0x2d3b3b,x+s*2.62,y+13.4,z,.06,.8,.13);}
   for(let i=0;i<5;i++){box(0x977858,x-18+i*8,y+1,z+76,5,2,3);box(i%2?0xc99564:0x5e8c7a,x-18+i*8,y+3,z+76,6,.25,5);}
   box(0x8b9692,x+40,y+11,z+75,6,4,6);for(const sx of [-2,2])for(const sz of [-2,2])box(0x576668,x+40+sx,y+4.8,z+75+sz,.35,9.6,.35);
  }else if(['factory','dockyard','shipyard','harbor'].includes(c.type)){
   for(let i=0;i<5;i++)box(i%2?0x6f9191:0x9a6d4e,x-20+i*9,y+1.5,z+55,7,3,3.2);
   box(0x748184,x+35,y+9,z+55,1.3,18,1.3);box(0xb6a578,x+22,y+17,z+55,28,1.3,1.3);
   if(c.type==='factory')for(let i=0;i<3;i++){piece('trunk',0x8a8274,x-15+i*15,y+10,z+77,3,20,3);collider(x-15+i*15,z+77,3,3,y,y+20);}
  }else if(c.type==='observatory'){
   piece('trunk',0xb1b5ad,x,y+4,z,12,8,12);piece('sphere',0xd4dbce,x,y+9,z,12,8,12);collider(x,z,12,12,y,y+12);
  }else if(c.type==='military'){
   box(0x777c65,x,y+2.5,z+50,15,5,10);collider(x,z+50,15,10,y,y+5);piece('cone',0x9ba594,x,y+10,z+50,12,5,12);
  }else if(c.type==='mill'){
   box(0xa68b65,x,y+5,z+55,5,10,5);box(0xc5be9c,x,y+8,z+58,1,15,.35);box(0xc5be9c,x,y+8,z+58,15,1,.35);
   for(let i=0;i<8;i++)box(i%2?0x8f965f:0xa5a267,x-30+i*7,y+.15,z+76,4,.3,25);
  }
 }
 const onRoad=(x,z)=>MAP_ROADS.some(({a,b})=>{const dx=b.x-a.x,dz=b.z-a.z,t=clamp01(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz));return Math.hypot(x-a.x-t*dx,z-a.z-t*dz)<9;});
 for(let i=0;i<10000;i++){
  const centers=[[-.65,-.4],[-.6,.5],[-.25,-.65]],c=centers[i%3],angle=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*HALF_WORLD*.22,cluster=i%4!==0;
  const concentrated=cluster&&i%2===0;
  const x=concentrated?c[0]*HALF_WORLD+Math.cos(angle)*r:(Math.random()-.5)*WORLD_SIZE*.94,z=concentrated?c[1]*HALF_WORLD+Math.sin(angle)*r:(Math.random()-.5)*WORLD_SIZE*.94,y=arenaHeight(x,z);
  if(y<3||isInCity(x,z)||onRoad(x,z)||isBlockedAt(x,z,2,colliders))continue;
  if(activeMapId==='serra'&&((x>80&&Math.random()>.16)||BattleAssets.scans.some(s=>Math.abs(x-s.x)<s.width/2+12&&Math.abs(z-s.z)<s.depth/2+12)))continue;
  const s=.8+Math.random()*.9,palm=activeMapId==='tropical'&&(y<10||Math.abs(x)<100),parts=[];
  parts.push(piece('trunk',0x72614a,x,y+2.8*s,z,.55*s,5.6*s,.55*s));
  if(palm){for(let k=0;k<3;k++)parts.push(piece('sphere',0x537954,x,y+5.8*s,z,7*s,.8*s,1.3*s,k*Math.PI/3));}
  else {parts.push(piece('cone',0x3c6652,x,y+5*s,z,4.8*s,6*s,4.8*s));parts.push(piece('cone',0x62835a,x,y+6.5*s,z,3.6*s,4*s,3.6*s));}
  harvestables.push({kind:'tree',x,z,r:1.2,meshes:[],hp:150,material:'wood',yield:10,cy:y+2.5,onDestroy(){removePieces(parts);}});
 }
 for(let i=0;i<450;i++){
  const x=(Math.random()-.5)*WORLD_SIZE*.9,z=(Math.random()-.5)*WORLD_SIZE*.9,y=arenaHeight(x,z);if(y<2||isInCity(x,z)||onRoad(x,z))continue;
  const s=1+Math.random()*2,part=piece('rock',0x918a79,x,y+s*.4,z,s*2,s*1.4,s*2,Math.random()*Math.PI);
  harvestables.push({kind:'rock',x,z,r:s+1,meshes:[],hp:200,material:'stone',yield:10,cy:y+s*.4,onDestroy(){removePieces([part]);}});
 }
 // A coverage grid distributes lightweight detail across the whole land,
 // including the spaces between the imported scenes. Keep roads, entrances,
 // water and scan interiors clear; tiny dressing is not a networked obstacle.
 const step=100;
 for(let gx=-HALF_WORLD+70;gx<HALF_WORLD-60;gx+=step)for(let gz=-HALF_WORLD+70;gz<HALF_WORLD-60;gz+=step){
  for(let n=0;n<12;n++){
   const x=gx+Math.random()*80,z=gz+Math.random()*80,y=arenaHeight(x,z);
   if(y<3||isInCity(x,z)||onRoad(x,z)||isBlockedAt(x,z,2,colliders))continue;
   if(activeMapId==='serra'&&BattleAssets.scans.some(s=>Math.abs(x-s.x)<s.width/2+6&&Math.abs(z-s.z)<s.depth/2+6))continue;
   const dry=activeMapId==='serra'&&x>80,w=1.4+Math.random()*2;
   piece('grass',dry?0x82794a:0x466b36,x,y+.35,z,w,.7,w,Math.random()*Math.PI);details.grass++;
   if(n===0){piece('sphere',dry?0x7d7654:0x3f6140,x+2,y+.65,z,2.8,1.3,2.4);details.shrubs++;}
   if(n%4===0){piece('rock',dry?0x958166:0x71796b,x-2,y+.2,z,1.1,.55,1.4,Math.random()*Math.PI);details.pebbles++;}
  }
 }
 // Stranded cars along road shoulders are scenery/farm objects, never placed
 // in the driving lane or on the imported model's walls.
 let roadsideIndex=0;
 for(const {a,b}of MAP_ROADS){const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);for(let d=170;d<len-100;d+=290){
  const t=d/len,x=a.x+dx*t-dz/len*9,z=a.z+dz*t+dx/len*9,y=arenaHeight(x,z);
  if(y<3||isInCity(x,z)||isBlockedAt(x,z,3,colliders)||(activeMapId==='serra'&&BattleAssets.scans.some(s=>Math.abs(x-s.x)<s.width/2+8&&Math.abs(z-s.z)<s.depth/2+8)))continue;
  car(x,z,roadsideIndex++);
 }}
 for(const b of batches.values()){
  let geometry;
  if(b.shape==='grass'){geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-.5,-.5,0,.5,-.5,0,0,.5,0,0,-.5,-.5,0,-.5,.5,0,.5,0],3));geometry.computeVertexNormals();}
  else geometry=b.shape==='box'?new THREE.BoxGeometry(1,1,1):b.shape==='cone'?new THREE.ConeGeometry(.5,1,6):b.shape==='trunk'?new THREE.CylinderGeometry(.45,.5,1,6):b.shape==='rock'?new THREE.DodecahedronGeometry(.5):new THREE.SphereGeometry(.5,8,5);
  const mesh=new THREE.InstancedMesh(geometry,lambert({color:b.color,side:b.shape==='grass'?THREE.DoubleSide:THREE.FrontSide}),b.items.length);b.items.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere?.();mesh.frustumCulled=false;b.mesh=mesh;scene.add(mesh);
 }
 if(activeMapId==='serra'){
  for(const scan of BattleAssets.scans){const copy=scan.root.clone(true);copy.userData.sceneryCenter={x:scan.x,z:scan.z};copy.traverse(o=>{if(o.isMesh){o.userData.sharedBattleGeometry=true;o.userData.sharedBattleMaterial=true;}});scene.add(copy);sign(scan.id,scan.x,scan.z);lootSpots.push({x:scan.x+scan.width/2+4,z:scan.z});}
  for(const asset of BattleAssets.foliage||[]){
   const spots=[];for(let tries=0;spots.length<asset.count&&tries<asset.count*10;tries++){const x=-80-Math.random()*HALF_WORLD*.75,z=(Math.random()-.5)*WORLD_SIZE*.8;if(terrainHeight(x,z)<3||isInCity(x,z)||onRoad(x,z)||BattleAssets.scans.some(s=>Math.abs(x-s.x)<s.width/2+8&&Math.abs(z-s.z)<s.depth/2+8))continue;spots.push({x,z,y:terrainHeight(x,z),rotation:Math.random()*Math.PI*2});}
   const refs=spots.map(()=>[]);asset.root.traverse(o=>{if(!o.isMesh)return;const mesh=new THREE.InstancedMesh(o.geometry,o.material,spots.length);mesh.userData.sharedBattleGeometry=true;mesh.userData.sharedBattleMaterial=true;mesh.frustumCulled=false;
    spots.forEach((s,i)=>{const m=new THREE.Matrix4().compose(new THREE.Vector3(s.x,s.y,s.z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),s.rotation),new THREE.Vector3(1,1,1)).multiply(o.matrixWorld);mesh.setMatrixAt(i,m);refs[i].push({batch:{mesh},index:i});});scene.add(mesh);
   });
   if(asset.file==='tree.glb')spots.forEach((s,i)=>harvestables.push({kind:'tree',x:s.x,z:s.z,r:1.2,meshes:[],hp:150,material:'wood',yield:10,cy:s.y+3,onDestroy(){removePieces(refs[i]);}}));
  }
 }
 return {colliders,harvestables,chestSpots,lootSpots,houses,roads,details};
}
