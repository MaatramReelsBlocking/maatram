/* MAATRAM Wellness: client-side prototype. Persist profile/trackers through the existing authenticated user store in production. */
const profile={age:null,height:null,weight:null,goal:null,activity:null,diet:null,avoid:[],other:''};
/* Meal catalogue. Every dish is a normal Indian home/canteen meal a student can actually get.
   Row: [id, name, description, diet, allergens, goals, badge]
   diet: vg vegan · v vegetarian (dairy ok) · e has egg · n has meat/fish
   allergens: d dairy · e eggs · n nuts/peanuts · g gluten (wheat, rava, oats, bread) · s soy
   goals: g gain · m muscle · f fitness · b balanced · h habits · w manage weight · * all
   badge: P protein-rich · E energy-rich · L light */
const MEAL_ROWS={
 Breakfast:[
  ['idli','Idli + sambar + coconut chutney','Soft, steamed and easy on a school morning.','vg','','*','L'],
  ['pesarattu','Pesarattu + ginger chutney','Andhra’s crispy green-moong dosa, packed with protein.','vg','','*','P'],
  ['ragi-dosa','Ragi dosa + peanut chutney','Crisp finger-millet dosa, rich in calcium.','vg','n','gfbhw',''],
  ['besan-chilla','Veggie besan chilla + mint chutney','Savoury gram-flour pancakes loaded with vegetables.','vg','','*','P'],
  ['moong-chilla-paneer','Moong chilla stuffed with paneer','Two protein sources in one crispy roll.','v','d','mfbw','P'],
  ['kanda-poha','Kanda poha with peanuts + lemon','Mumbai’s favourite light breakfast with a crunch.','vg','n','bhfw','L'],
  ['millet-pongal','Millet pongal + sambar','Warm, peppery comfort food made with millets.','v','dn','*',''],
  ['veg-upma','Vegetable upma + orange','Quick rava breakfast with colourful vegetables.','vg','g','bhfw','L'],
  ['masala-oats','Masala vegetable oats','Savoury oats cooked like upma, ready in 8 minutes.','vg','g','bhfw','L'],
  ['overnight-oats','Overnight oats with curd, banana & chia','No-cook jar you make the night before.','v','dg','gmfb','E'],
  ['paneer-paratha','Paneer paratha + curd','Stuffed, filling and protein-rich.','v','dg','gmf','P'],
  ['thalipeeth','Thalipeeth + curd','Maharashtrian multigrain flatbread with a tangy dip.','v','dg','bhfwg',''],
  ['idiyappam-stew','Idiyappam + vegetable stew','Kerala string hoppers in mild coconut stew.','vg','','bhfwg','L'],
  ['khaman','Khaman dhokla + green chutney','Fluffy, steamed and protein-containing Gujarati classic.','vg','','bhfw','L'],
  ['egg-bhurji','Masala egg bhurji + whole-wheat toast','Spicy scrambled eggs in 10 minutes.','e','eg','mgfb','P'],
  ['veg-omelette','Vegetable omelette + roti + fruit','Eggs, greens and a fruit to finish.','e','eg','mfbwh','P'],
  ['appam-egg','Appam + egg curry','Lacy rice pancakes with a spiced egg curry.','e','e','gmfb','P'],
  ['tofu-bhurji','Tofu bhurji + multigrain toast','Plant-protein scramble with onion and tomato.','vg','sg','mfbw','P'],
  ['keema-sandwich','Chicken keema sandwich','Lean minced chicken in whole-wheat bread.','n','g','mgf','P'],
  ['smoothie-bowl','Banana-peanut smoothie bowl with oats','Thick, sweet and energy-dense without added sugar.','v','dng','gmf','E']
 ],
 'Mid-morning':[
  ['chana-guava','Roasted chana + guava','Crunchy protein and vitamin C between classes.','vg','','*','P'],
  ['sprouts-chaat','Sprouts chaat + lemon','Tangy moong sprouts with onion and tomato.','vg','','*','P'],
  ['fruit-chaat','Fruit chaat with chaat masala','Seasonal fruit with a spicy twist.','vg','','bhfw','L'],
  ['banana-milk','Banana + dates milkshake','Naturally sweet energy top-up.','v','d','gm','E'],
  ['buttermilk-makhana','Spiced buttermilk + roasted makhana','Cool, light and crunchy.','v','d','bhfw','L'],
  ['chikki-orange','Peanut chikki + orange','A traditional jaggery bar with a juicy fruit.','vg','n','gmf','E'],
  ['boiled-eggs','2 boiled eggs with pepper','Portable protein that keeps you full.','e','e','mfwb','P'],
  ['curd-pomegranate','Curd + pomegranate','Cool, tangy and gut-friendly.','v','d','*',''],
  ['coconut-papaya','Coconut water + papaya','Hydration plus a sweet, light fruit.','vg','','bhfw','L'],
  ['soy-milk-banana','Soy milk + banana','Plant protein and quick carbs.','vg','s','gmf','P'],
  ['trail-mix','Nut & seed mix (a small handful) + raisins','Almonds, peanuts, pumpkin seeds: dense energy.','vg','n','gmfb','E'],
  ['sweet-potato-chaat','Sweet potato chaat + lime','Warm, sweet and satisfying.','vg','','*','']
 ],
 Lunch:[
  ['rajma','Rajma chawal + onion salad','Punjabi comfort food with fibre-rich plant protein.','vg','','gmfbh','P'],
  ['chole-rice','Chole + jeera rice + cucumber','Hearty chickpea curry with fragrant rice.','vg','','gmfbh','P'],
  ['sambar-rice','Sambar rice + beans poriyal + curd','A complete South Indian plate.','v','d','*',''],
  ['dal-tadka','Dal tadka + roti + bhindi sabzi','Everyday North Indian balance.','vg','g','*',''],
  ['kerala-meals','Rice + avial + sambar + thoran','Kerala sadya-style plate full of vegetables.','v','d','bhfwg',''],
  ['bisi-bele','Bisi bele bath + raita','Karnataka’s spiced rice-lentil one-pot.','v','dn','bhfg',''],
  ['millet-kadhi','Millet khichdi + kadhi','Gentle, tangy and easy on the stomach.','v','d','bhw','L'],
  ['soya-pulao','Veg pulao + soya chunk curry','Big plant protein boost in a family favourite.','vg','s','gmfb','P'],
  ['palak-paneer','Palak paneer + roti + salad','Iron-rich greens with soft paneer.','v','dg','gmfbw','P'],
  ['paneer-roll','Paneer tikka roll (whole-wheat wrap)','Smoky paneer, onions and mint in a wrap.','v','dg','gmf','P'],
  ['lemon-rice-sundal','Lemon rice + chana sundal','Bright, tangy and easy to pack.','vg','n','bhfg',''],
  ['curd-rice','Curd rice + pomegranate + carrot','Cool and calming on hot days.','v','d','bhw','L'],
  ['egg-curry-rice','Egg curry + rice + salad','Two eggs in a homestyle masala.','e','e','gmfbh','P'],
  ['chicken-plate','Grilled chicken + jeera rice + dal','Lean protein plate for training days.','n','d','mfgbw','P'],
  ['chicken-biryani','Homestyle chicken biryani + raita','A weekend favourite with enough protein.','n','d','gmf','E'],
  ['kala-chana-rice','Kala chana curry + rice + salad','Black chickpeas in a tangy masala, high in fibre.','vg','','gmfbh','P'],
  ['veg-biryani','Vegetable biryani + kachumber','Fragrant rice layered with vegetables.','v','d','gbhf','E'],
  ['moong-jowar','Moong dal + jowar roti + aloo gobi','Millet roti twist on a North Indian plate.','vg','','bhfw',''],
  ['fish-curry','Fish curry + rice + vegetables','Coastal classic with omega-3 rich fish.','n','','gmfbw','P']
 ],
 Evening:[
  ['corn-chaat','Sweet corn chaat + lime','Quick, colourful and satisfying.','vg','','bhfw','L'],
  ['masala-makhana','Masala makhana','Roasted fox nuts, the perfect study snack.','vg','','bhfw','L'],
  ['peanut-chaat','Peanut chaat + banana','Affordable energy between tasks.','vg','n','gmf','E'],
  ['chana-sundal','Chana sundal with coconut','Chennai beach-style chickpea snack.','vg','','*','P'],
  ['sprout-bhel','Sprouts bhel puri','Crisp puffed rice with sprouts and chutney.','vg','','bhfw',''],
  ['ragi-malt','Ragi malt with milk','Warm finger-millet drink, rich in calcium.','v','d','gmfb','E'],
  ['paneer-tikka','Paneer tikka bites + mint dip','Grilled, smoky and protein-rich.','v','d','gmf','P'],
  ['egg-sandwich','Egg & veggie sandwich','Filling post-sport snack.','e','eg','gmf','P'],
  ['hummus-sticks','Hummus + carrot & cucumber sticks','Creamy chickpea dip with crunchy veg.','vg','','bhfw','L'],
  ['sweet-potato-wedges','Roasted sweet potato wedges','A warm after-school snack.','vg','','*',''],
  ['pb-toast','Peanut butter banana toast','Fast fuel before practice.','vg','ng','gmf','E'],
  ['chicken-tikka','Chicken tikka skewers','Grilled, high-protein evening bite.','n','d','gmfw','P']
 ],
 Dinner:[
  ['roti-dal','Roti + dal + mixed veg sabzi','A reliable balanced dinner.','vg','g','*',''],
  ['veg-khichdi','Vegetable khichdi + curd','Comforting and easy to digest.','v','d','bhwf','L'],
  ['jowar-palak','Jowar roti + palak dal','Millet roti with iron-rich spinach dal.','vg','','bhfw',''],
  ['ragi-mudde','Ragi mudde + sambar','Karnataka’s finger-millet balls, very filling.','vg','','bhfwg',''],
  ['dalia-khichdi','Vegetable dalia khichdi','Broken-wheat one-pot, light at night.','vg','g','bhw','L'],
  ['masoor-lauki','Masoor dal + rice + lauki sabzi','Simple, light and homely.','vg','','bhw','L'],
  ['paneer-stirfry','Paneer veg stir-fry + roti','Quick, colourful and protein-rich.','v','dg','gmfb','P'],
  ['soya-masala','Soya chunk masala + rice','Plant protein that tastes like a treat.','vg','s','gmf','P'],
  ['tofu-rice','Tofu vegetable fried rice','Indo-Chinese favourite, made at home.','vg','sg','gmfb','P'],
  ['egg-bhurji-roti','Egg bhurji + roti + salad','Fast, filling dinner after a long day.','e','eg','gmfbw','P'],
  ['chicken-roti','Chicken curry + roti + salad','Homestyle curry for recovery.','n','g','gmf','P'],
  ['tawa-fish','Tawa fish + rice + beans','Pan-grilled fish with simple sides.','n','','mfbw','P'],
  ['chicken-stew','Chicken stew + appam','Kerala-style mild coconut stew.','n','','gmfb','P'],
  ['rajma-roti','Rajma + roti + kachumber','Protein-rich and comforting.','vg','g','gmfb','P'],
  ['dosa-sambar','Dosa + sambar + tomato chutney','Crispy, light and always a favourite.','vg','','bhfwg','L'],
  ['chana-rice','Chana masala + red rice','Red rice adds fibre to a classic curry.','vg','','gmfb','P'],
  ['mixed-dal-rice','Mixed dal + rice + cabbage poriyal','Three dals for a fuller protein mix.','vg','','*','']
 ]
};
const DIETS={vg:['vegan','vegetarian','eggs','nonveg','any'],v:['vegetarian','eggs','nonveg','any'],e:['eggs','nonveg','any'],n:['nonveg','any']};
const ALLERGEN={d:'dairy',e:'eggs',n:'nuts',g:'gluten',s:'soy'},GOAL={g:'gain',m:'muscle',f:'fitness',b:'balanced',h:'habits',w:'manage'};
const meals=Object.entries(MEAL_ROWS).flatMap(([type,rows])=>rows.map(([id,name,desc,diet,alg,goals,badge])=>({id,type,name,desc,badge,diets:DIETS[diet],allergens:[...alg].map(c=>ALLERGEN[c]),goals:goals==='*'?Object.values(GOAL):[...goals].map(c=>GOAL[c])})));
/* Free-text "anything else to avoid": comma-separated terms matched against meal name/description. */
const avoidTerms=()=>String(profile.other||'').toLowerCase().split(',').map(t=>t.trim()).filter(Boolean);
const okTerms=m=>{const text=(m.name+' '+m.desc).toLowerCase();return !avoidTerms().some(t=>text.includes(t));};
const fits=m=>m.diets.includes(profile.diet)&&!m.allergens.some(a=>profile.avoid.includes(a));
/* Swap list: up to 8 options, goal matches first, skipping what is already on today's plate. */
const mealSwapOptions=(type,currentId)=>{const today=new Set(plan[day].map(m=>m.id)),list=meals.filter(m=>m.type===type&&m.id!==currentId&&!today.has(m.id)&&fits(m)),pick=l=>[...l.filter(m=>m.goals.includes(profile.goal)),...l.filter(m=>!m.goals.includes(profile.goal))];const ok=list.filter(okTerms);return pick(ok.length?ok:list).slice(0,8);};
const BADGE={P:'PROTEIN-RICH',E:'ENERGY-RICH',L:'LIGHT'};
/* Daily guide. Sources: ICMR-NIN RDA 2020 (protein 0.83 g/kg adults, ~0.85–0.88 g/kg at 13–18),
   ICMR-NIN Dietary Guidelines 2024 / My Plate for the Day (2000 kcal reference: 400 g veg, 100 g fruit,
   300 ml milk/curd, 35 g nuts & seeds, 27 g oil; sugar 25 g, salt under 5 g; 8–10 glasses water; no protein
   supplements), ISSN 2017 and youth-sport reviews (1.3–1.8 g/kg for training; ICMR: no extra gain above 1.6).
   Teens get no weight targets or calorie numbers (AAP 2023: self-guided dieting raises disordered-eating risk). */
