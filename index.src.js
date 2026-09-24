/* Readable source of index.js (home page). Edit here, then rebuild:
   npx terser index.src.js -c -m -o index.js */
/* story figures: decorative SVG art, kept out of the HTML (text/HTML ratio) */
var ART=["<svg viewBox=\"0 0 300 172\" aria-hidden=\"true\"><defs><linearGradient id=\"mgA\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0%\" stop-color=\"#AFCEC1\"></stop><stop offset=\"100%\" stop-color=\"#6F9384\"></stop></linearGradient></defs><g class=\"spin\"><circle cx=\"150\" cy=\"86\" r=\"52\" fill=\"none\" stroke=\"url(#mgA)\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-dasharray=\"200 127\"></circle></g><circle cx=\"150\" cy=\"86\" r=\"52\" fill=\"none\" stroke=\"rgba(255,255,255,.10)\" stroke-width=\"2.5\"></circle><circle cx=\"150\" cy=\"86\" r=\"34\" fill=\"none\" stroke=\"rgba(255,255,255,.07)\" stroke-width=\"1.2\" class=\"p4\"></circle><g class=\"p p1\"><rect x=\"139\" y=\"60\" width=\"7\" height=\"20\" rx=\"3.5\" fill=\"#ECEFEE\" opacity=\".85\"></rect><rect x=\"154\" y=\"60\" width=\"7\" height=\"20\" rx=\"3.5\" fill=\"#ECEFEE\" opacity=\".85\"></rect></g><g class=\"p p2\"><rect x=\"232\" y=\"46\" width=\"34\" height=\"34\" rx=\"11\" fill=\"rgba(255,255,255,.07)\" stroke=\"rgba(255,255,255,.13)\"></rect></g><g class=\"p p3\"><rect x=\"36\" y=\"96\" width=\"34\" height=\"34\" rx=\"11\" fill=\"rgba(255,255,255,.06)\" stroke=\"rgba(255,255,255,.12)\"></rect></g><path class=\"dash\" d=\"M70 118 C110 150 190 150 232 80\" fill=\"none\" stroke=\"#9CC0B2\" stroke-width=\"1.4\" opacity=\".55\"></path></svg>", "<svg viewBox=\"0 0 300 172\" aria-hidden=\"true\"><g class=\"p p2\"><rect x=\"34\" y=\"34\" width=\"40\" height=\"40\" rx=\"13\" fill=\"rgba(255,255,255,.06)\" stroke=\"rgba(255,255,255,.12)\"></rect></g><g class=\"p p3\"><rect x=\"226\" y=\"40\" width=\"40\" height=\"40\" rx=\"13\" fill=\"rgba(255,255,255,.06)\" stroke=\"rgba(255,255,255,.12)\"></rect></g><g class=\"p p1\"><rect x=\"52\" y=\"104\" width=\"34\" height=\"34\" rx=\"11\" fill=\"rgba(255,255,255,.05)\" stroke=\"rgba(255,255,255,.1)\"></rect><rect x=\"214\" y=\"106\" width=\"34\" height=\"34\" rx=\"11\" fill=\"rgba(255,255,255,.05)\" stroke=\"rgba(255,255,255,.1)\"></rect></g><g class=\"p4\"><path d=\"M150 22 L196 42 V92 C196 122 174 142 150 152 C126 142 104 122 104 92 V42 Z\" fill=\"rgba(175,206,193,.13)\" stroke=\"#9CC0B2\" stroke-width=\"1.6\" stroke-linejoin=\"round\"></path><rect x=\"136\" y=\"80\" width=\"28\" height=\"24\" rx=\"6\" fill=\"none\" stroke=\"#ECEFEE\" stroke-width=\"1.8\" opacity=\".9\"></rect><path d=\"M141 80 V72 a9 9 0 0 1 18 0 v8\" fill=\"none\" stroke=\"#ECEFEE\" stroke-width=\"1.8\" opacity=\".9\"></path></g></svg>", "<svg viewBox=\"0 0 300 172\" aria-hidden=\"true\"><path class=\"dash\" d=\"M70 60 L150 40 L230 60 L196 128 L104 128 Z\" fill=\"none\" stroke=\"#9CC0B2\" stroke-width=\"1.3\" opacity=\".5\"></path><g class=\"p p1\"><circle cx=\"150\" cy=\"40\" r=\"16\" fill=\"rgba(255,255,255,.08)\" stroke=\"rgba(255,255,255,.16)\"></circle></g><g class=\"p p2\"><circle cx=\"230\" cy=\"60\" r=\"14\" fill=\"rgba(255,255,255,.07)\" stroke=\"rgba(255,255,255,.14)\"></circle><circle cx=\"196\" cy=\"128\" r=\"12\" fill=\"rgba(255,255,255,.06)\" stroke=\"rgba(255,255,255,.13)\"></circle></g><g class=\"p p3\"><circle cx=\"70\" cy=\"60\" r=\"14\" fill=\"rgba(255,255,255,.07)\" stroke=\"rgba(255,255,255,.14)\"></circle><circle cx=\"104\" cy=\"128\" r=\"12\" fill=\"rgba(255,255,255,.06)\" stroke=\"rgba(255,255,255,.13)\"></circle></g><circle cx=\"150\" cy=\"88\" r=\"5\" fill=\"#9CC0B2\" class=\"p4\"></circle></svg>", "<svg viewBox=\"0 0 300 172\" aria-hidden=\"true\"><line x1=\"40\" y1=\"140\" x2=\"262\" y2=\"140\" stroke=\"rgba(255,255,255,.12)\" stroke-width=\"1\"></line><g class=\"grow\"><rect x=\"58\" y=\"98\" width=\"26\" height=\"42\" rx=\"8\" fill=\"rgba(255,255,255,.09)\"></rect><rect x=\"100\" y=\"76\" width=\"26\" height=\"64\" rx=\"8\" fill=\"rgba(255,255,255,.12)\"></rect><rect x=\"142\" y=\"54\" width=\"26\" height=\"86\" rx=\"8\" fill=\"rgba(175,206,193,.35)\"></rect><rect x=\"184\" y=\"86\" width=\"26\" height=\"54\" rx=\"8\" fill=\"rgba(255,255,255,.11)\"></rect><rect x=\"226\" y=\"110\" width=\"26\" height=\"30\" rx=\"8\" fill=\"rgba(255,255,255,.08)\"></rect></g><path class=\"dash\" d=\"M71 92 L113 70 L155 48 L197 80 L239 104\" fill=\"none\" stroke=\"#9CC0B2\" stroke-width=\"1.6\" stroke-linecap=\"round\"></path><g class=\"p p1\"><circle cx=\"155\" cy=\"48\" r=\"5\" fill=\"#ECEFEE\"></circle></g></svg>", "<svg viewBox=\"0 0 300 172\" aria-hidden=\"true\"><g class=\"grow\"><rect x=\"112\" y=\"62\" width=\"76\" height=\"82\" rx=\"14\" fill=\"rgba(175,206,193,.28)\"></rect><rect x=\"34\" y=\"92\" width=\"72\" height=\"52\" rx=\"14\" fill=\"rgba(255,255,255,.09)\"></rect><rect x=\"194\" y=\"104\" width=\"72\" height=\"40\" rx=\"14\" fill=\"rgba(255,255,255,.07)\"></rect></g><g class=\"p p1\"><path d=\"M150 20 l7.4 15.4 16.6 2.4-12 11.9 2.9 16.9-14.9-8-14.9 8 2.9-16.9-12-11.9 16.6-2.4z\" fill=\"#9CC0B2\" opacity=\".9\"></path></g><g class=\"p p2\"><circle cx=\"70\" cy=\"74\" r=\"11\" fill=\"rgba(255,255,255,.1)\" stroke=\"rgba(255,255,255,.16)\"></circle></g><g class=\"p p3\"><circle cx=\"230\" cy=\"86\" r=\"11\" fill=\"rgba(255,255,255,.09)\" stroke=\"rgba(255,255,255,.15)\"></circle></g></svg>","<svg viewBox=\"0 0 300 172\" aria-hidden=\"true\"><line x1=\"40\" y1=\"140\" x2=\"262\" y2=\"140\" stroke=\"rgba(255,255,255,.12)\" stroke-width=\"1\"></line><g class=\"grow\"><path d=\"M150 30 C150 30 116 72 116 96 a34 34 0 0 0 68 0 C184 72 150 30 150 30z\" fill=\"rgba(175,206,193,.28)\" stroke=\"#9CC0B2\" stroke-width=\"1.6\"></path><path d=\"M136 100 a14 14 0 0 0 14 14\" fill=\"none\" stroke=\"rgba(255,255,255,.35)\" stroke-width=\"2\" stroke-linecap=\"round\"></path></g><g class=\"p p1\"><path d=\"M70 120 C70 94 92 80 112 82 C112 104 94 120 70 120z\" fill=\"rgba(255,255,255,.1)\" stroke=\"rgba(255,255,255,.18)\"></path></g><g class=\"p p2\"><circle cx=\"212\" cy=\"96\" r=\"7\" fill=\"rgba(255,255,255,.1)\"></circle><circle cx=\"234\" cy=\"96\" r=\"7\" fill=\"rgba(156,192,178,.45)\"></circle><circle cx=\"256\" cy=\"96\" r=\"7\" fill=\"#9CC0B2\"></circle></g></svg>"];
document.querySelectorAll('.m-fig[data-art]').forEach(function(d){d.innerHTML=ART[+d.getAttribute('data-art')];});
;


