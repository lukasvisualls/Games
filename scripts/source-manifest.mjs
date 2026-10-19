import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),base=path.resolve(root,'../upstream-native');
const sources={
 'SuperTuxKart-1.5-src.tar.gz':'https://github.com/supertuxkart/stk-code/releases/download/1.5/SuperTuxKart-1.5-src.tar.gz',
 'luanti-5.17.0-source.tar.gz':'https://github.com/luanti-org/luanti/archive/refs/tags/5.17.0.tar.gz',
 'VoxeLibre-0.92.3.zip':'https://github.com/VoxeLibre/VoxeLibre/archive/refs/tags/0.92.3.zip',
 'openal-soft-1.25.1-source.tar.gz':'https://github.com/kcat/openal-soft/archive/refs/tags/1.25.1.tar.gz',
 'gettext-0.20.2-source.tar.xz':'https://ftp.gnu.org/gnu/gettext/gettext-0.20.2.tar.xz',
 'libiconv-1.17-source.tar.gz':'https://ftp.gnu.org/gnu/libiconv/libiconv-1.17.tar.gz',
};
const result={};for(const [name,url] of Object.entries(sources)){const file=path.join(base,name),hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);result[name]={url,size:fs.statSync(file).size,sha256:hash.digest('hex')};}
fs.writeFileSync(path.join(root,'source-archives.json'),JSON.stringify(result,null,2)+'\n');
