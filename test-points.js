/* test-points.js [page.html] — points queue + pacing against a model of firestore.rules (default timers.html) */
const fs=require('fs');
let NOW=1_800_000_000_000; const timers=[];
const store={}; const localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>store[k]=String(v)};
let docState={points:0}; let writes=0, denied=0;
const TS={__ts:true};
const ts=ms=>({toMillis:()=>ms,ms});
// model of firestore.rules paced() for the normal-play branch
function rules(old,neu){
  const g=neu.points-(old.points||0);
  if(neu.points<0||neu.points>3000) return false;
  if(neu.points<(old.points||0)-100||neu.points>(old.points||0)+100) return false;
  if(g<=0) return neu.awardAt===old.awardAt;
  if(!neu.awardAt||neu.awardAt.ms!==NOW) return false;
  const last=old.awardAt?old.awardAt.ms:0;
  return g*6 <= Math.floor((NOW-last)/1000);
}
const db={}, doc=()=>'ref';
async function runTransaction(_,fn){
  let pending=null;
  const t={get:async()=>({exists:()=>true,data:()=>({...docState})}),set:(r,v)=>{pending=v}};
  const res=await fn(t);
  if(pending){ const neu={...docState,...pending}; if(neu.awardAt===TS) neu.awardAt=ts(NOW);
    if(!rules(docState,neu)){denied++; const e=new Error('permission-denied'); throw e;}
    docState=neu; writes++; }
  return res;
}
global.localStorage=localStorage; global.navigator={}; global.BroadcastChannel=class{postMessage(){}};
global.parent={postMessage(){}}; Date.now=()=>NOW;
global.setTimeout=(f,ms)=>{timers.push({at:NOW+ms,f});return timers.length}; global.clearTimeout=()=>{};
const mtToast=()=>{};
const path=require('path');
const page=process.argv[2]||'timers.html', src=fs.readFileSync(path.join(__dirname,page),'utf8');
const code=src.slice(src.indexOf('    let __mtUser=null;'),src.indexOf('    function mtToast')).replace(/await import\('https:\/\/www\.gstatic[^']*'\)/,'({serverTimestamp:()=>TS})');
const api=new Function('db','doc','runTransaction','TS','mtToast','localStorage','navigator','setTimeout','clearTimeout',
  code+'\nreturn {setUser:u=>{__mtUser=u}, flush:async()=>{await mtFlush(); await mtFlush.q;}, award:async(p)=>{await window.maatramAward(p); await mtFlush.q; await mtFlush.q;}};');
global.window=global;
const A=api(db,doc,runTransaction,TS,mtToast,localStorage,navigator,setTimeout,clearTimeout);
async function tick(sec){ NOW+=sec*1000; const due=timers.filter(t=>t.at<=NOW); timers.splice(0,timers.length,...timers.filter(t=>t.at>NOW)); for(const t of due) await t.f(); await new Promise(r=>setImmediate(r)); }
const ok=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n); if(!c) process.exitCode=1;};
(async()=>{
  A.setUser({uid:'u1'});
  await A.award(25);            ok('first gain written (no prior awardAt)', docState.points===25 && docState.awardAt.ms===NOW);
  await A.award(100);           ok('+100 right after is held, not denied', docState.points===25 && denied===0 && localStorage.getItem('maatram_pend_u1')==='100');
  await A.award(-10);           ok('penalty nets against the held gain', docState.points===25 && localStorage.getItem('maatram_pend_u1')==='90');
  // pending now +90 net; wait until affordable
  for(let i=0;i<12;i++) await tick(60);
  ok('held gain lands once paced (~9-10 min)', docState.points===115 && localStorage.getItem('maatram_pend_u1')==='0' && denied===0);
  // cheat model: direct write +100 with fresh stamp 1 s after a gain
  NOW+=1000; let blocked=false; try{ await runTransaction(db,async t=>{t.set('r',{points:docState.points+100,awardAt:TS})}); }catch(e){blocked=true}
  ok('rules model blocks unpaced direct write', blocked);
  // ceiling
  docState={points:2990,awardAt:ts(NOW-3600e3)}; localStorage.setItem('maatram_pend_u1','0');
  await A.award(100); await tick(2); ok('ceiling: only +10 written, rest dropped', docState.points===3000 && localStorage.getItem('maatram_pend_u1')==='0');
  // reload: pending survives in localStorage
  docState={points:50,awardAt:ts(NOW)}; localStorage.setItem('maatram_pend_u1','25');
  const B=api(db,doc,runTransaction,TS,mtToast,localStorage,navigator,setTimeout,clearTimeout); B.setUser({uid:'u1'});
  await B.flush(); for(let i=0;i<4;i++) await tick(60);
  ok('pending gain from an earlier tab is flushed after reload', docState.points===75);
  console.log('writes',writes,'denied',denied);
  monthAndBonus();
})();

