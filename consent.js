/* ══ Maatram · Terms + Privacy consent ══
   Shown once per account, right after sign-in. Nothing opens until the box is ticked.
   Used by login.html and gate.js:  await maatramConsent(uid, db, F)  ->  true | false
   F = the firebase-firestore module. Accepting writes termsV + termsAt to users/{uid}
   (see firestore.rules) and caches it on this device.
   Bump TERMS_V when terms.html or privacy.html change materially: everyone re-accepts once. */
(function(){
  var TERMS_V='2026-10';

  function key(uid){ return 'maatram_terms_'+uid; }
  function local(uid){ try{ return localStorage.getItem(key(uid))===TERMS_V; }catch(e){ return false; } }
  function remember(uid){ try{ localStorage.setItem(key(uid),TERMS_V); }catch(e){} }

  var CSS='.mdlg{position:fixed;inset:0;margin:auto;height:fit-content;max-height:calc(100dvh - 32px);overflow:auto;max-width:min(440px,calc(100vw - 32px));width:100%;padding:0;border:1px solid rgba(47,227,143,.35);'
    +'border-radius:20px;background:#0d1417;color:#e6f0ed;font:400 15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;'
    +'box-shadow:0 24px 64px rgba(0,0,0,.6)}'
    +'dialog.mdlg::backdrop{background:rgba(4,7,8,.82);backdrop-filter:blur(6px)}'
    +'.mdlg .in{padding:24px 22px 20px}'
    +'.mdlg h2{margin:0 0 8px;font-size:21px;line-height:1.25;font-weight:700;color:#fff}'
    +'.mdlg p{margin:0 0 16px;color:#a9bcb8}'
    +'.mdlg .docs{display:grid;gap:8px;margin:0 0 18px}'
    +'.mdlg .docs a{display:flex;align-items:center;justify-content:space-between;min-height:48px;padding:0 16px;'
    +'border:1px solid rgba(255,255,255,.12);border-radius:12px;color:#e6f0ed;text-decoration:none;font-weight:600}'
    +'.mdlg .docs a:hover{border-color:#2fe38f;color:#2fe38f}'
    +'.mdlg label{display:flex;gap:12px;align-items:flex-start;cursor:pointer;padding:12px;border-radius:12px;'
    +'background:rgba(255,255,255,.04);margin:0 0 18px;color:#e6f0ed}'
    +'.mdlg input{flex:none;width:22px;height:22px;margin:1px 0 0;accent-color:#2fe38f;cursor:pointer}'
    +'.mdlg .act{display:grid;gap:10px}'
    +'.mdlg button{min-height:48px;border-radius:999px;font:inherit;font-weight:700;cursor:pointer;border:0}'
    +'.mdlg .ok{background:linear-gradient(90deg,#2fe38f,#38b6ff);color:#04120f}'
    +'.mdlg .ok:disabled{opacity:.35;cursor:not-allowed}'
    +'.mdlg .no{background:none;color:#8fa3a0;border:1px solid rgba(255,255,255,.12)}'
    +'.mdlg a:focus-visible,.mdlg button:focus-visible,.mdlg input:focus-visible{outline:2px solid #38b6ff;outline-offset:3px}'
    +'.mdlg .nudge{margin:0 0 16px;padding:12px 14px;border-radius:12px;background:rgba(47,227,143,.08);color:#e6f0ed;font-weight:600;text-align:center}'
    /* Minimal Glass skin */
    +'html.minimal .mdlg{background:rgba(20,22,21,.92);border-color:rgba(255,255,255,.13);backdrop-filter:blur(22px)}'
    +'html.minimal .mdlg .ok{background:#ECEFEE;color:#0B0C0B}'
    +'html.minimal .mdlg input{accent-color:#9CC0B2}'
    +'html.minimal .mdlg .docs a:hover{border-color:#9CC0B2;color:#9CC0B2}';

  function ask(){
    return new Promise(function(done){
      if(!document.getElementById('mtermsCSS')){
        var s=document.createElement('style'); s.id='mtermsCSS'; s.textContent=CSS; document.head.appendChild(s);
      }
      var d=document.createElement('dialog'); d.id='mterms'; d.className='mdlg';
      d.setAttribute('aria-labelledby','mtermsH');
      d.innerHTML='<div class="in">'
        +'<h2 id="mtermsH">Before you start</h2>'
        +'<p>Please read Maatram’s Terms of Service and Privacy Policy. You need to accept them to use Maatram.</p>'
        +'<div class="docs">'
        +'<a href="/terms.html" target="_blank" rel="noopener">Terms of Service <span aria-hidden="true">↗</span></a>'
        +'<a href="/privacy.html" target="_blank" rel="noopener">Privacy Policy <span aria-hidden="true">↗</span></a>'
        +'</div>'
        +'<label><input type="checkbox" id="mtermsBox"><span>I have read and agree to the Terms of Service and Privacy Policy.</span></label>'
        +'<div class="act">'
        +'<button type="button" class="ok" id="mtermsOk" disabled>Accept and continue</button>'
        +'<button type="button" class="no" id="mtermsNo">Decline and sign out</button>'
        +'</div></div>';
      document.body.appendChild(d);
      var box=d.querySelector('#mtermsBox'), ok=d.querySelector('#mtermsOk');
      box.onchange=function(){ ok.disabled=!box.checked; };
      function end(v){ d.close(); d.remove(); done(v); }
      ok.onclick=function(){ if(box.checked) end(true); };
      d.querySelector('#mtermsNo').onclick=function(){ end(false); };
      d.addEventListener('cancel',function(e){ e.preventDefault(); });   /* Esc does not skip it */
      if(d.showModal) d.showModal(); else d.setAttribute('open','');
      box.focus();
    });
  }


  /* "Follow us" popup: shown once per account per device, right after the terms step. */
  function fkey(uid){ return 'maatram_follow_'+uid; }
  function followSeen(uid){ try{ return !!localStorage.getItem(fkey(uid)); }catch(e){ return false; } }
  function followMark(uid){ try{ localStorage.setItem(fkey(uid),'1'); }catch(e){} }
  var SOC=[['Instagram','https://www.instagram.com/maatram_official97/'],['X','https://x.com/maatram_97'],
    ['Reddit','https://www.reddit.com/user/Maatram97/'],['LinkedIn','https://www.linkedin.com/in/maatram-exe-10b295423/']];
  function follow(){
    return new Promise(function(done){
      if(!document.getElementById('mtermsCSS')){
        var s=document.createElement('style'); s.id='mtermsCSS'; s.textContent=CSS; document.head.appendChild(s);
      }
      var d=document.createElement('dialog'); d.id='mfollow'; d.className='mdlg';
      d.setAttribute('aria-labelledby','mfollowH');
      d.innerHTML='<div class="in"><h2 id="mfollowH">Follow Maatram</h2>'
        +'<p>New features and focus tips land on our pages first. Follow us:</p><div class="docs">'
        +SOC.map(function(x){ return '<a href="'+x[1]+'" target="_blank" rel="noopener">'+x[0]+' <span aria-hidden="true">↗</span></a>'; }).join('')
        +'<a href="/socials.html" target="_blank" rel="noopener">All our links <span aria-hidden="true">↗</span></a></div>'
        +'<p class="nudge">Follow, then put your phone down. Don’t doom scroll.</p>'
        +'<div class="act"><button type="button" class="ok" id="mfollowOk">Continue</button></div></div>';
      document.body.appendChild(d);
      function end(){ try{ d.close(); }catch(e){} d.remove(); done(); }
      d.querySelector('#mfollowOk').onclick=end;
      d.addEventListener('cancel',function(e){ e.preventDefault(); end(); });
      if(d.showModal) d.showModal(); else d.setAttribute('open','');
      d.querySelector('#mfollowOk').focus();
    });
  }
  async function tail(uid){
    if(!followSeen(uid)){ followMark(uid); await follow(); }
    return true;
  }

  window.maatramConsent=async function(uid,db,F){
    if(local(uid)) return tail(uid);
    var ref=F.doc(db,'users',uid);
    try{ var snap=await F.getDoc(ref); if(snap.exists() && snap.data().termsV===TERMS_V){ remember(uid); return tail(uid); } }
    catch(e){}
    if(!await ask()) return false;
    remember(uid);
    /* ponytail: if the new firestore.rules are not published yet this write is refused;
       the device cache still holds the acceptance, so nobody is trapped. */
    try{ await F.setDoc(ref,{termsV:TERMS_V,termsAt:F.serverTimestamp()},{merge:true}); }
    catch(e){ console.warn('terms save',e); }
    return tail(uid);
  };
})();
