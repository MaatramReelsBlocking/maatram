/* MAATRAM Wellness: client-side prototype. Persist profile/trackers through the existing authenticated user store in production. */
const profile={age:null,height:null,weight:null,goal:null,activity:null,diet:null,avoid:[],other:''};
const meals=[
 {id:'idli',type:'Breakfast',name:'Idli + sambar + fruit',desc:'Warm, steady energy to start.',diets:['vegetarian','eggs','nonveg','any'],allergens:[],goals:['balanced','habits','fitness','manage','gain','muscle']},
 {id:'poha',type:'Breakfast',name:'Vegetable poha + fruit',desc:'Light, practical and fibre-rich.',diets:['vegetarian','eggs','nonveg','any'],allergens:[],goals:['balanced','habits','fitness','manage']},
 {id:'upma',type:'Breakfast',name:'Vegetable upma + orange',desc:'A simple, satisfying start.',diets:['vegetarian','eggs','nonveg','any'],allergens:['gluten'],goals:['balanced','habits','fitness','manage']},
 {id:'oats',type:'Breakfast',name:'Oats with banana & seeds',desc:'Energy with a little staying power.',diets:['vegetarian','eggs','nonveg','any'],allergens:['dairy','gluten'],goals:['gain','muscle','fitness','balanced']},
 {id:'eggs',type:'Breakfast',name:'Egg bhurji + roti + fruit',desc:'Protein plus carbohydrates for recovery.',diets:['eggs','nonveg','any'],allergens:['eggs','gluten'],goals:['muscle','gain','fitness']},
 {id:'dosa',type:'Breakfast',name:'Dosa + sambar + chutney',desc:'Classic, easy and filling.',diets:['vegetarian','eggs','nonveg','any'],allergens:[],goals:['balanced','habits','gain','fitness']},
 {id:'milkshake',type:'Mid-morning',name:'Banana milk + seeds',desc:'A nutritious energy top-up.',diets:['vegetarian','eggs','nonveg','any'],allergens:['dairy'],goals:['gain','muscle']},
 {id:'fruit',type:'Mid-morning',name:'Seasonal fruit + roasted chana',desc:'Fibre and protein between classes.',diets:['vegetarian','eggs','nonveg','vegan','any'],allergens:[],goals:['balanced','habits','fitness','manage']},
 {id:'sprouts',type:'Mid-morning',name:'Sprouts chaat + lemon',desc:'A tangy protein-containing snack.',diets:['vegetarian','eggs','nonveg','vegan','any'],allergens:[],goals:['muscle','fitness','balanced','manage']},
 {id:'dalrice',type:'Lunch',name:'Rice + dal + vegetables + curd',desc:'A familiar balanced plate.',diets:['vegetarian','eggs','nonveg','any'],allergens:['dairy'],goals:['balanced','habits','fitness','gain']},
 {id:'rajma',type:'Lunch',name:'Rajma rice + salad',desc:'Comforting, fibre-rich plant protein.',diets:['vegetarian','eggs','nonveg','vegan','any'],allergens:[],goals:['muscle','balanced','fitness','gain']},
 {id:'paneer',type:'Lunch',name:'Roti + paneer curry + vegetables',desc:'Protein and colour on one plate.',diets:['vegetarian','eggs','nonveg','any'],allergens:['dairy','gluten'],goals:['muscle','gain','fitness']},
 {id:'chicken',type:'Lunch',name:'Rice + chicken curry + vegetables',desc:'Protein-rich fuel for active days.',diets:['nonveg','any'],allergens:[],goals:['muscle','gain','fitness']},
 {id:'chana',type:'Evening',name:'Roasted chana + fruit',desc:'Crunchy, portable and satisfying.',diets:['vegetarian','eggs','nonveg','vegan','any'],allergens:[],goals:['balanced','habits','fitness','manage']},
 {id:'peanut',type:'Evening',name:'Peanut chaat + banana',desc:'Affordable energy between tasks.',diets:['vegetarian','eggs','nonveg','vegan','any'],allergens:['nuts'],goals:['gain','muscle','fitness']},
 {id:'curd',type:'Evening',name:'Curd + fruit + seeds',desc:'A calm, cooling snack.',diets:['vegetarian','eggs','nonveg','any'],allergens:['dairy'],goals:['balanced','habits','fitness']},
 {id:'rotiDal',type:'Dinner',name:'Roti + dal + vegetable curry',desc:'A reliable balanced dinner.',diets:['vegetarian','eggs','nonveg','any'],allergens:['gluten'],goals:['balanced','habits','fitness','manage','gain']},
 {id:'khichdi',type:'Dinner',name:'Vegetable khichdi + salad',desc:'Comforting and easy to prepare.',diets:['vegetarian','eggs','nonveg','vegan','any'],allergens:[],goals:['balanced','habits','manage','fitness']},
 {id:'fish',type:'Dinner',name:'Rice + fish curry + vegetables',desc:'A nourishing protein-rich plate.',diets:['nonveg','any'],allergens:[],goals:['muscle','gain','fitness']},
 {id:'tofu',type:'Dinner',name:'Roti + tofu vegetable curry',desc:'Plant protein for a steady evening.',diets:['vegetarian','eggs','nonveg','vegan','any'],allergens:['soy','gluten'],goals:['muscle','gain','fitness','balanced']}
];
/* Swap bank: five same-meal-type fallbacks are available even when allergies remove
   dishes from the main weekly catalogue. These are simple Indian meals and remain
   compatible with every listed goal; portions can be adjusted by the future API. */
