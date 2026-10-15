/* Exercises api/link.js with a fake Firestore (no network). */
let pass=0,fail=0;
const ok=(n,c)=>{ c?pass++:fail++; console.log((c?'PASS ':'FAIL ')+n); };
const db={};
global.fetch=async(url,o={})=>{
  const code=url.match(/links\/(\w+)/)[1], doc=db[code];
  if(o.method==='PATCH'){ const f=JSON.parse(o.body).fields;
    if(doc && +doc.end.integerValue>Date.now() && +f.end.integerValue<+doc.end.integerValue) return {ok:false,status:403,text:async()=>'rules'};
    db[code]=f; return {ok:true,status:200}; }
  return doc?{ok:true,status:200,json:async()=>({fields:doc})}:{ok:false,status:404};
};
const handler=require('./api/link.js');
let ip=0;
const call=(method,{query={},body,throwBody}={})=>new Promise(done=>{
  const req={method,url:'/api/link?'+new URLSearchParams(query),headers:{'x-forwarded-for':'10.0.0.'+(ip++)}};
  Object.defineProperty(req,'body',{get(){ if(throwBody) throw new SyntaxError('Invalid JSON'); return body; }});
  const res={setHeader(){},status(s){this.s=s;return this;},json(j){done({s:this.s,j});},end(){done({s:this.s});}};
  handler(req,res);
});
(async()=>{
  ok('GET bad code is 400',           (await call('GET',{query:{code:'nope'}})).s===400);
  ok('GET unknown code is no lock',   (await call('GET',{query:{code:'ABCD2345'}})).j.end===0);
  ok('POST invalid JSON is 400',      (await call('POST',{throwBody:true})).s===400);
  ok('POST null body is 400',         (await call('POST',{body:'null'})).s===400);
  ok('POST minutes 91 is 400',        (await call('POST',{body:{code:'ABCD2345',minutes:91}})).s===400);
  const a=await call('POST',{body:{code:'abcd2345',minutes:30,by:'phone'}});
  ok('POST starts a lock',            a.s===200 && a.j.by==='phone' && a.j.end>Date.now());
  ok('GET sees the lock',             (await call('GET',{query:{code:'ABCD2345'}})).j.minutes===30);
  ok('POST shorter lock is 409',      (await call('POST',{body:{code:'ABCD2345',minutes:10}})).s===409);
  ok('POST longer lock extends',      (await call('POST',{body:{code:'ABCD2345',minutes:60}})).s===200);
  ok('POST unknown "by" becomes web', (await call('POST',{body:{code:'WXYZ2345',minutes:5,by:'x'}})).j.by==='web');
  ok('POST from the Windows app keeps "pc"', (await call('POST',{body:{code:'PCPC2345',minutes:5,by:'pc'}})).j.by==='pc');
  ok('OPTIONS is 204',                (await call('OPTIONS')).s===204);
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
})();
