// Polly 工作台：261A01 自我修復 v3
// 正式 56 堂 syllabus 為 26-1A-01 的唯一課程內容來源；雲端資料套用後立即再修復並同步。
(function(){
  const TARGET='26-1A-01';
  const canonical=code=>String(code||'').trim().toUpperCase().replace(/^(\d{2})-EL-/,'$1-');
  let repairing=false;
  let timer=null;
  let lastSignature='';

  function targetClass(){
    return Array.isArray(window.state?.classes)?state.classes.find(x=>canonical(x.code)===TARGET):null;
  }
  function isBad(l){
    return !String(l?.content||'').trim()||/待補|尚未對應課綱|Syllabus\s*沒有對應內容/i.test(`${l?.unit||''} ${l?.title||''} ${l?.content||''}`);
  }
  function needsRepair(c){
    const lessons=Array.isArray(c?.lessons)?c.lessons:[];
    return lessons.length!==56||lessons.some(isBad);
  }
  function collectDates(c){
    const out=new Map();
    (c?.lessons||[]).forEach(l=>{if(l?.classNo!=null&&l.date)out.set(Number(l.classNo),l.date)});
    (state.records||[]).forEach(r=>{
      if(canonical(r?.importedClassCode)===TARGET&&r?.classNo!=null&&r.date)out.set(Number(r.classNo),r.date);
    });
    return out;
  }
  function rebuildRecords(c){
    state.records=Array.isArray(state.records)?state.records:[];
    state.records=state.records.filter(r=>{
      if(/Suggested\s+Syllabus|Check each box after completing the materials|Elementary Program Level/i.test(String(r?.note||'')))return false;
      if(canonical(r?.importedClassCode)===TARGET&&r?.type==='event')return false;
      return true;
    });
    const time=String(c.schedule||'').match(/(\d{1,2}:\d{2})/)?.[1]||'13:30';
    c.lessons.forEach(l=>{
      if(!l.date)return;
      state.records.push({
        id:`repair-261a01-${l.classNo}`,
        type:'event',date:l.date,time,
        title:`${c.name||'1A'} · Class ${l.classNo}`,
        note:`${l.unit}${l.content?` · ${l.content.slice(0,220)}`:''}`,
        importedClassCode:c.code,classId:c.id,classNo:l.classNo
      });
    });
  }
  function repair(force=false){
    if(repairing)return false;
    try{
      const c=targetClass();
      if(!c||typeof window.Polly261A01Syllabus!=='function')return false;
      const seed=window.Polly261A01Syllabus();
      if(!Array.isArray(seed)||seed.length!==56)return false;
      if(!force&&!needsRepair(c))return false;
      repairing=true;
      const dates=collectDates(c);
      c.lessons=seed.map(l=>({...l,date:dates.get(Number(l.classNo))||l.date||''}));
      rebuildRecords(c);
      const signature=c.lessons.map(l=>`${l.classNo}:${l.date}:${l.content}`).join('|');
      if(signature!==lastSignature){
        lastSignature=signature;
        try{if(typeof saveState==='function')saveState();else localStorage.setItem(KEY,JSON.stringify(state));}catch(e){console.warn(e)}
      }
      try{if(typeof render==='function')render();else if(typeof renderAll==='function')renderAll();}catch(e){}
      return true;
    }catch(e){console.warn('repair 261A01 v3',e);return false;}
    finally{repairing=false;}
  }
  function schedule(delay=80,force=false){clearTimeout(timer);timer=setTimeout(()=>repair(force),delay);}

  // 關鍵：sync-fix 的 applyCloud 會直接把 state 換成雲端資料，所以攔截 render。
  // 每次雲端資料準備顯示前，先把 1A 56 堂正式內容補回 state，再讓畫面 render。
  function hookRender(name){
    const original=window[name];
    if(typeof original!=='function'||original.__polly261RepairHook)return;
    function wrapped(){
      if(!repairing){
        const c=targetClass();
        if(c&&needsRepair(c))repair(true);
      }
      return original.apply(this,arguments);
    }
    wrapped.__polly261RepairHook=true;
    window[name]=wrapped;
  }
  function installHooks(){hookRender('render');hookRender('renderAll');hookRender('renderClasses');}
  [50,200,500,1000,2000,4000,8000].forEach(ms=>setTimeout(()=>{installHooks();repair();},ms));
  window.addEventListener('focus',()=>schedule(100,true));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(100,true)});
  window.addEventListener('storage',()=>schedule(150,true));
  window.addEventListener('polly-data-changed',()=>schedule(100,true));
  console.log('Polly 261A01 repair v3 loaded');
})();