const swapMeals={
 Breakfast:[['millet-pongal','Millet pongal + sambar','Warm, gluten-free comfort food.'],['rice-kanji','Rice kanji + fruit','Gentle, practical morning energy.'],['besan-chilla','Besan chilla + mint chutney','A savoury protein-containing start.'],['ragi-porridge','Ragi porridge + banana','Familiar, steady breakfast fuel.'],['veg-sevai','Vegetable rice sevai','Light, colourful and easy to make.'],['corn-upma','Corn upma + fruit','A simple alternate grain breakfast.']],
 'Mid-morning':[['guava-chana','Guava + roasted chana','Fresh fruit with a crunchy boost.'],['coconut-fruit','Coconut water + fruit','Hydration and seasonal fruit.'],['sweet-potato','Steamed sweet potato + lime','Affordable, satisfying energy.'],['makhana','Roasted makhana + orange','A light snack for between classes.'],['moong-chaat','Moong chaat + cucumber','Fresh and protein-containing.'],['banana-seeds','Banana + sunflower seeds','A no-fuss pocket snack.']],
 Lunch:[['sambar-rice','Sambar rice + vegetable poriyal','A balanced, familiar lunch.'],['chole-rice','Chole rice + cucumber salad','Hearty plant protein and fibre.'],['veg-pulao','Vegetable pulao + dal','Colourful grains and pulses.'],['lemon-rice','Lemon rice + vegetable kootu','Bright, affordable and filling.'],['moong-khichdi','Moong dal khichdi + vegetables','Simple comfort with pulses.'],['millet-dal','Millet + dal + vegetables','A wholesome everyday plate.']],
 Evening:[['corn-chaat','Sweet corn chaat + lime','Quick, colourful and satisfying.'],['sweet-potato-snack','Roasted sweet potato wedges','A warm after-school snack.'],['fruit-chaat','Fruit chaat + pumpkin seeds','Fresh, crunchy and easy.'],['makhana-snack','Roasted makhana + spices','A practical study snack.'],['moong-sprouts','Moong sprouts + lemon','A bright savoury bowl.'],['puffed-rice','Puffed rice bhel + vegetables','Crisp, quick and affordable.']],
 Dinner:[['veg-sambar-rice','Rice + sambar + vegetables','A simple, complete evening plate.'],['dal-khichdi','Dal khichdi + vegetable salad','Gentle, warm and balanced.'],['veg-pulao-dinner','Vegetable pulao + dal','Easy family-style dinner fuel.'],['chole-bowl','Chole + rice + cucumber','Plant protein for a steady night.'],['lemon-rice-dinner','Lemon rice + mixed vegetables','Simple ingredients, good rhythm.'],['millet-khichdi','Millet khichdi + vegetable curry','Comforting and naturally gluten-free.']]
};
const commonSwapMeta={diets:['vegetarian','eggs','nonveg','vegan','any'],allergens:[],goals:['gain','muscle','fitness','balanced','habits','manage']};
const mealSwapOptions=(type,currentId)=>[...meals.filter(m=>m.type===type),...(swapMeals[type]||[]).map(([id,name,desc])=>({id,type,name,desc,...commonSwapMeta}))].filter(m=>m.id!==currentId&&m.diets.includes(profile.diet)&&!m.allergens.some(a=>profile.avoid.includes(a))).slice(0,5);
const goalCopy={gain:['Nourish your momentum.','Energy-rich meals with regular snacks help you keep up with school, sport and life.'],muscle:['Fuel. Move. Recover.','Protein-containing meals, carbohydrates and rest work together.'],fitness:['Move with steady energy.','Balanced meals designed to support everyday activity.'],balanced:['A better plate rhythm.','Simple, familiar meals that help make balance repeatable.'],habits:['Keep it easy to repeat.','A reliable rhythm beats a perfect day.'],manage:['Feel steady and satisfied.','Balanced meals and consistent routines—never skipping meals.']};
let day=0,plan=[],currentSwap=null,streak=5;