/* ═════════ FX state FIRST (so nothing can touch it before it exists) ═════════ */
let trail=[],waves=[],confetti=[];
function shockwave(x,y){
  waves.push({x,y,r:0,life:1});
  for(let i=0;i<22;i++){const a=Math.random()*6.283,s=1.5+Math.random()*4;
    confetti.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1.5,life:1,
      hue:[152,200,45,320][Math.floor(Math.random()*4)],rot:Math.random()*6.283,vr:(Math.random()-.5)*.3});}
}

/* ═════════ canvases ══════��══ */
const LITE=(window.MAATRAM_PERF!==undefined)?window.MAATRAM_PERF:(matchMedia('(pointer:coarse)').matches||innerWidth<820||(navigator.hardwareConcurrency||8)<=4);
const DPR=LITE?1:Math.min(devicePixelRatio||1,1.5);
let W=0,H=0;
const cvs={stars:document.getElementById('stars'),
  swarm:document.getElementById('swarm'),fx:document.getElementById('fx')};
function fitAll(){
  W=Math.max(1,innerWidth);H=Math.max(1,innerHeight);
  for(const cv of Object.values(cvs)){
    cv.width=W*DPR;cv.height=H*DPR;
    cv.style.width=W+'px';cv.style.height=H+'px';
    cv.getContext('2d').setTransform(DPR,0,0,DPR,0,0);
  }
}
fitAll();
const S=cvs.stars.getContext('2d'),
      P=cvs.swarm.getContext('2d'),F=cvs.fx.getContext('2d');
