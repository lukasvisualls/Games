import fs from 'node:fs';import path from 'node:path';
const dest=path.resolve(import.meta.dirname,'../games/voxelibre/licenses');fs.mkdirSync(dest,{recursive:true});
// Versões fixadas no buildbot oficial do Luanti 5.17.0, sem executar código remoto.
const files={
 'curl-COPYING.txt':'https://raw.githubusercontent.com/curl/curl/curl-8_21_0/COPYING',
 'SDL2-LICENSE.txt':'https://raw.githubusercontent.com/libsdl-org/SDL/release-2.32.10/LICENSE.txt',
 'zlib-LICENSE.txt':'https://raw.githubusercontent.com/madler/zlib/v1.3.2/LICENSE',
 'zstd-LICENSE.txt':'https://raw.githubusercontent.com/facebook/zstd/v1.5.7/LICENSE',
 'libpng-LICENSE.txt':'https://raw.githubusercontent.com/pnggroup/libpng/v1.6.58/LICENSE',
 'libjpeg-turbo-LICENSE.md':'https://raw.githubusercontent.com/libjpeg-turbo/libjpeg-turbo/3.2.0/LICENSE.md',
 'libjpeg-turbo-README.ijg':'https://raw.githubusercontent.com/libjpeg-turbo/libjpeg-turbo/3.2.0/README.ijg',
 'freetype-LICENSE.txt':'https://raw.githubusercontent.com/freetype/freetype/VER-2-14-3/LICENSE.TXT',
 'freetype-FTL.txt':'https://raw.githubusercontent.com/freetype/freetype/VER-2-14-3/docs/FTL.TXT',
 'libogg-COPYING.txt':'https://raw.githubusercontent.com/xiph/ogg/v1.3.5/COPYING',
 'libvorbis-COPYING.txt':'https://raw.githubusercontent.com/xiph/vorbis/v1.3.7/COPYING',
 'leveldb-LICENSE.txt':'https://raw.githubusercontent.com/google/leveldb/1.23/LICENSE',
 'llvm-LICENSE.txt':'https://raw.githubusercontent.com/llvm/llvm-project/llvmorg-22.1.0/llvm/LICENSE.TXT',
};
for(const [name,url] of Object.entries(files)){const r=await fetch(url);if(!r.ok)throw Error(`${r.status}: ${url}`);fs.writeFileSync(path.join(dest,name),await r.text());}
fs.writeFileSync(path.join(dest,'ORIGINS.json'),JSON.stringify(files,null,2)+'\n');
console.log('Avisos oficiais preservados:',Object.keys(files).length);
