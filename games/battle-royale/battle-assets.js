// Only bundled, user-supplied local files. No viewer scraping or external URLs.
const BattleAssets={template:null,scans:[],error:null};
window.BattleAssets=BattleAssets;
BattleAssets.ready=(async()=>{
 const loader=new BattleGLTF.GLTFLoader();
 try{const gltf=await loader.loadAsync('assets/jarvis-sentinel.glb');BattleAssets.template=gltf.scene;BattleAssets.template.updateMatrixWorld(true);const other=await loader.loadAsync('assets/swat-bl.glb');BattleAssets.staticTemplate=other.scene;}
 catch(e){BattleAssets.error='Não foi possível carregar o soldado. O explorador clássico continua disponível.';console.warn(BattleAssets.error,e);}
 // Scenery is deliberately loaded on demand when its map is selected.
})();
BattleAssets.prepareScenery=async()=>{
 if(BattleAssets.sceneryReady)return BattleAssets.sceneryReady;
 BattleAssets.sceneryReady=fetch('scenery-manifest.json').then(r=>{if(!r.ok)throw Error('Lista de cenários indisponível');return r.json();}).then(async manifest=>{const scans=[];for(const {id,file}of manifest){
  const r=await fetch('assets/'+id+'-collision.json');if(!r.ok)throw Error('Colisão do cenário indisponível');const data=await r.json();
  const gltf=await new BattleGLTF.GLTFLoader().loadAsync('assets/'+file);const root=flattenBattleScenery(gltf.scene);root.updateMatrixWorld(true);
  const scale=data.scale;root.scale.multiplyScalar(scale);root.position.set(data.x-data.center[0]*scale,data.base-data.minY*scale,data.z-data.center[1]*scale);root.updateMatrixWorld(true);
  scans.push({...data,root,id});
 }BattleAssets.foliage=[];for(const [file,span,count]of [['tree.glb',8,160],['grass-pack.glb',3,90]]){const gltf=await new BattleGLTF.GLTFLoader().loadAsync('assets/'+file),root=flattenBattleScenery(gltf.scene),box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=span/(file==='tree.glb'?size.y:Math.max(size.x,size.z));root.scale.setScalar(scale);root.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);root.updateMatrixWorld(true);BattleAssets.foliage.push({file,root,count});}return scans;}).then(scans=>{BattleAssets.scans=scans;return scans;}).catch(e=>{BattleAssets.sceneryReady=null;throw e;});
 return BattleAssets.sceneryReady;
};
BattleAssets.heightAt=(s,x,z)=>{
 const u=(x-s.x)/s.width+.5,v=(z-s.z)/s.depth+.5;if(u<0||u>1||v<0||v>1)return null;
 const value=s.heights[Math.min(s.resolution-1,Math.floor(v*s.resolution))*s.resolution+Math.min(s.resolution-1,Math.floor(u*s.resolution))];
 return value===null?null:value+s.base;
};
BattleAssets.cell=(s,x,z)=>{const u=(x-s.x)/s.width+.5,v=(z-s.z)/s.depth+.5;if(u<0||u>=1||v<0||v>=1)return -1;return Math.floor(v*s.resolution)*s.resolution+Math.floor(u*s.resolution);};
BattleAssets.groundAt=(x,z,curY)=>{let y=arenaGroundBase(x,z);for(const s of BattleAssets.scans){const at=BattleAssets.cell(s,x,z);if(at<0)continue;for(const h of s.floors[at])if(h+s.base<=curY+.6)y=Math.max(y,h+s.base);}return y;};
BattleAssets.blockedAt=(x,z,y,r,h)=>{if(activeMapId!=='serra')return false;for(const s of BattleAssets.scans){for(const [dx,dz]of [[0,0],[-r,0],[r,0],[0,-r],[0,r]]){const at=BattleAssets.cell(s,x+dx,z+dz);if(at<0)continue;for(const [lo,hi]of s.walls[at])if(hi+s.base>y+.5&&lo+s.base<y+h-.15)return true;}}return false;};
BattleAssets.solidAt=(x,z,y)=>{if(activeMapId!=='serra')return false;for(const s of BattleAssets.scans){const at=BattleAssets.cell(s,x,z);if(at<0)continue;if(s.floors[at].some(h=>Math.abs(h+s.base-y)<.16)||s.walls[at].some(([lo,hi])=>lo+s.base-.1<y&&hi+s.base+.1>y))return true;}return false;};
function flattenBattleScenery(source){
 source.updateMatrixWorld(true);const groups=new Map(),textures=new Set();
 source.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geometry.applyMatrix4(o.matrixWorld);const material=o.material,key=material.uuid+':'+Object.keys(geometry.attributes).sort().join(',');if(!groups.has(key))groups.set(key,{material,geometries:[]});groups.get(key).geometries.push(geometry);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);});
 for(const t of textures){const image=t.image;if(!image||Math.max(image.width,image.height)<=1024)continue;const k=1024/Math.max(image.width,image.height),cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(image.width*k));cv.height=Math.max(1,Math.round(image.height*k));cv.getContext('2d').drawImage(image,0,0,cv.width,cv.height);t.image=cv;t.needsUpdate=true;}
 const root=new THREE.Group();for(const {material,geometries}of groups.values()){const merged=geometries.length===1?geometries[0]:BattleGLTF.mergeBufferGeometries(geometries,false);if(!merged)throw Error('Não foi possível combinar a geometria do cenário');root.add(new THREE.Mesh(merged,material));if(geometries.length>1)geometries.forEach(g=>g.dispose());}
 source.traverse(o=>o.geometry?.dispose());return root;
}
function buildImportedCharacter(id){
 if(id==='swat-bl')return buildSegmentedSWAT();
 if(id==='classic'||!BattleAssets.template)return null;
 const group=new THREE.Group(),model=BattleGLTF.clone(BattleAssets.template);group.add(model);
 model.updateMatrixWorld(true);
 if(!BattleAssets.normalization){const box=new THREE.Box3();model.traverse(o=>{if(!o.isMesh)return;const positions=o.geometry.attributes.position;for(let i=0;i<positions.count;i++){const p=new THREE.Vector3().fromBufferAttribute(positions,i);if(o.isSkinnedMesh)o.boneTransform(i,p);box.expandByPoint(p.applyMatrix4(o.matrixWorld));}});const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());BattleAssets.normalization={scale:2.15/size.y,offset:[-center.x,-box.min.y,-center.z]};}
 const n=BattleAssets.normalization;model.scale.multiplyScalar(n.scale);model.position.fromArray(n.offset).multiplyScalar(n.scale);model.updateMatrixWorld(true);
 const mats=[],skeletons=new Map();model.traverse(o=>{if(o.isMesh){o.userData.sharedBattleGeometry=true;o.frustumCulled=false;o.material=o.material.clone();o.material.color.multiply(new THREE.Color(BATTLE_CHARACTERS[id]?.tint||0xffffff));mats.push(o.material);if(o.isSkinnedMesh){const key=o.skeleton.bones.map(b=>b.uuid).join(',');if(skeletons.has(key))o.skeleton=skeletons.get(key);else skeletons.set(key,o.skeleton);}}});
 const bones=[];model.traverse(b=>{if(b.isBone)bones.push(b);});
 const find=n=>bones.find(b=>b.name.includes(n));
 const rig={head:find('Head1'),spine:find('Spine2'),L:{thigh:find('L_Thigh'),calf:find('L_Calf'),foot:find('L_Foot'),upper:find('L_UpperArm'),fore:find('L_Forearm'),hand:find('L_Hand')},R:{thigh:find('R_Thigh'),calf:find('R_Calf'),foot:find('R_Foot'),upper:find('R_UpperArm'),fore:find('R_Forearm'),hand:find('R_Hand')}};
 group.updateMatrixWorld(true);
 const rest=new Map(bones.map(b=>[b,{q:b.quaternion.clone(),x:new THREE.Vector3(1,0,0).applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert()),y:new THREE.Vector3(0,1,0).applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert())}]));
 const turn=(b,axis,angle)=>{if(b)b.quaternion.copy(rest.get(b).q).multiply(new THREE.Quaternion().setFromAxisAngle(rest.get(b)[axis],angle));};
 const gunMount=new THREE.Group();group.add(gunMount);
 const orient=(bone,child,target)=>{if(!bone||!child)return;group.updateMatrixWorld(true);const origin=bone.getWorldPosition(new THREE.Vector3()),dir=child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize(),wanted=target.clone().sub(origin).normalize();const q=new THREE.Quaternion().setFromUnitVectors(dir,wanted).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));};
 const armIK=(a,target)=>{
  if(!a.upper||!a.fore||!a.hand)return;group.updateMatrixWorld(true);
  const s=a.upper.getWorldPosition(new THREE.Vector3()),e=a.fore.getWorldPosition(new THREE.Vector3()),w=a.hand.getWorldPosition(new THREE.Vector3());
  const l1=s.distanceTo(e),l2=e.distanceTo(w),t=group.localToWorld(target.clone()),dir=t.clone().sub(s),d=Math.max(.001,Math.min(dir.length(),l1+l2-.001));dir.normalize();
  const along=(l1*l1-l2*l2+d*d)/(2*d),bend=new THREE.Vector3(0,-1,0).addScaledVector(dir,dir.y).normalize();
  const elbow=s.clone().addScaledVector(dir,along).addScaledVector(bend,Math.sqrt(Math.max(0,l1*l1-along*along)));
  orient(a.upper,a.fore,elbow);orient(a.fore,a.hand,t);
 };
 const dummy=()=>new THREE.Group();let time=0;
 const result={group,model,rig,bones,mats,gunMount,legL:dummy(),legR:dummy(),armL:dummy(),armR:dummy(),characterId:id,animate({moving=false,dt=0,phase='playing',pitch=0,crouch=false,swing=0,weapon=false}={}){
  time+=Math.min(dt,.1)*(moving?9:2);for(const [b,r]of rest)b.quaternion.copy(r.q);
  const walk=moving&&phase==='playing',stride=walk?Math.sin(time)*.48:0;
  turn(rig.L.thigh,'x',stride+(crouch?-.4:0));turn(rig.R.thigh,'x',-stride+(crouch?-.4:0));turn(rig.L.calf,'x',Math.max(0,-stride)*.9+(crouch?.7:0));turn(rig.R.calf,'x',Math.max(0,stride)*.9+(crouch?.7:0));
  turn(rig.head,'x',-pitch*.35);turn(rig.spine,'x',-pitch*.22+(crouch?.15:0));
  group.updateMatrixWorld(true);
  const strike=swing>0?Math.sin((1-swing/.4)*Math.PI)*.5:0;
  armIK(rig.R,new THREE.Vector3(-.32,1.35+pitch*.3+strike,.57-strike*.2));
  if(weapon)armIK(rig.L,new THREE.Vector3(.06,1.34+pitch*.3,.87));else turn(rig.L.upper,'x',-stride*.45);
  group.updateMatrixWorld(true);if(rig.R.hand)gunMount.position.copy(group.worldToLocal(rig.R.hand.getWorldPosition(new THREE.Vector3())));else gunMount.position.set(.35,1.35,.55);
  gunMount.rotation.x=-pitch;result.animationState=phase==='playing'?(walk?'walk':weapon?'aim':'idle'):'air';
 }};
 result.animate();return result;
}