const savedProfile=localStorage.getItem('maatramWellnessProfile');
const savedPlan=localStorage.getItem('maatramWellnessPlan');

if(savedProfile){
  Object.assign(profile,JSON.parse(savedProfile));
}

if(savedPlan){
  plan=JSON.parse(savedPlan);
}
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function show(id){$$('.screen').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active');$$('.nav-action').forEach(x=>x.classList.toggle('active',x.dataset.screen===id));window.scrollTo({top:0,behavior:'smooth'});}
function eligible(type){let list=meals.filter(m=>m.type===type&&m.diets.includes(profile.diet)&&m.goals.includes(profile.goal)&&!m.allergens.some(a=>profile.avoid.includes(a)));if(!list.length)list=meals.filter(m=>m.type===type&&m.diets.includes(profile.diet)&&!m.allergens.some(a=>profile.avoid.includes(a)));return list;}
function buildPlan(){const types=['Breakfast','Mid-morning','Lunch','Evening','Dinner'];/* A deterministic profile seed keeps variations consistent for one person while meaningfully using all private baseline fields—without turning them into body labels or calorie targets. */const baselineSeed=Math.round(profile.age*3+profile.height/7+profile.weight);const activityOffset={inactive:0,light:1,moderate:2,very:3}[profile.activity];plan=Array.from({length:7},(_,i)=>types.map((type,j)=>{const list=eligible(type);return list[(baselineSeed+i+j+activityOffset)%list.length]||{type,name:'Seasonal vegetables + rice/roti',desc:'A flexible meal based on what is available.'};}));}
function renderPlan(){const [title,copy]=goalCopy[profile.goal];$('#planSummary').textContent=`A 7-day ${title.toLowerCase()} plan shaped around your baseline, goal and ${profile.activity.replace('inactive','mostly inactive')} routine.`;$('#goalTag').textContent=profile.goal.toUpperCase();$('#missionTitle').textContent=title;$('#missionCopy').textContent=copy;$('#safetyNote').textContent=profile.age<18?'For growing bodies, this plan keeps the focus on regular balanced meals, energy, movement, sleep and recovery—not weight targets or restriction. For allergies, health concerns or growth questions, check with a qualified dietitian or healthcare professional.':'General wellness guidance only—not medical nutrition care. For allergies, medical conditions or specialist dietary needs, speak with a qualified dietitian or healthcare professional.';$('#dayTabs').innerHTML=plan.map((_,i)=>`<button class="${i===day?'selected':''}" data-day="${i}">DAY ${i+1}</button>`).join('');$('#dayTitle').textContent=`DAY ${day+1}`;$('#mealList').innerHTML=plan[day].map((m,i)=>`<div class="meal-row"><span class="meal-type">${m.type.toUpperCase()}</span><div><b>${m.name}</b><p>${m.desc}</p></div><button class="swap" data-meal="${i}">SWAP ↻</button></div>`).join('');}
function validateDetails(){profile.age=+$('#age').value;profile.height=+$('#height').value;profile.weight=+$('#weight').value;if(profile.age<13||profile.age>100||profile.height<100||profile.height>250||profile.weight<25||profile.weight>300){$('#detailError').textContent='Enter an age, height and weight within the shown ranges.';return false}$('#detailError').textContent='';return true;}
function toNext(id){if(id==='goal'&&!validateDetails())return;if(id==='activity'&&!profile.goal){$('#goalHint').textContent='CHOOSE A GOAL TO CONTINUE';return}if(id==='preferences'&&!profile.activity){$('#activityHint').textContent='CHOOSE AN ACTIVITY LEVEL TO CONTINUE';return}show(id)}
$$('[data-next]').forEach(b=>b.onclick=()=>toNext(b.dataset.next));$$('[data-back]').forEach(b=>b.onclick=()=>show(b.dataset.back));$$('[data-exit]').forEach(b=>b.onclick=()=>show('intro'));
$$('[data-choice] button').forEach(b=>b.onclick=()=>{const parent=b.closest('[data-choice]');parent.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');profile[parent.dataset.choice]=b.dataset.value;if(parent.dataset.choice==='goal')$('#goalHint').textContent='GOAL LOCKED IN';if(parent.dataset.choice==='activity')$('#activityHint').textContent='ACTIVITY LEVEL SAVED';});
$('#dietChips').querySelectorAll('button').forEach(b=>b.onclick=()=>{$$('#dietChips button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');profile.diet=b.dataset.value;$('#preferenceHint').textContent='PREFERENCE SAVED';});
$('#avoidChips').querySelectorAll('button').forEach(b=>b.onclick=()=>{b.classList.toggle('selected');profile.avoid=$$('#avoidChips button.selected').map(x=>x.dataset.value);});
$('#generate').onclick=()=>{if(!profile.diet){$('#preferenceHint').textContent='PICK A FOOD PREFERENCE FIRST';return}profile.other=$('#otherAvoid').value.trim();show('loading');let lines=['Checking your preferences...','Building familiar meal options...','Keeping your plan practical...'];let n=0;let interval=setInterval(()=>{$('#loadingLine').textContent=lines[++n]||'Your plan is ready.';if(n>=lines.length){clearInterval(interval);buildPlan();localStorage.setItem('maatramWellnessProfile',JSON.stringify(profile));localStorage.setItem('maatramWellnessPlan',JSON.stringify(plan));renderPlan();setTimeout(()=>show('plan'),380)}},620)};
$('#dayTabs').onclick=e=>{if(e.target.dataset.day!==undefined){day=+e.target.dataset.day;renderPlan()}};
$('#mealList').onclick=e=>{if(e.target.dataset.meal===undefined)return;currentSwap=+e.target.dataset.meal;const meal=plan[day][currentSwap];const options=mealSwapOptions(meal.type,meal.id);$('#swapOptions').innerHTML=options.map(x=>`<button class="swap-option" data-id="${x.id}"><b>${x.name}</b><small>${x.desc}</small></button>`).join('');$('#swapModal').classList.add('open');$('#swapModal').setAttribute('aria-hidden','false')};
$('#swapOptions').onclick=e=>{const button=e.target.closest('[data-id]');if(!button)return;const replacement=[...meals,...Object.entries(swapMeals).flatMap(([type,items])=>items.map(([id,name,desc])=>({id,type,name,desc,...commonSwapMeta})))].find(m=>m.id===button.dataset.id);plan[day][currentSwap]=replacement;$('#closeSwap').click();renderPlan()};$('#closeSwap').onclick=()=>{$('#swapModal').classList.remove('open');$('#swapModal').setAttribute('aria-hidden','true')};
$('#editPlan').onclick=()=>show('details');$('#backPlan').onclick=()=>show('plan');
/* Wellness points: +25 per finished check, max +100 a day. Progress and the
   amount already paid live per account per day in localStorage, so refresh or
   reopen never pays twice. Payment goes through the site-wide maatramAward
   queue into users/{uid}.points (the existing leaderboard score).
   ponytail: device-local record, move to Firestore if rules ever allow a private wellness doc. */
const WL_TARGETS={meals:1,hydration:8,activity:1,sleep:1};
const wlKey=uid=>'maatram_wellness_'+(uid||'guest')+'_'+new Date().toLocaleDateString('en-CA');
const wlLoad=uid=>{try{return JSON.parse(localStorage.getItem(wlKey(uid)))||{}}catch(_){return{}}};
const wlFresh=s=>Object.assign({meals:0,hydration:0,activity:0,sleep:0,paid:0},s);
let wlUid=null,wellnessTrack=wlFresh(wlLoad(null));
const wlSave=()=>{try{localStorage.setItem(wlKey(wlUid),JSON.stringify(wellnessTrack))}catch(_){}};
function updateDailyReward(){
  Object.entries(WL_TARGETS).forEach(([habit,max])=>{const n=Math.min(wellnessTrack[habit],max),button=$(`[data-habit="${habit}"]`);$('#'+habit+'Progress').textContent=`${n} / ${max}`;button.disabled=n>=max;if(n>=max)button.textContent='COMPLETE ✓';button.closest('.habit-card').classList.toggle('done',n>=max);});
  const done=Object.entries(WL_TARGETS).filter(([h,max])=>wellnessTrack[h]>=max).length,earned=done*25,owed=earned-wellnessTrack.paid,status=$('#rewardStatus');
  if(wlUid&&owed>0&&window.maatramAward){wellnessTrack.paid=earned;wlSave();window.maatramAward(owed,`Wellness ${done}/4`);status.classList.remove('bump');void status.offsetWidth;status.classList.add('bump');}
  status.classList.toggle('unlocked',done===4);
  status.innerHTML=!wlUid?`<b>${done} of 4</b> done today. <a href="../login.html">Sign in</a> to earn <b>+25 PTS</b> per check on the leaderboard.`
    :done===4?'✨ Whole routine complete. <b>+100 PTS</b> added to your score today.'
    :done?`<b>${done} of 4</b> done · <b>+${earned} PTS</b> earned today. Next check adds <b>+25</b>.`
    :'Complete a check to earn <b>+25 PTS</b> — up to <b>+100 PTS</b> today.';
}
$$('.habit-card button').forEach(button=>button.onclick=()=>{const habit=button.dataset.habit;if(wellnessTrack[habit]<WL_TARGETS[habit]){wellnessTrack[habit]++;wlSave();}updateDailyReward();});
addEventListener('maatram:user',e=>{const uid=e.detail;if(uid===wlUid)return;let s=wlLoad(uid);if(uid){const g=wlLoad(null);for(const h in WL_TARGETS)s[h]=Math.max(s[h]||0,g[h]||0);try{localStorage.removeItem(wlKey(null))}catch(_){}}wlUid=uid;wellnessTrack=wlFresh(s);wlSave();updateDailyReward();});
updateDailyReward();
$$('.track-card button').forEach(b=>b.onclick=()=>{const card=b.closest('.track-card'),strong=card.querySelector('strong');let [n,max]=strong.textContent.split('/').map(x=>+x.trim());if(n<max)n++;strong.textContent=`${n} / ${max}`;if(n===max){b.textContent='COMPLETE ✓';b.disabled=true;}});
/* Fragment links scroll without changing this single-feature state; buttons keep navigation clean. */
$('#homeOpen').onclick=()=>show('intro');
$$('.nav-action').forEach(button=>button.onclick=()=>{if(!plan.length){show('intro');return}show(button.dataset.screen)});
if(location.hash){history.replaceState(null,'',location.pathname);show('intro');}
if(plan.length){
  renderPlan();
  show('plan');
}
