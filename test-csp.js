/* Static CSP audit: every external URL the shipped pages can reach, checked
   against the policy in vercel.json. No network needed, nothing missed. */
const fs=require('fs');
const csp=JSON.parse(fs.readFileSync('vercel.json','utf8'))
  .headers[0].headers.find(h=>h.key==='Content-Security-Policy').value;
const dir={}; csp.split(';').map(s=>s.trim()).filter(Boolean).forEach(s=>{
  const [k,...v]=s.split(/\s+/); dir[k]=v;
});
const allow=(d,url)=>{
  const u=new URL(url), list=dir[d]||dir['default-src']||[];
  return list.some(src=>{
    if(src==="'self'") return false;
    if(src==='https:'||src==='data:'||src==='blob:') return u.protocol===src;
    try{ const s=new URL(src);
      return s.protocol===u.protocol && s.hostname===u.hostname &&
             (!s.port || s.port===u.port);
    }catch(_){ return false; }
  });
};
const files=fs.readdirSync('.').filter(f=>/\.(html|js)$/.test(f)&&!f.startsWith('test-')&&!f.startsWith('_')&&!f.endsWith('.src.js'))
  .concat(['wellness/wellness.html','wellness/wellness.js'].filter(f=>fs.existsSync(f)));
const pat=[
  [/<script[^>]+src="(https?:\/\/[^"]+)"/g,'script-src'],
  [/import\(\s*['"](https?:\/\/[^'"]+)['"]/g,'script-src'],
  [/import\s+[^'"]*['"](https:\/\/[^'"]+)['"]/g,'script-src'],
  [/<link[^>]+href="(https?:\/\/fonts\.googleapis\.com[^"]*)"/g,'style-src'],
  [/<img[^>]+src="(https?:\/\/[^"]+)"/g,'img-src'],
  [/fetch\(\s*['"](https?:\/\/[^'"]+)['"]/g,'connect-src'],
  [/mqtt\.connect\(\s*['"](wss?:\/\/[^'"]+)['"]/g,'connect-src'],
  [/['"](wss:\/\/[^'"]+)['"]/g,'connect-src'],
];
let bad=0,seen=new Set();
for(const f of files){ const src=fs.readFileSync(f,'utf8');
  for(const [re,d] of pat){ let m; re.lastIndex=0;
    while((m=re.exec(src))){ const url=m[1]; const key=d+' '+url;
      if(seen.has(key)) continue; seen.add(key);
      if(!allow(d,url)){ bad++; console.log('BLOCKED  ['+d+']  '+url+'   ('+f+')'); }
      else console.log('ok       ['+d+']  '+new URL(url).origin); } } }
/* Firebase SDK endpoints reached internally, not visible in source */
for(const u of ['https://firestore.googleapis.com/x','https://identitytoolkit.googleapis.com/x',
  'https://securetoken.googleapis.com/x','https://firebaseinstallations.googleapis.com/x'])
  if(!allow('connect-src',u)){ bad++; console.log('BLOCKED  [connect-src]  '+u); }
if(!allow('frame-src','https://maatram-859f4.firebaseapp.com/')){ bad++; console.log('BLOCKED  [frame-src] firebase auth handler'); }
if(!allow('frame-src','https://accounts.google.com/')){ bad++; console.log('BLOCKED  [frame-src] accounts.google.com'); }
console.log('\n'+seen.size+' distinct external requests checked, '+bad+' blocked by the policy');