// The other supplied SWAT has no skin. Rigid segmentation is deliberately
// labelled simplified: it is not presented as an original 84-joint skeleton.
function buildSegmentedSWAT(){
 if(!BattleAssets.staticTemplate)return null;const template=BattleAssets.staticTemplate;template.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(template),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=2.15/size.y;
 const group=new THREE.Group(),parts={torso:new THREE.Group(),head:new THREE.Group(),legL:new THREE.Group(),legR:new THREE.Group(),armL:new THREE.Group(),armR:new THREE.Group()};
 const pivots={torso:[0,0,0],head:[0,1.75,0],legL:[-.16,.95,0],legR:[.16,.95,0],armL:[-.36,1.55,0],armR:[.36,1.55,0]};for(const [key,p]of Object.entries(parts)){p.position.fromArray(pivots[key]);group.add(p);}
 const mats=[];template.traverse(mesh=>{if(!mesh.isMesh)return;const g=mesh.geometry,a=g.attributes.position,normal=g.attributes.normal,uv=g.attributes.uv,indices=g.index,buckets={};
  for(let i=0;i<(indices?.count||a.count);i+=3){const ids=[0,1,2].map(k=>indices?indices.getX(i+k):i+k),p=ids.map(i=>new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld).sub(new THREE.Vector3(center.x,bounds.min.y,center.z)).multiplyScalar(scale)),c=p.reduce((v,p)=>v.add(p),new THREE.Vector3()).multiplyScalar(1/3);
   const key=c.y>1.77?'head':c.y<.93?(c.x<0?'legL':'legR'):Math.abs(c.x)>.37?(c.x<0?'armL':'armR'):'torso',data=buckets[key]||={p:[],n:[],uv:[]};
   for(let k=0;k<3;k++){data.p.push(...p[k].sub(new THREE.Vector3(...pivots[key])).toArray());if(normal)data.n.push(...new THREE.Vector3().fromBufferAttribute(normal,ids[k]).transformDirection(mesh.matrixWorld).toArray());if(uv)data.uv.push(uv.getX(ids[k]),uv.getY(ids[k]));}
  }
  for(const [key,data]of Object.entries(buckets)){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(data.p,3));if(data.n.length)geo.setAttribute('normal',new THREE.Float32BufferAttribute(data.n,3));else geo.computeVertexNormals();if(data.uv.length)geo.setAttribute('uv',new THREE.Float32BufferAttribute(data.uv,2));const mat=mesh.material.clone();mats.push(mat);parts[key].add(new THREE.Mesh(geo,mat));}
 });
 const gunMount=new THREE.Group();gunMount.position.set(.4,1.4,.5);group.add(gunMount);
 return {group,...parts,gunMount,mats,characterId:'swat-bl',animate({pitch=0}={}){parts.head.rotation.x=-pitch*.3;}};
}