const reduced=(window.MAATRAM_PERF===true) || matchMedia('(prefers-reduced-motion: reduce)').matches;

const mouse={x:W/2,y:H/2,down:false};
addEventListener('pointermove',e=>{
  mouse.x=e.clientX;mouse.y=e.clientY;
  if(reduced&&cur){cur.style.left=mouse.x+'px';cur.style.top=mouse.y+'px';}  /* loop is off in perf mode → move cursor here */
});
addEventListener('pointerdown',e=>{mouse.down=true;shockwave(e.clientX,e.clientY);});
addEventListener('pointerup',()=>mouse.down=false);

const cur=document.getElementById('cursor');

/* ═════════ SWARM: free-flying sprites that orbit the wordmark ═════════ */
const SRGB={152:'rgb(47,227,143)',200:'rgb(55,182,255)',45:'rgb(255,209,102)',320:'rgb(255,110,199)',160:'rgb(120,235,190)',205:'rgb(140,205,255)'};
const NS=Math.min(LITE?26:70,Math.floor(W/18));
const sw=[];
for(let i=0;i<NS;i++){
  sw.push({a:Math.random()*6.283, rad:(0.18+Math.random()*0.42)*Math.min(W,H),
    sp:(Math.random()<.5?-1:1)*(0.002+Math.random()*0.006),
    wob:Math.random()*6.283, hue:[152,200,45,320][i%4], size:1+Math.random()*2});
}
function drawSwarm(t){
  P.clearRect(0,0,W,H);
  const cx=W/2, cy=H*0.46;
  for(const s of sw){
    s.a+=s.sp; s.wob+=.03;
    let x=cx+Math.cos(s.a)*s.rad*(1+.06*Math.sin(s.wob));
    let y=cy+Math.sin(s.a)*s.rad*.62*(1+.06*Math.cos(s.wob));
    /* cursor repulsion */
    const dx=x-mouse.x,dy=y-mouse.y,d2=dx*dx+dy*dy,R=mouse.down?190:100;
    if(d2<R*R){const d=Math.sqrt(d2)||1,f=(R-d)/R;x+=(dx/d)*f*46;y+=(dy/d)*f*46;}
    const glow=.45+.35*Math.sin(s.wob*2);
    P.globalAlpha=glow;
    P.fillStyle=SRGB[s.hue];
    P.beginPath();P.arc(x,y,s.size,0,6.283);P.fill();
    s._x=x;s._y=y;
  }
  P.globalAlpha=1;
  /* constellation threads — sample only nearby indices, single stroke style */
  P.lineWidth=.5;P.strokeStyle='rgba(55,182,255,.14)';P.beginPath();
  for(let i=0;i<sw.length;i++){
    const a=sw[i];if(a._x==null)continue;
    for(let k=1;k<=3;k++){
      const b=sw[(i+k)%sw.length];if(b._x==null)continue;
      const dx=a._x-b._x,dy=a._y-b._y;
      if(dx*dx+dy*dy<90*90){P.moveTo(a._x,a._y);P.lineTo(b._x,b._y);}
    }
  }
  P.stroke();
}

