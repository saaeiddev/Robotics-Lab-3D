import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
const base='/Robotics-Lab-3D/';const html=readFileSync('dist/index.html','utf8');const refs=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
for(const ref of refs){if(!ref.startsWith(base))throw Error(`Incorrect production base: ${ref}`);if(!existsSync(join('dist',ref.slice(base.length))))throw Error(`Missing built asset: ${ref}`);}
const assets=readdirSync('dist/assets');const css=assets.filter(f=>f.endsWith('.css')).map(f=>readFileSync('dist/assets/'+f,'utf8')).join('\n');for(const match of css.matchAll(/url\(([^)]+)\)/g)){const ref=match[1].replace(/["']/g,'');if(ref.startsWith('data:'))continue;const path=ref.startsWith(base)?join('dist',ref.slice(base.length)):join('dist/assets',ref);if(!existsSync(path))throw Error('Missing CSS asset '+ref);}
if(/https?:\/\/[^"' )]+\.(?:glb|gltf|hdr|woff2|png|jpg)/.test(html+css))throw Error('Unexpected remote runtime asset');
console.log(`PASS: ${refs.length} entry references and ${assets.length} assets resolve under ${base}`);console.log(`Asset bundle: ${(assets.reduce((sum,f)=>sum+statSync('dist/assets/'+f).size,0)/1024/1024).toFixed(2)} MiB uncompressed`);
