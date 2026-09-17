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
})();