/* ═════════ STARFIELD ═════════ */
const stars=[];
for(let i=0;i<(LITE?32:80);i++)stars.push({x:Math.random(),y:Math.random(),
  z:.3+Math.random()*.7,tw:Math.random()*7,hue:Math.random()<.5?160:205});
function drawStars(){
  S.clearRect(0,0,W,H);
  const ox=(mouse.x-W/2)*.015,oy=(mouse.y-H/2)*.015;
  for(const st of stars){
    st.tw+=.03;
    S.globalAlpha=.15+.25*Math.abs(Math.sin(st.tw))*st.z;
    S.fillStyle=SRGB[st.hue];
    S.beginPath();
    S.arc(st.x*W-ox*st.z*8,st.y*H-oy*st.z*8,st.z*1.4,0,6.283);S.fill();
  }
  S.globalAlpha=1;
}

/* ═════════ FX: comet trail, shockwaves, confetti ═════════ */
function drawFX(){
  F.clearRect(0,0,W,H);
  trail.push({x:mouse.x,y:mouse.y});
  if(trail.length>26)trail.shift();
  for(let i=0;i<trail.length;i++){
    const tp=trail[i],k=i/trail.length;
    F.globalAlpha=k*.32;
    F.fillStyle=k<.5?SRGB[160]:SRGB[205];
    F.beginPath();F.arc(tp.x,tp.y,k*5,0,6.283);F.fill();
  }
  F.globalAlpha=1;
  waves=waves.filter(w=>w.life>0);
  for(const w of waves){w.r+=7;w.life-=.03;
    F.strokeStyle=`rgba(47,227,143,${w.life*.6})`;F.lineWidth=2.2;
    F.beginPath();F.arc(w.x,w.y,w.r,0,6.283);F.stroke();
    F.strokeStyle=`rgba(55,182,255,${w.life*.35})`;F.lineWidth=1.2;
    F.beginPath();F.arc(w.x,w.y,w.r*.66,0,6.283);F.stroke();}
  confetti=confetti.filter(c=>c.life>0);
  for(const c of confetti){c.x+=c.vx;c.y+=c.vy;c.vy+=.08;c.life-=.014;c.rot+=c.vr;
    F.save();F.translate(c.x,c.y);F.rotate(c.rot);
    F.globalAlpha=c.life;F.fillStyle=SRGB[c.hue];
    F.fillRect(-2.5,-1.2,5,2.4);F.restore();}
  F.globalAlpha=1;
}

