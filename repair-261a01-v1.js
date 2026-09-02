// Polly 工作台：261A01 自我修復 v2
// 以正式 56 堂 syllabus seed 修復舊的「待補」資料，並在雲端同步後再次檢查。
(function(){
  const canonical=code=>String(code||'').trim().toUpperCase().replace(/^(\d{2})-EL-/,'$1-');
  let repairing=false;
  let timer=null;

  function needsRepair(c){
    const lessons=Array.isArray(c?.lessons)?c.lessons:[];
    if(lessons.length!==56)return true;
    return lessons.some(l=>!String(l?.content||'').trim()||/待補|尚未對應課綱|Syllabus 沒有對應內容/i.test(`${l?.unit||''} ${l?.title||''} ${l?.content||''}`));
  }

  function repair(){
    if(repairing)return;
    try{
      if(!window.state||!Array.isArray(state.classes)||typeof window.Polly261A01Syllabus!=='function')return;
      repairing=true;
      let changed=false;
      const c=state.classes.find(x=>canonical(x.code)==='26-1A-01');
      if(c&&needsRepair(c)){
        const old=Array.isArray(c.lessons)?c.lessons:[];
        const dateByClass=new Map();
        old.forEach(l=>{if(l&&l.classNo!=null&&l.date)dateByClass.set(Number(l.classNo),l.date)});
        (state.records||[]).forEach(r=>{
          if(canonical(r.importedClassCode)==='26-1A-01'&&r.classNo!=null&&r.date)dateByClass.set(Number(r.classNo),r.date);
        });
        const seed=window.Polly261A01Syllabus();
        if(seed.length===56){
          c.lessons=seed.map(l=>({...l,date:dateByClass.get(Number(l.classNo))||l.date||''}));
          state.records=Array.isArray(state.records)?state.records:[];
          state.records=state.records.filter(r=>!(canonical(r.importedClassCode)==='26-1A-01'&&r.type==='event'));
          const time=String(c.schedule||'').match(/(\d{1,2}:\d{2})/)?.[1]||'13:30';
          c.lessons.forEach(l=>{
            if(l.date)state.records.push({
              id:`repair-261a01-${l.classNo}`,
              type:'event',date:l.date,time,
              title:`${c.name||'1A'} · Class ${l.classNo}`,
              note:`${l.unit}${l.content?` · ${l.content.slice(0,180)}`:''}`,
              importedClassCode:c.code,classId:c.id,classNo:l.classNo
            });
          });
          changed=true;
        }
      }

      if(Array.isArray(state.records)){
        const before=state.records.length;
        state.records=state.records.filter(r=>!(/Suggested\s+Syllabus|Check each box after completing the materials|Elementary Program Level/i.test(String(r.note||''))));
        if(state.records.length!==before)changed=true;
      }

      if(changed){
        try{if(typeof persist==='function')persist();else if(typeof saveState==='function')saveState();}catch(e){console.warn(e)}
        try{if(typeof renderClasses==='function')renderClasses();}catch(e){}
        try{if(typeof renderToday==='function')renderToday();}catch(e){}
      }
    }catch(e){console.warn('repair 261A01 v2',e)}
    finally{repairing=false;}
  }

  function scheduleRepair(delay=150){
    clearTimeout(timer);
    timer=setTimeout(repair,delay);
  }

  // 初次載入以及雲端資料回來後都重新確認，避免舊同步資料把修復結果蓋掉。
  [300,1000,2500,5000,9000].forEach(ms=>setTimeout(repair,ms));
  window.addEventListener('polly-data-changed',()=>scheduleRepair(250));
  window.addEventListener('storage',e=>{if(e.key&&/polly/i.test(e.key))scheduleRepair(300)});
})();