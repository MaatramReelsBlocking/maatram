/* ══ Maatram · page gate ══
   One line per page:  <script src="gate.js"></script>  (right after theme.js)
   The page always paints straight away. Signed out -> sign-in bar.
   Banned -> page covered. Kicked -> login.html.
   Never add this to login.html or auth-bridge.html (redirect loop). */
(function(){
  var HOSTED = location.protocol==='http:'||location.protocol==='https:';
  if(!HOSTED) return;                       /* opened from a file: leave the page alone */

  var PAGE=(location.pathname.split('/').pop()||'index.html');
  if(PAGE==='login.html'||PAGE==='auth-bridge.html') return;

  /* html.mgate (page hidden, veil shown) is only ever set for a banned account */
  var s=document.createElement('style');
  s.id='maatramGateCSS';
  s.textContent='html.mgate body>*{visibility:hidden!important}'
    +'html.mgate #mgate{visibility:visible!important}'
    +'#mgate{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;'
    +'background:#06090B;color:#8FA3A0;font:600 14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;'
    +'letter-spacing:.04em;text-align:center;padding:24px;white-space:pre-line}'
    +'#mguest{position:fixed;right:12px;bottom:12px;z-index:9998;max-width:calc(100vw - 24px);'
    +'background:#0d1417;color:#cfe0dc;border:1px solid rgba(47,227,143,.4);border-radius:14px;'
    +'padding:10px 14px;font:600 13px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}'
    +'#mguest a{color:#2fe38f;margin-left:6px;display:inline-block;padding:6px 0}'
    +'#mguest button{margin-left:8px;background:none;border:0;color:#8FA3A0;font:700 18px/1 system-ui,sans-serif;'
    +'cursor:pointer;padding:6px 8px;vertical-align:middle}'
    /* phones: sit above the performance button (bottom-left) instead of over it */
    +'@media(max-width:640px){#mguest{left:12px;right:12px;bottom:60px}}';
  (document.head||document.documentElement).appendChild(s);

  function veil(text){
    var v=document.getElementById('mgate');
    if(!v){ v=document.createElement('div'); v.id='mgate'; document.body.appendChild(v); }
    v.textContent=text;
  }
  function reveal(){
    document.documentElement.classList.remove('mgate');
    var v=document.getElementById('mgate'); if(v) v.remove();
  }
  /* signed out: page stays readable (people and search engines), points bank
     locally until they sign in. A small bar offers the sign-in instead of a redirect. */
  function guest(){
    reveal();
    try{ if(sessionStorage.getItem('maatram_guest_x')==='1') return; }catch(e){}
    var b=document.createElement('div'); b.id='mguest'; b.setAttribute('role','region'); b.setAttribute('aria-label','Sign in');
    b.textContent='Browsing as a guest. Sign in to save points and join rooms.';
    var a=document.createElement('a'); a.href='login.html'; a.textContent='Sign in';
    a.onclick=function(){ try{ sessionStorage.setItem('maatram_next',PAGE); }catch(e){} };
    var x=document.createElement('button'); x.type='button'; x.textContent='\u00d7';
    x.setAttribute('aria-label','Dismiss the sign-in bar');
    x.onclick=function(){ try{ sessionStorage.setItem('maatram_guest_x','1'); }catch(e){} b.remove(); };
    b.appendChild(a); b.appendChild(x); document.body.appendChild(b);
  }
  function send(){
    try{ sessionStorage.setItem('maatram_next',PAGE); }catch(e){}
    location.replace('login.html');
  }


  /* ══ monthly leaderboard cycle ══
     Each signed-in user rolls their OWN doc over on the first page load of a
     new month: this month's points are archived to m_YYYY-MM, added to the
     lifetime total, then zeroed. No cron job, no server, no admin key.
     ponytail: self-reset; move to a Cloud Function only if a user who never
     opens the site again must still be flushed from the board. */
  function cycleId(dt){ dt=dt||new Date();
    return dt.getFullYear()+'-'+('0'+(dt.getMonth()+1)).slice(-2); }

  async function roll(F,db,uid,d){
    var now=cycleId();
    if(d.cycle===now) return;
    var pts=d.points||0, life=d.lifetime||0, patch={cycle:now};
    if(!d.cycle){                       /* first ever run: adopt the cycle only, do not wipe.
                                           lifetime = archived past months, so this month's
                                           points must NOT be copied into it (all-time would
                                           count them twice). 0 only fills a missing field. */
      if(d.lifetime===undefined) patch.lifetime = 0;
    }else{                              /* new month: archive, then zero */
      patch.lifetime = life+pts;
      patch.points   = 0;
      patch['m_'+d.cycle] = pts;
    }
    await F.updateDoc(F.doc(db,'users',uid),patch);
  }

  /* ══ moderation ══
     banned  : account frozen, every gated page refuses to open
     kickAt  : force sign-out, set by hand in the Firebase console (a number in ms
               or a timestamp). It signs out every session that began before it;
               signing in again afterwards is not affected, on any device. */
  function ms(v){ return v==null ? NaN : typeof v==='number' ? v
                  : typeof v.toMillis==='function' ? v.toMillis() : Date.parse(v); }
  function enforce(U,auth,d){
    if(d && d.banned===true){
      document.documentElement.classList.add('mgate');
      veil('This account is suspended.'+(d.bannedReason?'\n'+d.bannedReason:'')
           +'\nContact maatram97@gmail.com');
      try{ U.signOut(auth); }catch(e){}
      return true;
    }
    if(d && d.kickAt){
      var u=auth.currentUser, kick=ms(d.kickAt),
          since=ms(u && u.metadata && u.metadata.lastSignInTime);
      if(!isNaN(kick) && !isNaN(since) && kick>since){
        try{ U.signOut(auth); }catch(e){}
        send(); return true;
      }
    }
    return false;
  }

  function start(){
    (async function(){
      var m;
      try{
        m=await Promise.all([
          import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
          import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
          import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
        ]);
      }catch(e){ reveal(); return; }        /* offline: never lock the user out */
      var A=m[0],U=m[1],F=m[2];
      var app=A.getApps().length?A.getApp():A.initializeApp({apiKey:"AIzaSyAjiAm61IkH3wB1tjwOyGRrXAuRMKQyCcQ",authDomain:"maatram-859f4.firebaseapp.com",projectId:"maatram-859f4",storageBucket:"maatram-859f4.firebasestorage.app",messagingSenderId:"770970784123",appId:"1:770970784123:web:7c73c74ddb2179b69dedde"});
      var auth=U.getAuth(app), db=F.getFirestore(app), done=false;
      U.onAuthStateChanged(auth, async function(user){
        if(done) return; done=true;
        if(!user){ guest(); return; }
        var d={};
        try{ var snap=await F.getDoc(F.doc(db,'users',user.uid)); d=snap.exists()?snap.data():{}; }
        catch(e){ reveal(); return; }       /* read failed: let them work, do not trap them */
        if(enforce(U,auth,d)) return;      /* banned or kicked by an admin */
        /* stay live: a ban or kick lands while the page is open */
        try{ F.onSnapshot(F.doc(db,'users',user.uid),function(s){
               if(s.exists()) enforce(U,auth,s.data());
             }); }catch(e){}
        try{ await roll(F,db,user.uid,d); }catch(e){ }   /* never block the page on this */
        reveal();
      });
    })();
  }

  if(document.body) start();
  else document.addEventListener('DOMContentLoaded',start);
})();