/* ═════════ master loop ═════════ */
function loop(t){
  drawStars();drawSwarm(t);drawFX();
  cur.style.left=mouse.x+'px';cur.style.top=mouse.y+'px';
  if(!reduced)requestAnimationFrame(loop);
}

/* ═════════ build neon wordmark letters ═════════ */
const WORD='MAATRAM';
const wm=document.getElementById('wordmark');
/* letters ship in the HTML so the LCP element paints without waiting on JS;
   only build them here if the markup ever loses them */
if(!wm.querySelector('.L')){
  WORD.split('').forEach(ch=>{
    const sp=document.createElement('span');
    sp.className='L';sp.textContent=ch;wm.appendChild(sp);
  });
}
const letters=[...wm.querySelectorAll('.L')];

/* ═════════ choreography — starts after fonts are ready ═════════ */
function start(){
  fitAll();                       // re-fit now that layout is final
  document.body.classList.add('open');       // cinematic bars slide away
  if(!reduced)requestAnimationFrame(loop);
  else{drawStars();drawSwarm(0);}

  setTimeout(()=>document.getElementById('pre').classList.add('show'),300);
  letters.forEach((L,i)=>setTimeout(()=>L.classList.add('in'),350+i*70));
  setTimeout(()=>document.getElementById('slab').classList.add('show'),350+letters.length*70+150);
  const words=[...document.querySelectorAll('.slogan .w')];
  words.forEach((w,i)=>setTimeout(()=>w.classList.add('show'),1050+i*90));
  setTimeout(()=>document.getElementById('jingle').classList.add('show'),1550);
  setTimeout(()=>document.getElementById('enter').classList.add('show'),1850);
  setTimeout(()=>{if(!reduced){shockwave(W*.28,H*.3);shockwave(W*.72,H*.32);}},1150);
}

/* wait for fonts (with a safety timeout so we never hang) */

  Promise.race([
    (document.fonts&&document.fonts.ready)||Promise.resolve(),
    new Promise(r=>setTimeout(r,400))
  ]).then(()=>requestAnimationFrame(()=>requestAnimationFrame(start)));


/* enter hover cursor */
const enterBtn=document.getElementById('enter');
enterBtn.addEventListener('pointerenter',()=>document.body.classList.add('hovering'));
enterBtn.addEventListener('pointerleave',()=>document.body.classList.remove('hovering'));
document.addEventListener('pointerover',e=>{if(e.target.closest('.fcard'))document.body.classList.add('hovering');});
document.addEventListener('pointerout',e=>{if(e.target.closest('.fcard'))document.body.classList.remove('hovering');});

/* Enter → burst + hook for redirect */
enterBtn.addEventListener('click',()=>{
  for(let i=0;i<6;i++)setTimeout(()=>shockwave(Math.random()*W,Math.random()*H),i*110);
  letters.forEach((L,i)=>{
    L.style.transition='all .8s cubic-bezier(.6,-.3,.3,1)';
    L.style.transform=`translateY(${-120-Math.random()*160}px) rotate(${(Math.random()-.5)*70}deg) scale(.3)`;
    L.style.opacity='0';L.style.filter='blur(10px)';
  });
  setTimeout(()=>document.getElementById('menu').classList.add('show'),900);
});


