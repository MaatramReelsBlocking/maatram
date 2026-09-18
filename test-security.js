/* Exercises the security fixes directly against the shipped source. */
const fs=require('fs'); let pass=0,fail=0;
const ok=(n,c)=>{ c?pass++:fail++; console.log((c?'PASS ':'FAIL ')+n); };
const grab=(file,re)=>{ const m=fs.readFileSync(file,'utf8').match(re); if(!m) throw new Error('not found in '+file+': '+re); return m[0]; };

/* 1. auth-bridge: token destination allowlist */
{ const src=grab('auth-bridge.html',/const ALLOWED_RT[\s\S]*?return \(typeof v[\s\S]*?\}/);
  const safeRT=new Function(src+'; return safeRT;')();
  ok('rt: normal deep link kept',            safeRT('maatram://auth')==='maatram://auth');
  ok('rt: https attacker URL rejected',      safeRT('https://evil.tld/c')==='maatram://auth');
  ok('rt: protocol-relative rejected',       safeRT('//evil.tld')==='maatram://auth');
  ok('rt: javascript: rejected',             safeRT('javascript:fetch(1)')==='maatram://auth');
  ok('rt: scheme confusion rejected',        safeRT('maatram:https://evil.tld')==='maatram://auth');
  ok('rt: non-string rejected',              safeRT(null)==='maatram://auth');
}
/* 2. study-room: MQTT payload sanitising + escaping */
{ const s=fs.readFileSync('study-room.html','utf8');
  const clean=new Function(grab('study-room.html',/function clean\(v,max\)\{.*/)+'; return clean;')();
  const escHtml=new Function(grab('study-room.html',/function escHtml\(s\)\{.*/)+'; return escHtml;')();
  const payload='<img src=x onerror=alert(1)>';
  ok('avatar escaped at render',             /<span class="avatar">\$\{escHtml\(p\.avatar\)\}/.test(s));
  ok('peer id escaped in attribute',         /id="stime_\$\{escHtml\(p\.id\)\}"/.test(s));
  ok('escHtml neutralises injected markup',  !/[<>]/.test(escHtml(payload)));
  ok('escHtml survives a non-string',        escHtml(undefined)==='' && escHtml({a:1}).length>0);
  ok('clean strips control characters',      clean('a'+String.fromCharCode(0)+'b'+String.fromCharCode(31)+'c',50)==='abc');
  ok('clean caps length',                    clean('x'.repeat(500),24).length===24);
  const cleanCode=new Function(grab('study-room.html',/const cleanCode=c=>[\s\S]*?;/)+' return cleanCode;')();
  ok('mqtt wildcard # stripped from topic',  cleanCode('#')==='');
  ok('mqtt wildcard + stripped from topic',  cleanCode('AB+CD')==='ABCD');
  ok('topic path traversal stripped',        cleanCode('../../other')==='OTHER');
  const wc=require('crypto').webcrypto;
  const randCode=new Function('crypto',grab('study-room.html',/function randCode\(\)\{[\s\S]*?return o\}/)+' return randCode;')(wc);
  const codes=new Set(Array.from({length:500},randCode));
  ok('room code is 8 chars',                 randCode().length===8);
  ok('room code has no collisions in 500',   codes.size===500);
  ok('room code survives its own filter',    cleanCode(randCode()).length===8);
}
/* 3. sports: URL scheme guard */
{ const src=grab('sports.html',/const safeUrl=u=>\{[\s\S]*?\};/);
  const safeUrl=new Function('location',src+' return safeUrl;')({origin:'https://maatram.co.in'});
  ok('url: https listing link kept',         safeUrl('https://ok.example/e')==='https://ok.example/e');
  ok('url: javascript: defused',             safeUrl('javascript:alert(1)')==='#');
  ok('url: mixed-case javascript: defused',  safeUrl('JaVaScRiPt:alert(1)')==='#');
  ok('url: data: defused',                   safeUrl('data:text/html,<script>')==='#');
  ok('url: garbage defused',                 safeUrl({})==='#');
}
/* 4. rules: the personal-data allowlist */
{ const r=fs.readFileSync('firestore.rules','utf8');
  ok('no admin write path on user docs',     !/allow update: if isAdmin\(\)/.test(r));
  ok('admin_log collection gone',            !/admin_log/.test(r));
  ok('email is not a writable key',          !/'email'/.test(r));
  ok('writable keys are an allowlist',       /writableKeys\(\)\s*\{\s*return \['name','photo','points','lifetime','lastLogin','cycle','awardAt'\]/.test(r));
  ok('every update path is key-capped',      (r.match(/changed\(\)\.hasOnly/g)||[]).length===3);
  ok('create is key-capped',                 /neu\(\)\.keys\(\)\.hasOnly\(writableKeys\(\)\)/.test(r));
  ok('account delete is console-only',       /allow delete: if false;/.test(r));
  ok('catch-all denies everything else',     /match \/\{document=\*\*\}[\s\S]*?allow read, write: if false;/.test(r));
  ok('event url must be http(s)',            /url\.matches\('\^https\?:\/\/\.\*'\)/.test(r));
  ok('points pacing still enforced',         /gain\(\) \* 6 <=/.test(r));
}
/* 5. deployment surface */
{ const ig=fs.readFileSync('.vercelignore','utf8');
  ['firestore.rules','*.src.js','test-*.js','preflight.py','*.md','docs/','.github/']
    .forEach(p=>ok('not deployed: '+p, ig.includes(p)));
  ok('admin console deleted',                !fs.existsSync('admin.html'));
  ok('dead roles page deleted',              !fs.existsSync('roles.html'));
  const sm=fs.readFileSync('sitemap.xml','utf8');
  ok('nothing ignored is in the sitemap',    !/admin\.html|roles\.html|\.src\.js|firestore\.rules/.test(sm));
}
/* 6. contact form brakes */
{ const s=fs.readFileSync('socials.html','utf8');
  ok('contact form has a cooldown',          /maatram_fb_last/.test(s) && /GAP=60000/.test(s));
  ok('contact form has a honeypot',          /_honey/.test(s));
  ok('contact form caps message length',     /msg\.length>4000/.test(s));
}
/* 7. headers */
{ const h=JSON.parse(fs.readFileSync('vercel.json','utf8')).headers[0].headers;
  const get=k=>(h.find(x=>x.key===k)||{}).value||'';
  const csp=get('Content-Security-Policy');
  ok('CSP has default-src',                  /default-src 'self'/.test(csp));
  ok('CSP pins script-src',                  /script-src 'self'/.test(csp));
  ok('CSP pins connect-src',                 /connect-src 'self'/.test(csp));
  ok('CSP keeps object-src none',            /object-src 'none'/.test(csp));
  ok('CSP restricts form-action',            /form-action 'self' https:\/\/formsubmit\.co/.test(csp));
  ok('COOP allows the Google popup',         get('Cross-Origin-Opener-Policy')==='same-origin-allow-popups');
  ok('HSTS still preloaded',                 /preload/.test(get('Strict-Transport-Security')));
  ok('X-Robots-Tag unchanged (SEO)',         get('X-Robots-Tag')==='index, follow, max-image-preview:large, max-video-preview:-1');
}
console.log('\n'+pass+' passed, '+fail+' failed   (security fixes)');
process.exit(fail?1:0);
