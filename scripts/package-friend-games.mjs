import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),tag='games-amigos-2026-10-21';
const archiver=path.resolve(root,'../jarvis-141-ajustes/node_modules/electron-winstaller/vendor/7z.exe');
const output=path.join(root,'packages',tag);fs.mkdirSync(output,{recursive:true});
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog-v3.json'),'utf8'));
for(const id of ['battle-royale','minecraft','agario']){
 const file=path.join(output,id+'.zip');if(fs.existsSync(file)){
  if(!process.argv.includes('--replace-candidate'))throw Error('Pacote já existe; confira antes de substituir: '+file);
  fs.renameSync(file,file+'.candidate-'+Date.now());
 }
 const result=spawnSync(archiver,['a','-tzip','-mx=5',file,'.'],{cwd:path.join(root,'games',id),stdio:'inherit',windowsHide:true});if(result.status!==0)throw Error('Falha ao compactar '+id);
 const bytes=fs.readFileSync(file);
 catalog.games[id]={...catalog.games[id],version:'1.2.0',url:'https://github.com/lukasvisualls/Games/releases/download/'+tag+'/'+id+'.zip',size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
 // Older launchers use this flag for an unrelated broadcast-only invite.
 // New launchers require the capability file and authenticated friend-room flow.
 multiplayer:'none',friendMultiplayer:{protocol:1,minJarvis:'2.1.149',players:2}};
}
fs.writeFileSync(path.join(root,'catalog-v3.json'),JSON.stringify(catalog,null,2)+'\n');
fs.copyFileSync(path.join(root,'catalog-v3.json'),path.join(output,'catalog-v3.json'));
console.log('Pacotes candidatos preparados em '+output);