/* ══ leave menu → back to home start screen ══ */
(function(){
  const menu=document.getElementById('menu');
  function goHome(){ location.reload(); }   /* replay intro from the top */
  document.getElementById('menuBack').addEventListener('click',goHome);
  menu.addEventListener('click',e=>{        /* click backdrop, not a card/back btn */
    if(e.target.closest('.fcard')||e.target.closest('.menu-in')||e.target.closest('#menuBack'))return;
    goHome();
  });
  addEventListener('keydown',e=>{ if(e.key==='Escape'&&menu.classList.contains('show'))goHome(); });
})();

addEventListener('resize',fitAll);

;

/* ═�� universal nav auth (Firebase session shared across all pages) ══ */
(async()=>{
  const chip=document.getElementById('mnavChip'),inBtn=document.getElementById('mnavIn'),
        menu=document.getElementById('mnavMenu');
  if(!chip)return;
  chip.addEventListener('click',e=>{ if(!e.target.closest('#mnavMenu')) menu.classList.toggle('open'); });
  document.addEventListener('click',e=>{ if(!e.target.closest('#mnavChip')) menu.classList.remove('open'); });
  if(!(location.protocol==='http:'||location.protocol==='https:'))return;  // file:// → nav stays simple
  try{
    const [{initializeApp,getApps,getApp},{getAuth,onAuthStateChanged,signOut}]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js')
    ]);
    const app=getApps().length?getApp():initializeApp({apiKey:"AIzaSyAjiAm61IkH3wB1tjwOyGRrXAuRMKQyCcQ",authDomain:"maatram-859f4.firebaseapp.com",projectId:"maatram-859f4",storageBucket:"maatram-859f4.firebasestorage.app",messagingSenderId:"770970784123",appId:"1:770970784123:web:7c73c74ddb2179b69dedde"});
    const auth=getAuth(app);
    /* Firestore is only ever touched once somebody is signed in, so it loads on
       demand instead of up front. Signed-out visitors — and page-speed tests —
       never download it. */
    let db=null,doc=null,onSnapshot=null,runTransaction=null,fsReady=null;
    const loadFs=()=>fsReady||(fsReady=import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
      .then(m=>{ doc=m.doc; onSnapshot=m.onSnapshot; runTransaction=m.runTransaction; db=m.getFirestore(app); }));
    let unsub=null;
    /* ══ Maatram points engine (all pages) ══ */
    let __mtUser=null;
    window.maatramAward=async function(pts,reason){
      pts=Math.round(pts); if(!pts) return;
      /* local bank (works offline / signed-out) */
      try{
        const cur=+localStorage.getItem('maatram_points')||0;
        localStorage.setItem('maatram_points',Math.max(0,cur+pts));
      }catch(_){}
      try{ new BroadcastChannel('maatram').postMessage({type:'points',pts}); }catch(_){}
      try{ parent.postMessage({maatramRelay:{type:'points',pts}},'*'); }catch(_){}
      mtToast(pts,reason);
      /* cloud write: queued per account, paced to match firestore.rules
         (gains: at most 1 point per 6 s since the last gain, 100 per write) */
      if(__mtUser){
        const K='maatram_pend_'+__mtUser.uid;
        try{ localStorage.setItem(K,String((+localStorage.getItem(K)||0)+pts)); }catch(_){}
        mtFlush();
      }
    };
    async function mtFlush(){
      if(!__mtUser) return;
      const uid=__mtUser.uid, K='maatram_pend_'+uid, pend=()=>+localStorage.getItem(K)||0;
      const run=async()=>{
        const p=pend(); if(!p) return 0;
        if(typeof loadFs==='function') await loadFs();
        const {serverTimestamp}=await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const res=await runTransaction(db,async t=>{
          const r=doc(db,'users',uid), s=await t.get(r), d=s.exists()?s.data():{}, cur=d.points||0;
          if(p<0){ const nx=Math.max(0,cur-100,cur+p); t.set(r,{points:nx},{merge:true}); return {used:nx===0?p:nx-cur,wait:0}; }
          const since=(Date.now()-(d.awardAt?d.awardAt.toMillis():0))/1000-3, want=Math.min(100,p,3000-cur);
          if(want<=0) return {used:p,wait:0};   /* monthly ceiling reached: drop the rest */
          if(Math.floor(since/6)<want) return {used:0,wait:Math.ceil(want*6-since)};
          t.set(r,{points:cur+want,awardAt:serverTimestamp()},{merge:true}); return {used:want,wait:0};
        });
        localStorage.setItem(K,String(pend()-res.used));
        return res.wait||(pend()?1:0);
      };
      let wait=0;
      const locked=()=>navigator.locks?navigator.locks.request('maatram_pts',run):run();
      try{ wait=await (mtFlush.q=(mtFlush.q||Promise.resolve()).catch(()=>{}).then(locked)); }   /* one flush at a time, per tab and across tabs */
      catch(e){ console.warn('points write',e); wait=60; }
      clearTimeout(mtFlush.t); if(wait) mtFlush.t=setTimeout(mtFlush,wait*1000);
    }
    function mtToast(pts,reason){
      const t=document.createElement('div');
      t.textContent=(pts>0?'+':'')+pts+' PTS'+(reason?' · '+reason:'');
      t.style.cssText='position:fixed;top:64px;right:16px;z-index:900;font-family:Sora,Inter,sans-serif;'
        +'font-weight:800;font-size:13px;letter-spacing:1px;padding:11px 20px;border-radius:100px;'
        +'backdrop-filter:blur(10px);transition:all .5s cubic-bezier(.2,1.3,.3,1);opacity:0;transform:translateY(-14px);'
        +(pts>0?'color:#04120f;background:linear-gradient(90deg,#2fe38f,#37b6ff);box-shadow:0 8px 30px -8px rgba(47,227,143,.7);'
               :'color:#fff;background:linear-gradient(90deg,#ff5d73,#ff9a5d);box-shadow:0 8px 30px -8px rgba(255,93,115,.7);');
      document.body.appendChild(t);
      requestAnimationFrame(()=>{t.style.opacity='1';t.style.transform='none';});
      setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(-14px)';},2600);
      setTimeout(()=>t.remove(),3200);
    }

    onAuthStateChanged(auth,async u=>{
      __mtUser=u;
      if(u) mtFlush();
      if(unsub){unsub();unsub=null;}
      if(u){
        inBtn.style.display='none';chip.style.display='flex';
        document.getElementById('mnavPic').src=u.photoURL||'';
        document.getElementById('mnavNm').textContent=(u.displayName||'You').split(' ')[0];
        await loadFs();
        if(__mtUser!==u) return;               /* signed out again while loading */
        unsub=onSnapshot(doc(db,'users',u.uid),s=>{
          document.getElementById('mnavPts').textContent=((s.exists()&&s.data().points)||0)+' PTS';
        },()=>{});
      }else{
        inBtn.style.display='inline-block';chip.style.display='none';
      }
    });
    document.getElementById('mnavOut').onclick=()=>{menu.classList.remove('open');signOut(auth);};
  }catch(e){console.warn('nav auth',e);}
})();

;

/* ══ performance toggle behavior ══ */
(function(){
  var KEY='maatram_perf', btn=document.getElementById('perfBtn'), lbl=document.getElementById('perfLbl');
  function paint(on){
    document.documentElement.classList.toggle('perf',on);
    btn.setAttribute('aria-pressed',String(on));
    lbl.textContent = on ? 'Performance: On' : 'Performance';
  }
  paint(!!window.MAATRAM_PERF);
  btn.addEventListener('click',function(){
    var on=!(localStorage.getItem(KEY)==='1');
    try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}
    /* reload so canvases rebuild at the new detail level — clean + reliable */
    location.reload();
  });
})();

;
