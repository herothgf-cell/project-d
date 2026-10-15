'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="./src/style.css">','<style>\n'+fs.readFileSync(path.join(root,'src/style.css'),'utf8')+'\n</style>');
html=html.replace(/<script src="\.\/([^\"]+)"><\/script>/g,(_,name)=>'<script>\n'+fs.readFileSync(path.join(root,name),'utf8')+'\n</script>');
fs.mkdirSync(dist,{recursive:true});
fs.writeFileSync(path.join(dist,'index.html'),html);fs.writeFileSync(path.join(dist,'.nojekyll'),'');
console.log(`Built dist/index.html (${Buffer.byteLength(html)} bytes), no runtime dependencies.`);