function guide(){
  const {age,height,weight,goal,activity}=profile,adult=age>=18,active=activity==='moderate'||activity==='very';
  const rda=age<16?0.88:age<18?0.85:0.83;
  /* adults above BMI 23 (Asian Indian cut-off): use the weight at BMI 23, so the range doesn't inflate */
  const kg=adult?Math.min(weight,23*(height/100)**2):weight;
  const [lo,hi]=goal==='muscle'?[adult?1.4:1.3,1.6]:(goal==='fitness'||goal==='gain')&&active?[1.1,1.4]:goal==='gain'?[1,1.2]:[rda,1];
  const r5=x=>Math.round(x/5)*5,protein=`${r5(kg*lo)}–${Math.max(r5(kg*hi),r5(kg*lo)+5)} g`;
  const water=activity==='very'?'10–12 glasses':'8–10 glasses';
  const tips={
    gain:['Add a 6th mini-meal: milk, banana, peanut chikki or a nut-and-seed mix.','Bigger portion of rice, roti or millets at lunch and dinner.','Strength training helps the extra food become muscle, not just fat.'],
    muscle:['Spread protein across all 5 meals instead of one big serving.','Eat a protein + carb snack within an hour after training.','Food first: ICMR advises against protein powders; dal, curd, eggs, paneer, soya cover it.'],
    fitness:['Eat a carb snack 1–2 hours before sport (banana, poha, idli).','Drink before you feel thirsty on training days.','Keep rice, roti or millets in every main meal for steady energy.'],
    balanced:['Half your plate vegetables, a quarter grains, a quarter dal/eggs/paneer/meat.','Switch some white rice or maida for millets like ragi and jowar.','Fruit whole, not as juice.'],
    habits:['Same meal times every day make the rhythm easy.','Pack your mid-morning snack the night before.','Swap a meal anytime; consistency matters more than perfection.'],
    manage:['Never skip meals: skipping leads to overeating later.','Fill half the plate with vegetables first.','Cut sugary drinks, fried snacks and packaged chips before cutting food.']
  }[goal];
  let note='';
  if(adult){const bmi=weight/(height/100)**2;
    if(goal==='manage'&&bmi<18.5)note='Your weight is already on the low side for your height, so this plan keeps full portions. A dietitian can help if you still want to change your weight.';
    if(goal==='gain'&&bmi>=23)note='Your weight is already above the healthy range for your height (Asian Indian cut-offs), so this plan focuses on balanced portions rather than eating extra.';
  }else if(goal==='manage'||goal==='gain')note='You are still growing, so there are no weight targets here: regular meals, movement and sleep do the work. Talk to a doctor or dietitian before trying to change your weight.';
  return {protein,water,tips,note};
}
const goalCopy={gain:['Nourish your momentum.','Energy-rich meals with regular snacks help you keep up with school, sport and life.'],muscle:['Fuel. Move. Recover.','Protein-containing meals, carbohydrates and rest work together.'],fitness:['Move with steady energy.','Balanced meals designed to support everyday activity.'],balanced:['A better plate rhythm.','Simple, familiar meals that help make balance repeatable.'],habits:['Keep it easy to repeat.','A reliable rhythm beats a perfect day.'],manage:['Feel steady and satisfied.','Balanced meals and consistent routines—never skipping meals.']};
let day=0,plan=[],currentSwap=null,swapReturn=null;

