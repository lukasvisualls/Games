import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),tag='games-latencia-2026-10-22';
const archiver=path.resolve(root,'../jarvis-141-ajustes/node_modules/electron-winstaller/vendor/7z.exe');
const output=path.join(root,'packages',tag);
if(fs.existsSync(output))throw Error('Candidato já existe; não substituir automaticamente: '+output);
fs.mkdirSync(output,{recursive:true});
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog-v3.json'),'utf8'));
for(const id of ['battle-royale','agario']){
 const file=path.join(output,id+'.zip');
 const result=spawnSync(archiver,['a','-tzip','-mx=5',file,'.'],{cwd:path.join(root,'games',id),stdio:'inherit',windowsHide:true});
 if(result.status!==0)throw Error('Falha ao compactar '+id);
 const bytes=fs.readFileSync(file);
 catalog.games[id]={...catalog.games[id],version:'1.2.1',url:'https://github.com/lukasvisualls/Games/releases/download/'+tag+'/'+id+'.zip',size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),multiplayer:'none',friendMultiplayer:{protocol:1,minJarvis:'2.1.160',players:2}};
}
// Only a candidate catalog: do not replace the public/current catalog here.
fs.writeFileSync(path.join(output,'catalog-v3.json'),JSON.stringify(catalog,null,2)+'\n');
console.log('Candidatos 1.2.1 em '+output+'. Sem publicação nem alteração do catálogo público.');
