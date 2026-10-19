import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const upstream=path.resolve(process.env.JARVIS_UPSTREAM_NATIVE||path.join(root,'../upstream-native'));
const stage=path.join(root,'native-runtime');
const archiver=process.env.JARVIS_7ZIP||path.resolve(root,'../jarvis-141-ajustes/node_modules/electron-winstaller/vendor/7z.exe');
const hash=file=>{const h=crypto.createHash('sha256'),fd=fs.openSync(file,'r'),b=Buffer.alloc(1024*1024);try{let n;while((n=fs.readSync(fd,b,0,b.length,null)))h.update(b.subarray(0,n));return h.digest('hex');}finally{fs.closeSync(fd);}};
fs.mkdirSync(stage,{recursive:true});fs.mkdirSync(path.join(root,'packages'),{recursive:true});
const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.cpSync(from,to,{recursive:true,filter:source=>!source.endsWith('.pdb')});};
const definitions=[
 {id:'tux-kart',version:'1.5.0',entry:'stk-code/build-x86_64/bin/supertuxkart.exe',displayName:'Super Tux Kart',inputs:['SuperTuxKart-1.5-win.zip'],prepare(dest){
  const original=path.join(upstream,'stk/SuperTuxKart-1.5-win/stk-code');
  copy(path.join(original,'data'),path.join(dest,'stk-code/data'));
  copy(path.join(original,'build-x86_64/bin'),path.join(dest,'stk-code/build-x86_64/bin'));
  copy(path.join(upstream,'STK-COPYING'),path.join(dest,'COPYING'));
 }},
 {id:'voxelibre',version:'0.92.3',entry:'bin/luanti.exe',displayName:'VoxeLibre',inputs:['luanti-5.17.0-win64.zip','VoxeLibre-0.92.3.zip'],prepare(dest){
  copy(path.join(upstream,'luanti/luanti-5.17.0-win64'),dest);
  copy(path.join(upstream,'voxelibre/VoxeLibre-0.92.3'),path.join(dest,'games/mineclone2'));
  copy(path.join(upstream,'LUANTI-LICENSE.txt'),path.join(dest,'LICENSE-Luanti.txt'));
  copy(path.join(upstream,'luanti-source/luanti-5.17.0/COPYING.LESSER'),path.join(dest,'COPYING.LESSER'));
  copy(path.join(upstream,'luanti-source/luanti-5.17.0/doc/lgpl-2.1.txt'),path.join(dest,'LGPL-2.1.txt'));
 }},
];
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog-v2.json'),'utf8'));catalog.version=3;
for(const game of definitions){
 const dest=path.join(stage,game.id),zip=path.join(root,'packages',game.id+'.zip');
 if(!fs.existsSync(dest)){fs.mkdirSync(dest);game.prepare(dest);}
 const inputHashes=Object.fromEntries(game.inputs.map(name=>[name,hash(path.join(upstream,name))]));
 if(game.id==='voxelibre'){
  copy(path.join(upstream,'luanti-source/luanti-5.17.0/COPYING.LESSER'),path.join(dest,'COPYING.LESSER'));
  copy(path.join(upstream,'luanti-source/luanti-5.17.0/doc/lgpl-2.1.txt'),path.join(dest,'LGPL-2.1.txt'));
  copy(path.join(root,'games/voxelibre/licenses'),path.join(dest,'third-party-licenses'));
 }
 fs.copyFileSync(path.join(root,'games',game.id,'NOTICE.md'),path.join(dest,'JARVIS-NOTICE.md'));
 fs.writeFileSync(path.join(dest,'upstream-sha256.json'),JSON.stringify(inputHashes,null,2)+'\n');
 if(!fs.existsSync(zip)){
  const p=spawnSync(archiver,['a','-tzip','-mx=3',zip,'.'],{cwd:dest,stdio:'inherit',windowsHide:true});if(p.status!==0)throw Error('Falha ao compactar '+game.id);
 }
 catalog.games[game.id]={version:game.version,kind:'native',entry:game.entry,url:`https://github.com/lukasvisualls/Games/releases/download/jarvis-native-2026-10-19/${game.id}.zip`,sha256:hash(zip),size:fs.statSync(zip).size,displayName:game.displayName,multiplayer:'none'};
 fs.writeFileSync(path.join(root,'games',game.id,'upstream-sha256.json'),JSON.stringify(inputHashes,null,2)+'\n');
 console.log(game.id,fs.statSync(zip).size,catalog.games[game.id].sha256);
}
const nitro=path.join(root,'packages/nitro-rush.zip');
if(!fs.existsSync(nitro)){const p=spawnSync(archiver,['a','-tzip','-mx=5',nitro,'.'],{cwd:path.join(root,'games/nitro-rush'),stdio:'inherit',windowsHide:true});if(p.status!==0)throw Error('Falha ao compactar Nitro');}
catalog.games['nitro-rush']={...catalog.games['nitro-rush'],version:'1.1.1',url:'https://github.com/lukasvisualls/Games/releases/download/jarvis-native-2026-10-19/nitro-rush.zip',sha256:hash(nitro),size:fs.statSync(nitro).size};
fs.writeFileSync(path.join(root,'catalog-v3.json'),JSON.stringify(catalog,null,2)+'\n');
