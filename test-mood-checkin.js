/* Daily mood check-in: popup logic + stats chart + rules text. jsdom, fake Firestore, no network. */
const fs=require('fs'),{JSDOM}=require('jsdom');
let p=0,f=0;const ok=(n,c)=>{c?p++:f++;console.log((c?'PASS ':'FAIL ')+n);};
const src=fs.readFileSync(__dirname+'/mood.js','utf8');
function fake(){const store={};const F={
  doc:(db,...a)=>({path:a.join('/')}),getDoc:async r=>({exists:()=>r.path in store,data:()=>store[r.path]}),
  serverTimestamp:()=>'TS',
  runTransaction:async(db,fn)=>{const t={get:async r=>({exists:()=>r.path in store}),
    set:(r,v)=>{if(r.path in store)throw Error('dup');store[r.path]=v;},update:(r,v)=>{store[r.path]=Object.assign({},store[r.path],v);}};await fn(t);}};
  return {store,F};}
function page(uid,fs_,shared){const d=new JSDOM('<body></body>',{url:'https://maatram.co.in/',runScripts:'outside-only'});
  if(shared){Object.defineProperty(d.window,'localStorage',{value:shared});}
  d.window.eval(src);return d.window;}
(async()=>{
  const {store,F}=fake(),W=page(),day=W.maatramMood.today();
  ok('first visit shows popup',(await W.maatramMood.start('u1',{},F),!!W.document.getElementById('moodBox')));
  ok('title text',/How are you feeling today\?/.test(W.document.body.textContent));
  ok('6 moods',W.document.querySelectorAll('.mood-c').length===6);
  ok('save disabled until chosen',W.document.getElementById('moodSave').disabled);
  W.document.querySelector('[data-k=happy]').click();W.document.getElementById('moodSave').click();
  await new Promise(r=>setTimeout(r,50));
  const k='users/u1/moods/'+day;
  ok('record stored with id=date',store[k]&&store[k].mood==='happy'&&store[k].date===day&&store[k].uid==='u1'&&store[k].timestamp==='TS');
  // revisit: same localStorage
  const W2=page();W2.localStorage.setItem('maatram_mood_u1',day);await W2.maatramMood.start('u1',{},F);
  ok('local done flag suppresses popup',!W2.document.getElementById('moodBox'));
  // new device, doc exists in Firestore
  const W3=page();await W3.maatramMood.start('u1',{},F);
  ok('existing Firestore record suppresses popup on other device',!W3.document.getElementById('moodBox'));
  // other user
  const W4=page();await W4.maatramMood.start('u2',{},F);
  ok('different user gets own popup',!!W4.document.getElementById('moodBox'));
  // skip
  W4.document.getElementById('moodSkip').click();
  ok('skip closes popup, writes nothing',!W4.document.getElementById('moodBox')&&!('users/u2/moods/'+day in store));
  const W4b=page();await W4b.maatramMood.start('u2',{},F);
  ok('skipped: popup returns on next open, same day',!!W4b.document.getElementById('moodBox'));
  // edit today's mood: update path, one doc
  const W5=page();W5.maatramMood.start('u1',{},F);await new Promise(r=>setTimeout(r,20));W5.maatramMood.openEdit('happy');
  W5.document.querySelector('[data-k=tired]').click();W5.document.getElementById('moodSave').click();await new Promise(r=>setTimeout(r,50));
  ok('correcting mood updates same doc + updatedAt',store[k].mood==='tired'&&store[k].updatedAt==='TS'&&Object.keys(store).filter(x=>x.startsWith('users/u1/moods')).length===1);
  // new day
  const W6=page();W6.localStorage.setItem('maatram_mood_u1','2000-01-01');await W6.maatramMood.start('u1',{},{...F,getDoc:async()=>({exists:()=>false})});
  ok('new day allows new check-in',!!W6.document.getElementById('moodBox'));
  // read failure never nags
  const W7=page();await W7.maatramMood.start('u3',{},{...F,getDoc:async()=>{throw Error('x');}});
  ok('unverifiable day does not show popup',!W7.document.getElementById('moodBox'));
  // rules + wiring
  const r=fs.readFileSync(__dirname+'/firestore.rules','utf8');
  ok('rules: moods owner-only read',/match \/users\/\{uid\}\/moods\/\{day\}[\s\S]*?allow read, delete: if isOwner\(uid\)/.test(r));
  ok('rules: key allowlist + mood enum + id==date',/hasOnly\(\['uid','mood','date','timestamp'\]\)/.test(r)&&/neu\(\)\.date == day/.test(r)&&/'tired'\]/.test(r));
  ok('gate.js loads mood.js',/mood\.js/.test(fs.readFileSync(__dirname+'/gate.js','utf8')));
  const s=fs.readFileSync(__dirname+'/stats.html','utf8');
  ok('stats: section, empty copy, disclaimer, 30d tab',/Your Mood Journey/.test(s)&&/Your mood journey starts here\. Check in daily to see your history\./.test(s)&&/not a clinical or scientific/.test(s)&&/data-d="30"/.test(s));
  // chart render with gaps
  const dom=new JSDOM(s.replace(/<script src="gate.js"><\/script>/,'').replace(/<script defer[^>]*><\/script>/g,''),{url:'https://maatram.co.in/stats.html',runScripts:'outside-only'});
  const w=dom.window;w.eval(src);w.eval(s.match(/<script>\s*\(function\(\)\{\s*var days=7[\s\S]*?<\/script>/)[0].replace(/<\/?script>/g,'').replace(/\(async function\(\)\{\s*if\(!\/\^https[\s\S]*?\}\)\(\);\s*\}\)\(\);\s*$/,'})();'));
  const ds=w.maatramMood.today(new Date(Date.now()-864e5*2));
  w.dispatchEvent(new w.CustomEvent('maatram:mood',{detail:{date:w.maatramMood.today(),mood:'sad'}}));
  w.dispatchEvent(new w.CustomEvent('maatram:mood',{detail:{date:ds,mood:'veryhappy'}}));
  await new Promise(r=>setTimeout(r,30));
  console.log(w.document.getElementById('mjBody').innerHTML.slice(0,300));
  const c=w.document.querySelectorAll('#mjSvg circle');
  ok('chart: only real check-ins plotted (2 points), gap not filled',c.length===2&&!w.document.querySelector('#mjSvg polyline'));
  ok('summary: 2 check-ins',/2<\/b> check-ins/.test(w.document.getElementById('mjBody').innerHTML));
  console.log(`\n${p} passed, ${f} failed`);process.exit(f?1:0);
})();
