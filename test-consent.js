/* Maatram · Terms + Privacy consent checks — node test-consent.js  (needs: npm i jsdom) */
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
let pass=0,fail=0;const ok=(n,c)=>{c?(pass++,console.log('  ok   '+n)):(fail++,console.log('  FAIL '+n));};
const src=fs.readFileSync(path.join(__dirname,'consent.js'),'utf8');
function env(docData){
  const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{runScripts:'outside-only',url:'https://maatram.co.in/'});
  const w=dom.window; w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  w.eval(src); const writes=[];
  const F={doc:(db,c,id)=>c+'/'+id,getDoc:async()=>({exists:()=>!!docData,data:()=>docData||{}}),
    setDoc:async(ref,v,o)=>{writes.push(v);},serverTimestamp:()=>'TS'};
  return {w,F,writes};
}
const tick=()=>new Promise(r=>setTimeout(r,0));
(async()=>{
  { const {w,F,writes}=env({name:'A'}); const p=w.maatramConsent('u1',null,F); await tick();await tick();
    const d=w.document.getElementById('mterms'); ok('new account: consent dialog shown',!!d);
    ok('terms + privacy links present',!!d.querySelector('a[href="/terms.html"]')&&!!d.querySelector('a[href="/privacy.html"]'));
    const btn=d.querySelector('#mtermsOk'); ok('accept disabled until ticked',btn.disabled);
    btn.disabled=false;btn.click();await tick(); ok('click without tick does nothing',!!w.document.getElementById('mterms'));
    const box=d.querySelector('#mtermsBox'); box.checked=true; box.dispatchEvent(new w.Event('change'));
    ok('tick enables accept',!d.querySelector('#mtermsOk').disabled);
    d.querySelector('#mtermsOk').click(); await tick();await tick(); const fo=w.document.getElementById('mfollow'); ok('follow popup comes after terms',!!fo&&/doom scroll/i.test(fo.textContent)&&!!fo.querySelector('a[href*="instagram.com"]')); fo.querySelector('#mfollowOk').click(); ok('resolves true',await p===true);
    ok('dialog removed',!w.document.getElementById('mterms'));
    ok('saved to Firestore',writes.length===1&&writes[0].termsV==='2026-10'&&writes[0].termsAt==='TS');
    ok('cached on device',w.localStorage.getItem('maatram_terms_u1')==='2026-10');
    ok('second call skips both dialogs',await w.maatramConsent('u1',null,F)===true&&!w.document.getElementById('mterms')); }
  { const {w,F,writes}=env({termsV:'2026-10'}); w.localStorage.setItem('maatram_follow_u2','1'); ok('already accepted on account: no dialog',await w.maatramConsent('u2',null,F)===true&&!w.document.getElementById('mterms')&&!writes.length); }
  { const {w,F,writes}=env(null); const p=w.maatramConsent('u3',null,F); await tick();await tick();
    const d=w.document.getElementById('mterms'); const ev=new w.Event('cancel',{cancelable:true}); d.dispatchEvent(ev);
    ok('Esc cannot skip',ev.defaultPrevented&&!!w.document.getElementById('mterms'));
    d.querySelector('#mtermsNo').click(); ok('decline resolves false',await p===false); ok('decline saves nothing',!writes.length&&!w.localStorage.getItem('maatram_terms_u3')); }
  { const {w,F}=env({termsV:'2025-01'}); const p=w.maatramConsent('u4',null,F); await tick();await tick();
    ok('dialogs are centred (shared .mdlg rule)',/\.mdlg\{position:fixed;inset:0;margin:auto/.test(src)); ok('older version re-asks',!!w.document.getElementById('mterms')); w.document.getElementById('mtermsNo').click(); await p; }
  const L=fs.readFileSync(path.join(__dirname,'login.html'),'utf8'),G=fs.readFileSync(path.join(__dirname,'gate.js'),'utf8'),R=fs.readFileSync(path.join(__dirname,'firestore.rules'),'utf8');
  ok('login.html loads consent.js',/src="\/consent\.js"/.test(L)); ok('login signs out on decline',/maatramConsent\([^)]*\)\)\{ await signOut\(auth\)/.test(L));
  ok('gate.js asks on gated pages',/maatramConsent\(user\.uid,db,F\)/.test(G));
  ok('rules allow termsV + termsAt',/'termsV','termsAt'/.test(R)&&/termsOk\(neu\(\)\.keys\(\)\)/.test(R)&&/termsOk\(changed\(\)\)/.test(R));
  console.log('\n'+pass+' passed, '+fail+' failed');process.exit(fail?1:0);
})();
