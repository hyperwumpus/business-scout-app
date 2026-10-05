import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.SCOUTER_PORT||4173);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
http.createServer(async(req,res)=>{
 try {
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const data=await fs.readFile(file);
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"});
  res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Scouter is ready at http://127.0.0.1:${port}`));
