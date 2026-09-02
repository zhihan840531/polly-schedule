// Polly 工作台：一次性修復已存在的 261A01 待補課程 + 清掉誤匯入的 Syllabus 標題行程
(function(){
  const REPAIR_KEY='polly_repair_261a01_v1_done';
  const canonical=code=>String(code||'').trim().toUpperCase().replace(/^(\d{2})-EL-/,'$1-');
  function run(){
    try{
      if(!window.state||!Array.isArray(state.classes)||typeof window.Polly261A01Syllabus!=='function')return false;
      let changed=false;
      const c=state.classes.find(x=>canonical(x.code)==='26-1A-01');
      if(c){
        const old=Array.isArray(c.lessons)?c.lessons:[];
        const dateByClass=new Map();
        old.forEach(l=>{if(l&&l.classNo!=null&&l.date)dateByClass.set(Number(l.classNo),l.date)});
        // 也從既有行程補日期，避免舊 lessons 有缺日期。
        (state.records||[]).forEach(r=>{
          if(canonical(r.importedClassCode)==='26-1A-01'&&r.classNo!=null&&r.date)dateByClass.set(Number(r.classNo),r.date);
        });
        const seed=window.Polly261A01Syllabus();
        if(seed.length===56){
          c.lessons=seed.map(l=>({...l,date:dateByClass.get(Number(l.classNo))||l.date||''}));
          changed=true;
          // 重建 1A 匯入行程，避免舊的「待補」繼續顯示在首頁。
          state.records=Array.isArray(state.records)?state.records:[];
          state.records=state.records.filter(r=>!(canonical(r.importedClassCode)==='26-1A-01'&&r.type==='event'));
          const time=String(c.schedule||'').match(/(\d{1,2}:\d{2})/)?.[1]||'13:30';
          c.lessons.forEach(l=>{if(l.date)state.records.push({id:Date.now()+Number(l.classNo),type:'event',date:l.date,time,title:`${c.name||'1A'} · Class ${l.classNo}`,note:`${l.unit}${l.content?` · ${l.content.slice(0,140)}`:''}`,importedClassCode:c.code,classId:c.id,classNo:l.classNo});});
        }
      }
      // 清除曾把整個 Syllabus 頁首當作課程內容的錯誤行程。
      if(Array.isArray(state.records)){
        const before=state.records.length;
        state.records=state.records.filter(r=>!(/Suggested\s+Syllabus|Check each box after completing the materials|Elementary Program Level/i.test(String(r.note||''))));
        if(state.records.length!==before)changed=true;
      }
      if(changed){
        try{if(typeof persist==='function')persist();else if(typeof saveState==='function')saveState();}catch(e){console.warn(e)}
        try{localStorage.setItem(REPAIR_KEY,'1')}catch(e){}
        try{if(typeof renderClasses==='function')renderClasses();}catch(e){}
        try{if(typeof renderToday==='function')renderToday();}catch(e){}
        window.dispatchEvent(new Event('polly-data-changed'));
      }
      return true;
    }catch(e){console.warn('repair 261A01',e);return true;}
  }
  if(!run()){let n=0;const t=setInterval(()=>{if(run()||++n>50)clearInterval(t)},200)}
})();