/* ── model of the whole users/{uid} update rule (firestore.rules), for the monthly cycle ── */
function monthAndBonus(){
  const R=fs.readFileSync(path.join(__dirname,'firestore.rules'),'utf8');
  ok('rules text: normal play forbids cycle + lifetime', /!touched\(\['lifetime', 'cycle'\]\)/.test(R));
  ok('rules text: first-ever roll touches only cycle/lifetime', /changed\(\)\.hasOnly\(\['cycle', 'lifetime'\]\)/.test(R));
  const KEYS=['name','photo','points','lifetime','lastLogin','cycle','awardAt'];
  const cyc=v=>typeof v==='string'&&/^[0-9]{4}-[0-9]{2}$/.test(v);
  const get=(o,k,d)=>k in o?o[k]:d;
  function update(old,patch){                              // patch applied with merge, like updateDoc / set(merge)
    const neu={...old,...patch}, ch=Object.keys(neu).filter(k=>JSON.stringify(neu[k])!==JSON.stringify(old[k]));
    const only=l=>ch.every(k=>l.includes(k)), touched=l=>ch.some(k=>l.includes(k));
    if(!Number.isInteger(neu.points)||neu.points<0||neu.points>3000) return false;
    const op=get(old,'points',0), oc=get(old,'cycle',''), m='m_'+get(old,'cycle','x');
    const normal=only(KEYS)&&!touched(['lifetime','cycle'])&&neu.points>=op-100&&neu.points<=op+100
                 &&(neu.points-op<=0?!touched(['awardAt']):true);           // pacing covered above
    const roll=only(KEYS.concat([m]))&&oc!==''&&cyc(neu.cycle)&&neu.points===0&&neu.cycle!==oc
               &&neu.lifetime===get(old,'lifetime',0)+op&&Number.isInteger(get(neu,m,-1))&&get(neu,m,-1)===op&&!touched(['awardAt']);
    const first=only(['cycle','lifetime'])&&oc===''&&cyc(neu.cycle)&&get(neu,'lifetime',0)===get(old,'lifetime',0);
    return normal||roll||first;
  }
  /* gate.js roll(), lifted out of the shipped file */
  const G=fs.readFileSync(path.join(__dirname,'gate.js'),'utf8');
  const body=G.match(/async function roll\(F,db,uid,d\)\{([\s\S]*?)\n  \}/)[1];
  const patchOf=(d,now)=>{ let p=null; const F={doc:()=>0,updateDoc:(r,x)=>{p=x;}};
    new Function('F','db','uid','d','cycleId','return (async()=>{'+body+'})()')(F,0,'u',d,()=>now); return p; };
  const u0={name:'A',photo:'',points:120};
  const p1=patchOf(u0,'2026-09');
  ok('gate first-ever roll is allowed by the rules', update(u0,p1));
  ok('first-ever roll leaves points and adds nothing to all time',
     (p1.lifetime||0)+(u0.points)===120 && !('points' in p1));
  ok('first-ever roll that copies points into lifetime is denied', !update(u0,{cycle:'2026-09',lifetime:120}));
  const u1={...u0,...p1};
  const p2=patchOf(u1,'2026-10');
  ok('gate monthly roll is allowed by the rules', update(u1,p2));
  const u2={...u1,...p2};
  ok('monthly roll archives, zeroes, and keeps all time', u2.points===0 && u2['m_2026-09']===120 && u2.lifetime===120);
  ok('roll with a wrong archived value is denied', !update(u1,{...p2,'m_2026-09':999}));
  ok('normal play cannot change cycle (skipping the reset)', !update(u1,{cycle:'2026-10'}));
  ok('normal play cannot blank cycle (reopening first-ever roll)', !update(u1,{cycle:''}));
  ok('roll to a junk cycle is denied', !update(u1,{cycle:'',points:0,lifetime:120,'m_2026-09':120}));
  ok('normal play cannot touch lifetime', !update(u1,{lifetime:5000}));
  ok('profile write (login.html) still allowed', update(u2,{name:'A',photo:'',points:0,lastLogin:'ts'}));
  ok('penalty write still allowed', update({...u2,points:50},{points:40}));

  /* ── weekly bonus (stats.html): ISO week id, claimed only once the account is known ── */
  const S=fs.readFileSync(path.join(__dirname,'stats.html'),'utf8');
  const isoWeek=new Function(S.match(/function isoWeek\(dt\)\{[\s\S]*?\n\}/)[0]+'; return isoWeek;')();
  ok('isoWeek: 2026-09-28 (Mon) is 2026-W40', isoWeek(new Date(2026,8,28))==='2026-W40');
  ok('isoWeek: 2026-10-04 (Sun) is still 2026-W40', isoWeek(new Date(2026,9,4))==='2026-W40');
  ok('isoWeek: 2021-01-01 belongs to 2020-W53', isoWeek(new Date(2021,0,1))==='2020-W53');
  ok('isoWeek: 2024-12-30 belongs to 2025-W01', isoWeek(new Date(2024,11,30))==='2025-W01');
  const wb=S.match(/let bonusUid=null[\s\S]*?\naddEventListener\('maatram:user'[^\n]*/)[0];
  const day=(o)=>{const d=new Date(RealNow-o*864e5);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const RealNow=new Date(2026,9,1,12).getTime();          // Thursday
  const data={}; const dow=(new Date(RealNow).getDay()+6)%7;
  for(let i=dow+1;i<=dow+7;i++) data[day(i)]={instagram:30};   // last week: 30 min/day
  for(let i=dow+8;i<=dow+14;i++) data[day(i)]={instagram:90};  // the week before: 90 min/day
  const mk=()=>{ const st={}, awards=[]; const L={}; let fire=null;
    const env=new Function('merged','dayKey','isoWeek','store','window','addEventListener','Date',
      wb+'; return {bonus:weeklyBonus,setExt:()=>{extDone=true}};');
    const FakeDate=class extends Date{constructor(...a){a.length?super(...a):super(RealNow)} static now(){return RealNow}};
    const api=env(()=>data,day,isoWeek,{get:k=>st[k]??null,set:(k,v)=>st[k]=v},{maatramAward:(p)=>awards.push(p)},
      (n,f)=>{fire=f;},FakeDate);
    return {api,awards,st,user:uid=>fire({detail:uid})}; };
  let w=mk(); w.api.setExt(); w.api.bonus();
  ok('weekly bonus waits while signed out / engine not ready', w.awards.length===0);
  w.user('u1');
  ok('weekly bonus claimed once the account is known', w.awards.length===1 && w.awards[0]===50);
  w.api.bonus(); w.user('u1');
  ok('weekly bonus not claimable twice in the same week', w.awards.length===1 && w.st['maatram_weekly_claim_u1']==='2026-W39');
  w=mk(); w.user('u1'); ok('weekly bonus waits for the laptop sync too', w.awards.length===0);
}
