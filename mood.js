/* Maatram daily mood check-in. Data: users/{uid}/moods/{YYYY-MM-DD} (private, owner-only).
   gate.js calls maatramMood.start(uid,db,F) for signed-in users; stats.html loads this file too. */
(function(){
  var MOODS=[
    {k:'veryhappy',e:'\u{1F604}',n:'Very Happy',v:5},
    {k:'happy',e:'\u{1F642}',n:'Happy',v:4},
    {k:'okay',e:'\u{1F610}',n:'Okay',v:3},
    {k:'sad',e:'\u{1F614}',n:'Sad',v:2},
    {k:'stressed',e:'\u{1F623}',n:'Stressed',v:1},
    {k:'tired',e:'\u{1F634}',n:'Tired',v:0}
  ];
  function pad(n){ return ('0'+n).slice(-2); }
  function today(d){ d=d||new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){} return null; }
  function ss(k,v){ try{ if(v===undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k,v); }catch(e){} return null; }

  var ctx=null, box=null, started=false;

  var CSS='#moodBg{position:fixed;inset:0;z-index:9990;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.66);backdrop-filter:blur(6px)}'
   +'#moodBox{width:100%;max-width:440px;max-height:calc(100dvh - 32px);overflow:auto;background:var(--card,rgba(12,28,24,.96));background-color:#0c1c18;border:1px solid var(--stroke,rgba(47,227,143,.25));border-radius:24px;padding:26px 22px;color:var(--ink,#eafff6);font-family:var(--font-body,Inter,system-ui,sans-serif);text-align:center}'
   +'html.minimal #moodBox{background-color:#151716}'
   +'#moodBox h2{font-family:var(--font-display,Sora,sans-serif);font-size:21px;margin:0 0 6px}'
   +'#moodBox p{color:var(--dim,#7da99b);font-size:13.5px;line-height:1.5;margin:0 0 18px}'
   +'#moodGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:18px}'
   +'.mood-c{min-height:84px;border-radius:16px;border:1px solid var(--stroke,rgba(47,227,143,.2));background:rgba(255,255,255,.04);color:inherit;cursor:pointer;font:600 12.5px var(--font-body,Inter,sans-serif);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;transition:transform .15s,border-color .15s,background .15s}'
   +'.mood-c b{font-size:28px;line-height:1;font-weight:400}'
   +'.mood-c:hover{transform:translateY(-2px)}'
   +'.mood-c[aria-checked=true]{border-color:var(--green,#2fe38f);background:rgba(47,227,143,.14);box-shadow:0 0 0 2px var(--green,#2fe38f) inset}'
   +'.mood-act{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}'
   +'.mood-act button{min-height:44px;padding:0 22px;border-radius:100px;font:700 14px var(--font-body,Inter,sans-serif);cursor:pointer}'
   +'#moodSave{border:0;background:var(--green,#2fe38f);color:#04120f}#moodSave:disabled{opacity:.4;cursor:not-allowed}'
   +'#moodSkip{border:1px solid var(--stroke,rgba(255,255,255,.2));background:none;color:var(--dim,#7da99b)}'
   +'#moodMsg{min-height:18px;margin-top:12px;font-size:12.5px;color:var(--dim,#7da99b)}'
   +'@media(prefers-reduced-motion:reduce){.mood-c{transition:none}.mood-c:hover{transform:none}}';

  function close(){ if(box){ box.remove(); box=null; document.removeEventListener('keydown',onKey); } }
  function onKey(e){ if(e.key==='Escape') skip(); }
  function skip(){ if(ctx) ss('maatram_mood_skip_'+ctx.uid,today()); close(); }

  function open(edit){
    if(!ctx||box) return;
    if(!document.getElementById('moodCSS')){ var s=document.createElement('style'); s.id='moodCSS'; s.textContent=CSS; document.head.appendChild(s); }
    var sel=edit&&edit.k||null;
    box=document.createElement('div'); box.id='moodBg';
    box.innerHTML='<div id="moodBox" role="dialog" aria-modal="true" aria-labelledby="moodT">'
      +'<h2 id="moodT">'+(sel&&edit?'Change today’s mood':'How are you feeling today?')+'</h2>'
      +'<p>Take a moment for yourself. Your well-being matters.</p>'
      +'<div id="moodGrid" role="radiogroup" aria-label="Mood"></div>'
      +'<div class="mood-act"><button type="button" id="moodSave" disabled>Save Mood</button>'
      +'<button type="button" id="moodSkip">'+(edit?'Cancel':'Skip for now')+'</button></div>'
      +'<div id="moodMsg" role="status">Only you can see your mood.</div></div>';
    document.body.appendChild(box);
    var grid=box.querySelector('#moodGrid'), save=box.querySelector('#moodSave'), msg=box.querySelector('#moodMsg');
    MOODS.forEach(function(m){
      var b=document.createElement('button'); b.type='button'; b.className='mood-c'; b.setAttribute('role','radio');
      b.setAttribute('aria-checked',String(m.k===sel)); b.dataset.k=m.k;
      b.innerHTML='<b aria-hidden="true">'+m.e+'</b><span>'+m.n+'</span>';
      b.onclick=function(){ sel=m.k; [].forEach.call(grid.children,function(c){ c.setAttribute('aria-checked',String(c===b)); }); save.disabled=false; };
      grid.appendChild(b);
    });
    save.disabled=!sel;
    box.querySelector('#moodSkip').onclick=edit?close:skip;
    box.onclick=function(e){ if(e.target===box) (edit?close:skip)(); };
    document.addEventListener('keydown',onKey);
    save.onclick=async function(){
      if(!sel) return; save.disabled=true; msg.textContent='Saving…';
      try{ await write(sel); msg.textContent='Saved.'; setTimeout(close,500); }
      catch(e){ save.disabled=false; msg.textContent=(e&&e.code==='permission-denied')?'Blocked by Firestore rules. Publish the latest firestore.rules in the Firebase console.':'Could not save. Check your connection and try again.'; }
    };
    (grid.querySelector('[aria-checked=true]')||grid.firstChild).focus();
  }

  /* one doc per user per day: id = date. A transaction decides create vs update, so two tabs never duplicate. */
  async function write(k){
    var F=ctx.F, db=ctx.db, day=today(), ref=F.doc(db,'users',ctx.uid,'moods',day);
    await F.runTransaction(db,async function(t){
      var s=await t.get(ref);
      if(s.exists()) t.update(ref,{mood:k,updatedAt:F.serverTimestamp()});
      else t.set(ref,{uid:ctx.uid,mood:k,date:day,timestamp:F.serverTimestamp()});
    });
    ls('maatram_mood_'+ctx.uid,day);
    try{ dispatchEvent(new CustomEvent('maatram:mood',{detail:{date:day,mood:k}})); }catch(e){}
  }

  async function start(uid,db,F){
    ctx={uid:uid,db:db,F:F};
    if(started) return; started=true;
    var day=today();
    if(ls('maatram_mood_'+uid)===day) return;            /* already checked in today */
    if(ss('maatram_mood_skip_'+uid)===day) return;       /* skipped this session */
    try{
      var s=await F.getDoc(F.doc(db,'users',uid,'moods',day));
      if(s.exists()){ ls('maatram_mood_'+uid,day); return; }
    }catch(e){ try{console.warn('mood check',e);}catch(_){}
      if(!(e&&e.code==='permission-denied')) return; }   /* offline: don't nag. denied: show it so save reports the cause */
    if(ls('maatram_mood_'+uid)===day) return;            /* another tab saved meanwhile */
    open();
  }
  addEventListener('storage',function(e){                /* another tab saved: close ours */
    if(ctx && e.key==='maatram_mood_'+ctx.uid && e.newValue===today() && box) close();
  });

  window.maatramMood={MOODS:MOODS,today:today,start:start,open:function(k){ open(k?{k:k}:{k:null,edit:true}); },
    openEdit:function(k){ open({k:k||null}); }};
})();