/* Storage can be blocked (privacy mode, disabled cookies) or hold bad JSON: never let that stop the page. */
try{
  const savedProfile=localStorage.getItem('maatramWellnessProfile');
  if(savedProfile) Object.assign(profile,JSON.parse(savedProfile));
}catch(_){}
try{
  const savedPlan=JSON.parse(localStorage.getItem('maatramWellnessPlan'));
  if(Array.isArray(savedPlan)&&savedPlan.every(Array.isArray)) plan=savedPlan;
}catch(_){}
const savePlan=()=>{try{localStorage.setItem('maatramWellnessPlan',JSON.stringify(plan))}catch(_){}};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduceMotion=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(_){return false}};
function show(id){$$('.screen').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active');window.scrollTo({top:0,behavior:reduceMotion()?'auto':'smooth'});}
/* Goal-matched meals first, topped up with other compatible meals so a week has 7 different dishes where possible; free-text avoid terms apply, unless they would empty the slot. */
function eligible(type){const base=meals.filter(m=>m.type===type&&fits(m)),pick=l=>{const g=l.filter(m=>m.goals.includes(profile.goal));return [...g,...l.filter(m=>!g.includes(m))].slice(0,Math.max(g.length,7));},ok=base.filter(okTerms);return pick(ok.length?ok:base);}
/* A deterministic profile seed keeps one person's week stable; consecutive days step through the list so a dish repeats at most once a week when the list is long enough. */
function buildPlan(){const types=['Breakfast','Mid-morning','Lunch','Evening','Dinner'];const seed=Math.round(profile.age*3+profile.height/7+profile.weight)+{inactive:0,light:1,moderate:2,very:3}[profile.activity];plan=Array.from({length:7},(_,i)=>types.map((type,j)=>{const list=eligible(type);return list[(seed+i+j*3)%list.length]||{type,name:'Seasonal vegetables + rice/roti',desc:'A flexible meal based on what is available.'};}));}
function renderPlan(){const [title,copy]=goalCopy[profile.goal];$('#planSummary').textContent=`A 7-day ${{gain:'weight-gain',muscle:'muscle-building',fitness:'fitness',balanced:'balanced-eating',habits:'healthy-habits',manage:'weight-management'}[profile.goal]} plan shaped around your age, weight and ${profile.activity.replace('inactive','mostly inactive')} routine.`;$('#goalTag').textContent=profile.goal.toUpperCase();$('#missionTitle').textContent=title;$('#missionCopy').textContent=copy;const G=guide();$('#safetyNote').textContent=(G.note?G.note+' ':'')+(profile.age<18?'For growing bodies, this plan keeps the focus on regular balanced meals, energy, movement, sleep and recovery—not weight targets or restriction. For allergies, health concerns or growth questions, check with a qualified dietitian or healthcare professional.':'General wellness guidance only—not medical nutrition care. For allergies, medical conditions or specialist dietary needs, speak with a qualified dietitian or healthcare professional.');$('#dayTabs').innerHTML=plan.map((_,i)=>`<button class="${i===day?'selected':''}" data-day="${i}">DAY ${i+1}</button>`).join('');$('#dayTitle').textContent=`DAY ${day+1}`;$('#mealList').innerHTML=plan[day].map((m,i)=>`<div class="meal-row"><span class="meal-type">${m.type.toUpperCase()}</span><div><b>${m.name}</b>${m.badge?`<em class="meal-badge">${BADGE[m.badge]}</em>`:''}<p>${m.desc}</p></div><button class="swap" data-meal="${i}">SWAP ↻</button></div>`).join('');$('#dailyGuide').innerHTML=`<div><p class="eyebrow">YOUR DAILY GUIDE</p><h3>What a good day <em>looks like.</em></h3><p>Worked out from your age, weight, goal and activity using ICMR-NIN guidelines for Indians.</p></div><div class="guide-grid"><article><span>PROTEIN</span><b>${G.protein}</b><small>a day, from dal, curd, eggs, paneer, soya, fish or chicken. No powders needed.</small></article><article><span>WATER</span><b>${G.water}</b><small>a day, more on hot or sports days.</small></article><article><span>VEG + FRUIT</span><b>5 servings</b><small>about 400 g vegetables and 100 g fruit (ICMR My Plate).</small></article><article><span>KEEP LOW</span><b>Sugar · salt · oil</b><small>added sugar under 25 g, salt under 5 g (1 tsp), oil about 5–6 tsp.</small></article></div><ul class="guide-tips">${G.tips.map(t=>`<li>${t}</li>`).join('')}</ul>`;}
function validateDetails(){profile.age=+$('#age').value;profile.height=+$('#height').value;profile.weight=+$('#weight').value;if(profile.age<13||profile.age>100||profile.height<100||profile.height>250||profile.weight<25||profile.weight>300){$('#detailError').textContent='Enter an age, height and weight within the shown ranges.';return false}$('#detailError').textContent='';return true;}
function toNext(id){if(id==='goal'&&!validateDetails())return;if(id==='activity'&&!profile.goal){$('#goalHint').textContent='CHOOSE A GOAL TO CONTINUE';return}if(id==='preferences'&&!profile.activity){$('#activityHint').textContent='CHOOSE AN ACTIVITY LEVEL TO CONTINUE';return}show(id)}
$$('[data-next]').forEach(b=>b.onclick=()=>toNext(b.dataset.next));$$('[data-back]').forEach(b=>b.onclick=()=>show(b.dataset.back));$$('[data-exit]').forEach(b=>b.onclick=()=>show('intro'));
$$('[data-choice] button').forEach(b=>b.onclick=()=>{const parent=b.closest('[data-choice]');parent.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');profile[parent.dataset.choice]=b.dataset.value;if(parent.dataset.choice==='goal')$('#goalHint').textContent='GOAL LOCKED IN';if(parent.dataset.choice==='activity')$('#activityHint').textContent='ACTIVITY LEVEL SAVED';});
$('#dietChips').querySelectorAll('button').forEach(b=>b.onclick=()=>{$$('#dietChips button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');profile.diet=b.dataset.value;$('#preferenceHint').textContent='PREFERENCE SAVED';});
$('#avoidChips').querySelectorAll('button').forEach(b=>b.onclick=()=>{b.classList.toggle('selected');profile.avoid=$$('#avoidChips button.selected').map(x=>x.dataset.value);});
$('#generate').onclick=()=>{if(!profile.diet){$('#preferenceHint').textContent='PICK A FOOD PREFERENCE FIRST';return}profile.other=$('#otherAvoid').value.trim();show('loading');let lines=['Checking your preferences...','Building familiar meal options...','Keeping your plan practical...'];let n=0;let interval=setInterval(()=>{$('#loadingLine').textContent=lines[++n]||'Your plan is ready.';if(n>=lines.length){clearInterval(interval);buildPlan();try{localStorage.setItem('maatramWellnessProfile',JSON.stringify(profile))}catch(_){}savePlan();renderPlan();setTimeout(()=>show('plan'),380)}},620)};
$('#dayTabs').onclick=e=>{if(e.target.dataset.day!==undefined){day=+e.target.dataset.day;renderPlan()}};
$('#mealList').onclick=e=>{if(e.target.dataset.meal===undefined)return;currentSwap=+e.target.dataset.meal;const meal=plan[day][currentSwap];const options=mealSwapOptions(meal.type,meal.id);$('#swapOptions').innerHTML=options.map(x=>`<button class="swap-option" data-id="${x.id}"><b>${x.name}</b>${x.badge?`<em class="meal-badge">${BADGE[x.badge]}</em>`:''}<small>${x.desc}</small></button>`).join('');swapReturn=e.target;$('#swapModal').classList.add('open');$('#swapModal').setAttribute('aria-hidden','false');($('#swapOptions button')||$('#closeSwap')).focus()};
$('#swapOptions').onclick=e=>{const button=e.target.closest('[data-id]');if(!button)return;const replacement=meals.find(m=>m.id===button.dataset.id);plan[day][currentSwap]=replacement;savePlan();swapReturn=null;$('#closeSwap').click();renderPlan();const again=$(`#mealList [data-meal="${currentSwap}"]`);if(again)again.focus()};$('#closeSwap').onclick=()=>{$('#swapModal').classList.remove('open');$('#swapModal').setAttribute('aria-hidden','true');if(swapReturn&&swapReturn.isConnected)swapReturn.focus();swapReturn=null};
/* Dialog keyboard: Esc closes, Tab stays inside while open. */
$('#swapModal').addEventListener('keydown',e=>{if(!$('#swapModal').classList.contains('open'))return;if(e.key==='Escape'){e.preventDefault();$('#closeSwap').click();return}if(e.key!=='Tab')return;const f=$$('#swapModal button');if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
$('#swapModal').addEventListener('click',e=>{if(e.target===$('#swapModal'))$('#closeSwap').click()});
$('#editPlan').onclick=()=>show('details');
/* Wellness points: +25 per finished check, max +100 a day. Progress and the
   amount already paid live per account per day in localStorage, so refresh or
   reopen never pays twice. Payment goes through the site-wide maatramAward
   queue into users/{uid}.points (the existing leaderboard score).
   ponytail: device-local record, move to Firestore if rules ever allow a private wellness doc. */
const WL_TARGETS={meals:1,hydration:8,activity:1,sleep:1};
const wlToday=()=>new Date().toLocaleDateString('en-CA');
const wlKey=uid=>'maatram_wellness_'+(uid||'guest')+'_'+wlToday();
const wlLoad=uid=>{try{return JSON.parse(localStorage.getItem(wlKey(uid)))||{}}catch(_){return{}}};
const wlFresh=s=>Object.assign({meals:0,hydration:0,activity:0,sleep:0,paid:0},s);
let wlUid=null,wlDay=wlToday(),wellnessTrack=wlFresh(wlLoad(null));
const wlSave=()=>{try{localStorage.setItem(wlKey(wlUid),JSON.stringify(wellnessTrack))}catch(_){}};
/* Bring memory up to date with the saved record: a new day starts from today's
   record (never yesterday's state under today's key), and progress or payment
   made in another tab is kept (max of saved and in-memory values). */
function wlSync(){
  if(wlDay!==wlToday()){wlDay=wlToday();wellnessTrack=wlFresh(wlLoad(wlUid));return;}
  const saved=wlLoad(wlUid);
  for(const h of [...Object.keys(WL_TARGETS),'paid'])wellnessTrack[h]=Math.max(+saved[h]||0,+wellnessTrack[h]||0);
}
function updateDailyReward(award=true){
  wlSync();
  Object.entries(WL_TARGETS).forEach(([habit,max])=>{const n=Math.min(wellnessTrack[habit],max),button=$(`[data-habit="${habit}"]`);$('#'+habit+'Progress').textContent=`${n} / ${max}`;button.disabled=n>=max;if(n>=max)button.textContent='COMPLETE ✓';button.closest('.habit-card').classList.toggle('done',n>=max);});
  const done=Object.entries(WL_TARGETS).filter(([h,max])=>wellnessTrack[h]>=max).length,earned=done*25,owed=earned-wellnessTrack.paid,status=$('#rewardStatus');
  if(award&&wlUid&&owed>0&&window.maatramAward){wellnessTrack.paid=earned;wlSave();window.maatramAward(owed,`Wellness ${done}/4`);status.classList.remove('bump');void status.offsetWidth;status.classList.add('bump');}
  status.classList.toggle('unlocked',done===4);
  status.innerHTML=!wlUid?`<b>${done} of 4</b> done today. <a href="../login.html">Sign in</a> to earn <b>+25 PTS</b> per check on the leaderboard.`
    :done===4?'✨ Whole routine complete. <b>+100 PTS</b> added to your score today.'
    :done?`<b>${done} of 4</b> done · <b>+${earned} PTS</b> earned today. Next check adds <b>+25</b>.`
    :'Complete a check to earn <b>+25 PTS</b> — up to <b>+100 PTS</b> today.';
}
$$('.habit-card button').forEach(button=>button.onclick=()=>{const habit=button.dataset.habit;wlSync();if(wellnessTrack[habit]<WL_TARGETS[habit]){wellnessTrack[habit]++;wlSave();}updateDailyReward();});
addEventListener('maatram:user',e=>{const uid=e.detail;if(uid===wlUid)return;let s=wlLoad(uid);if(uid){const g=wlLoad(null);for(const h in WL_TARGETS)s[h]=Math.max(s[h]||0,g[h]||0);try{localStorage.removeItem(wlKey(null))}catch(_){}}wlUid=uid;wlDay=wlToday();wellnessTrack=wlFresh(s);wlSave();updateDailyReward();});
/* Another tab changed today's record: show its progress here; only the tab that made a check pays for it. */
addEventListener('storage',e=>{if(e.key===wlKey(wlUid))updateDailyReward(false);});
/* Page left open past midnight: show a fresh day when the tab is looked at again. */
const wlRollover=()=>{if(wlDay!==wlToday())updateDailyReward(false);};
addEventListener('focus',wlRollover);document.addEventListener('visibilitychange',()=>{if(!document.hidden)wlRollover();});
updateDailyReward();
if(location.hash){history.replaceState(null,'',location.pathname);show('intro');}
if(plan.length){
  renderPlan();
  show('plan');
}
