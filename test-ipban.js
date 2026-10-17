/* IP blocklist: exact IPs, IPv4 ranges, safe defaults, and that every API handler calls the guard. */
const fs=require('fs'); let pass=0,fail=0;
const ok=(n,c)=>{ c?pass++:fail++; console.log((c?'PASS ':'FAIL ')+n); };
const { isBlocked, clientIp, banned } = require('./api/_guard');

ok('empty list blocks nobody',            !isBlocked('1.2.3.4',''));
ok('exact IP blocked',                    isBlocked('203.0.113.7','203.0.113.7'));
ok('other IP not blocked',                !isBlocked('203.0.113.8','203.0.113.7'));
ok('list with spaces parsed',             isBlocked('9.9.9.9',' 1.1.1.1 , 9.9.9.9 '));
ok('/24 range blocks inside',             isBlocked('198.51.100.200','198.51.100.0/24'));
ok('/24 range spares outside',            !isBlocked('198.51.101.1','198.51.100.0/24'));
ok('/32 acts as exact',                   isBlocked('5.5.5.5','5.5.5.5/32') && !isBlocked('5.5.5.6','5.5.5.5/32'));
ok('/0 refused (cannot ban the world)',   !isBlocked('8.8.8.8','0.0.0.0/0'));
ok('/4 refused',                          !isBlocked('8.8.8.8','8.0.0.0/4'));
ok('garbage rule ignored',                !isBlocked('8.8.8.8','nonsense,300.1.1.1,1.2.3/24'));
ok('IPv6 exact match works',              isBlocked('2001:db8::1','2001:db8::1'));
ok('anon is never matched by a range',    !isBlocked('anon','198.51.100.0/24'));
ok('client ip = first x-forwarded-for',   clientIp({headers:{'x-forwarded-for':' 7.7.7.7, 10.0.0.1'}})==='7.7.7.7');
ok('missing header -> anon',              clientIp({headers:{}})==='anon');

process.env.BLOCKED_IPS='6.6.6.6';
const mk=()=>{ const r={code:0,h:{},body:null,setHeader(k,v){r.h[k]=v},status(c){r.code=c;return r},json(b){r.body=b;return r}}; return r; };
let res=mk(); ok('banned() answers 403 for listed IP', banned({headers:{'x-forwarded-for':'6.6.6.6'}},res)===true && res.code===403 && res.body.error==='blocked');
res=mk();      ok('banned() lets others through',     banned({headers:{'x-forwarded-for':'6.6.6.7'}},res)===false && res.code===0);

for(const f of ['api/focuz.js','api/link.js','api/ratings.js']){
  const s=fs.readFileSync(f,'utf8');
  ok(f+' requires the guard',             /require\('\.\/_guard'\)/.test(s));
  ok(f+' calls banned() in the handler',  /if \(banned\(req, res\)\) return;/.test(s));
}
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
