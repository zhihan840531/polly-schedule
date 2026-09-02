// Polly 工作台：教案 / 點名表匯入班級去重 v1
(function(){
  let running=false;
  const norm=s=>String(s??'').trim();
  const canonicalCode=code=>norm(code).toUpperCase().replace(/^(\d{2})-EL-/,'$1-');
  const uniqStrings=a=>[...new Set((a||[]).filter(Boolean).map(x=>typeof x==='string'?x:JSON.stringify(x)))].map(x=>{try{return JSON.parse(x)}catch(e){return x}});
  function studentKey(s){if(typeof s==='string')return s.trim().toLowerCase();return String(s?.id||s?.english||s?.chinese||s?.name||'').trim().toLowerCase();}
  function mergeArray(target,source,kind){const out=Array.isArray(target)?[...target]:[];const seen=new Set(out.map(x=>kind==='student'?studentKey(x):JSON.stringify(x)));for(const x of (Array.isArray(source)?source:[])){const k=kind==='student'?studentKey(x):JSON.stringify(x);if(k&&!seen.has(k)){out.push(x);seen.add(k)}}return out;}
  function richness(c){let n=0;for(const [k,v] of Object.entries(c||{})){if(k==='id'||k==='code')continue;if(Array.isArray(v))n+=v.length*3;else if(v!==null&&v!==undefined&&String(v).trim()!=='')n++;}return n;}
  function mergeClass(a,b){
    // 優先保留沒有 EL 前綴的正式班級；若兩者相同則保留資料較完整者。
    let keep=a,drop=b;const aEL=/^\d{2}-EL-/i.test(norm(a.code)),bEL=/^\d{2}-EL-/i.test(norm(b.code));
    if(aEL&&!bEL){keep=b;drop=a;} else if(aEL===bEL&&richness(b)>richness(a)){keep=b;drop=a;}
    for(const [k,v] of Object.entries(drop)){
      if(k==='id'||k==='code')continue;
      if(Array.isArray(v)){
        if(k==='studentDetails'||k==='students')keep[k]=mergeArray(keep[k],v,'student');
        else keep[k]=mergeArray(keep[k],v,'generic');
      } else if((keep[k]===undefined||keep[k]===null||keep[k]==='')&&v!==undefined&&v!==null&&v!=='') keep[k]=v;
    }
    // 若 EL 那筆有課程／教案資料，而正式班已有同欄位，以陣列合併；其他欄位不覆蓋正式班。
    keep.code=canonicalCode(keep.code||drop.code);
    if(/^\d{2}-EL-/i.test(norm(keep.code)))keep.code=canonicalCode(keep.code);
    return {keep,drop};
  }
  function run(){
    if(running)return;running=true;
    try{
      if(typeof state==='undefined'||!state||!Array.isArray(state.classes))return;
      const groups=new Map();
      for(const c of state.classes){const code=canonicalCode(c.code);if(!code)continue;if(!groups.has(code))groups.set(code,[]);groups.get(code).push(c);}
      let changed=false;
      for(const [code,list] of groups){
        if(list.length<2)continue;
        // 只處理至少一筆是 EL 前綴，避免誤合併真正不同但同代碼的資料。
        if(!list.some(c=>/^\d{2}-EL-/i.test(norm(c.code))))continue;
        let keep=list[0];
        for(let i=1;i<list.length;i++){const m=mergeClass(keep,list[i]);keep=m.keep;const drop=m.drop;state.classes=state.classes.filter(x=>x!==drop);changed=true;}
        keep.code=code;
      }
      if(changed){
        try{if(typeof persist==='function')persist();else if(typeof saveState==='function')saveState();}catch(e){}
        try{if(typeof renderClasses==='function')renderClasses();}catch(e){}
        window.dispatchEvent(new Event('polly-data-changed'));
      }
    } finally {running=false;}
  }
  window.PollyClassCanonicalCode=canonicalCode;
  window.PollyDedupeClasses=run;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,350));else setTimeout(run,350);
  window.addEventListener('polly-data-changed',()=>setTimeout(run,80));
})();