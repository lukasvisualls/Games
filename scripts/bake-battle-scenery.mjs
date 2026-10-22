// Rasterizes the supplied static scans once, offline. No triangle raycast over
// a million faces for every player/bot on every rendered frame.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(new URL('../../jarvis-141-ajustes/package.json',import.meta.url));const THREE=require('three');
const root=path.resolve(import.meta.dirname,'../games/battle-royale/assets');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'../scenery-manifest.json'),'utf8'));
for(const {id,file,span,x,z,decorative}of manifest){
 const bytes=fs.readFileSync(path.join(root,file));let json,bin;
 for(let o=12;o<bytes.length;){const n=bytes.readUInt32LE(o),type=bytes.readUInt32LE(o+4);if(type===0x4e4f534a)json=JSON.parse(bytes.toString('utf8',o+8,o+8+n).trim());else if(type===0x004e4942)bin=bytes.subarray(o+8,o+8+n);o+=8+n;}
 const ar=i=>{const a=json.accessors[i],v=json.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],size={5121:1,5123:2,5125:4,5126:4}[a.componentType],method={5121:'readUInt8',5123:'readUInt16LE',5125:'readUInt32LE',5126:'readFloatLE'}[a.componentType];if(!n||!size||!method||a.sparse)throw Error('Accessor não suportado');const stride=v.byteStride||size*n,base=(v.byteOffset||0)+(a.byteOffset||0);return {count:a.count,get(k,c=0){return bin[method](base+k*stride+c*size);}};};
 const meshes=[];const box=new THREE.Box3();
 function visit(i,parent){const n=json.nodes[i],local=new THREE.Matrix4();if(n.matrix)local.fromArray(n.matrix);else local.compose(new THREE.Vector3(...(n.translation||[0,0,0])),new THREE.Quaternion(...(n.rotation||[0,0,0,1])),new THREE.Vector3(...(n.scale||[1,1,1])));const world=parent.clone().multiply(local);
  if(n.mesh!==undefined)for(const p of json.meshes[n.mesh].primitives){if((p.mode??4)!==4)continue;const a=ar(p.attributes.POSITION),points=[];for(let k=0;k<a.count;k++){const v=new THREE.Vector3(a.get(k,0),a.get(k,1),a.get(k,2)).applyMatrix4(world);box.expandByPoint(v);points.push(v);}meshes.push({points,index:p.indices===undefined?null:ar(p.indices)});}
  for(const child of n.children||[])visit(child,world);
 }
 for(const i of json.scenes[json.scene||0].nodes)visit(i,new THREE.Matrix4());
 const size=box.getSize(new THREE.Vector3()),scale=span/Math.max(size.x,size.z),width=size.x*scale,depth=size.z*scale,N=193,heights=Array(N*N).fill(null),floors=Array.from({length:N*N},()=>[]),walls=Array.from({length:N*N},()=>[]);
 for(const {points,index}of (decorative?[]:meshes)){const count=index?.count||points.length;
  for(let k=0;k<count;k+=3){const t=[0,1,2].map(c=>points[index?index.get(k+c):k+c]);const v=t.map(p=>({x:(p.x-box.min.x)/size.x*N-.5,z:(p.z-box.min.z)/size.z*N-.5,y:(p.y-box.min.y)*scale}));
   const normal=new THREE.Vector3().crossVectors(t[1].clone().sub(t[0]),t[2].clone().sub(t[0])).normalize();
   if(Math.abs(normal.y)<.45){const lo=Math.min(...v.map(p=>p.y)),hi=Math.max(...v.map(p=>p.y));for(const [a,b]of [[0,1],[1,2],[2,0]]){const n=Math.ceil(Math.max(Math.abs(v[a].x-v[b].x),Math.abs(v[a].z-v[b].z))*2);for(let step=0;step<=n;step++){const f=n?step/n:0,ix=Math.round(v[a].x+(v[b].x-v[a].x)*f),iz=Math.round(v[a].z+(v[b].z-v[a].z)*f);if(ix>=0&&iz>=0&&ix<N&&iz<N)walls[iz*N+ix].push([lo,hi]);}}}
   const den=(v[1].z-v[2].z)*(v[0].x-v[2].x)+(v[2].x-v[1].x)*(v[0].z-v[2].z);if(Math.abs(den)<1e-10||Math.abs(normal.y)<.45)continue;
   for(let iz=Math.max(0,Math.ceil(Math.min(...v.map(p=>p.z))));iz<=Math.min(N-1,Math.floor(Math.max(...v.map(p=>p.z))));iz++)for(let ix=Math.max(0,Math.ceil(Math.min(...v.map(p=>p.x))));ix<=Math.min(N-1,Math.floor(Math.max(...v.map(p=>p.x))));ix++){
    const a=((v[1].z-v[2].z)*(ix-v[2].x)+(v[2].x-v[1].x)*(iz-v[2].z))/den,b=((v[2].z-v[0].z)*(ix-v[2].x)+(v[0].x-v[2].x)*(iz-v[2].z))/den,c=1-a-b;if(Math.min(a,b,c)<-.001)continue;const y=a*v[0].y+b*v[1].y+c*v[2].y,at=iz*N+ix;heights[at]=Math.round(Math.max(heights[at]??-Infinity,y)*100)/100;floors[at].push(Math.round(y*100)/100);
   }
  }
 }
 for(let i=0;i<N*N;i++){floors[i]=[...new Set(floors[i])].sort((a,b)=>a-b).filter((v,j,a)=>!j||v-a[j-1]>.12);const merged=[];for(const [lo,hi]of walls[i].sort((a,b)=>a[0]-b[0])){const prior=merged.at(-1);if(prior&&lo<=prior[1]+.15)prior[1]=Math.max(prior[1],hi);else merged.push([lo,hi]);}walls[i]=merged.map(p=>p.map(v=>Math.round(v*100)/100));}
 fs.writeFileSync(path.join(root,id+'-collision.json'),JSON.stringify({version:2,resolution:N,x,z,base:5,scale,width,depth,minY:box.min.y,center:[(box.min.x+box.max.x)/2,(box.min.z+box.max.z)/2],heights,floors,walls}));
 console.log(id+': '+width.toFixed(1)+' × '+depth.toFixed(1)+' m; '+heights.filter(v=>v!==null).length+' células de superfície; autoria/licença preservadas no GLB.');
}
