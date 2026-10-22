// Mechanical bundle of the pinned MIT Three.js r149 helpers; uses the existing
// global renderer, never a second copy/version of Three.js or a remote CDN.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../jarvis-141-ajustes/package.json',import.meta.url));
const {build}=require('esbuild');
const root=path.resolve(import.meta.dirname,'../games/battle-royale');
const files=['loaders/GLTFLoader.js','utils/BufferGeometryUtils.js','utils/SkeletonUtils.js'];
const names=new Set();
for(const file of files){const source=fs.readFileSync(path.join(root,'engine/vendor',file),'utf8');for(const m of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*'three'/g))for(const n of m[1].split(','))if(n.trim())names.add(n.trim());}
await build({stdin:{contents:"import{GLTFLoader}from'./engine/vendor/loaders/GLTFLoader.js';import{clone}from'./engine/vendor/utils/SkeletonUtils.js';import{mergeBufferGeometries}from'./engine/vendor/utils/BufferGeometryUtils.js';window.BattleGLTF={GLTFLoader,clone,mergeBufferGeometries};",resolveDir:root},bundle:true,format:'iife',minify:true,legalComments:'eof',outfile:path.join(root,'engine/battle-gltf.js'),plugins:[{name:'three-r149-global',setup(b){b.onResolve({filter:/^three$/},()=>({path:'three',namespace:'global-three'}));b.onLoad({filter:/.*/,namespace:'global-three'},()=>({contents:`const {${[...names].join(',')}}=globalThis.THREE;export{${[...names].join(',')}};`}));}}]});
console.log('Carregador GLB r149 gerado; licença em engine/vendor/LICENSE.');
