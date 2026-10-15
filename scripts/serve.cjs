'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const args=Object.fromEntries(process.argv.slice(2).filter(x=>x.startsWith('--')).map(x=>x.slice(2).split('=')));
const host=args.host||'127.0.0.1',port=Number(args.port||process.env.PORT||5173);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Port must be 1–65535');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 try{
  let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(url.startsWith('/project-d/'))url=url.slice('/project-d'.length);
  if(url.endsWith('/'))url+='index.html';
  if(url.split('/').some(p=>p.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}
  const file=path.resolve(root,'.'+url),type=types[path.extname(file)];
  if(!file.startsWith(root+path.sep)||!type){res.writeHead(404);res.end('Not found');return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);});
 }catch{res.writeHead(400);res.end('Bad request');}
}).listen(port,host,()=>console.log(`Body Share: http://${host}:${port}\nUse --host=0.0.0.0 only to test on your trusted local network.`)).on('error',e=>{console.error(e.message);process.exitCode=1;});
