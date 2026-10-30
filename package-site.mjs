import fs from 'node:fs';
const files=[];
function add(path,target=path){const binary=/\.(jpg|jpeg|png|webp|glb|hdr)$/i.test(path);files.push({path:target,content:fs.readFileSync(path,binary?'base64':'utf8'),encoding:binary?'base64':'utf-8'});}
for(const name of ['package.json','package-lock.json','tsconfig.json','vite.config.ts','index.html','.gitignore','README.md','AGENTS.md','ASSET-LICENSES.md','package-site.mjs'])add(name);
for(const dir of ['client','shared','server','tests'])for(const name of fs.readdirSync(dir))if(/\.(ts|mjs|css)$/.test(name))add(dir+'/'+name);
function walk(dir,target){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+entry.name,t=target+'/'+entry.name;if(entry.isDirectory())walk(p,t);else add(p,t);}}
walk('public','public');walk('dist','docs');files.push({path:'docs/.nojekyll',content:''});
fs.writeFileSync('site-upload.json',JSON.stringify(files));console.log(files.length+' files prepared; '+Math.round(fs.statSync('site-upload.json').size/1024)+' KiB payload');
