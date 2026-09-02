// Polly 工作台：點名表＋教案匯入只更新既有班級，不再新增 EL 重複班級
(function(){
  const canonical=code=>String(code||'').trim().toUpperCase().replace(/^(\d{2})-EL-/,'$1-');
  function override(){
    if(typeof window.confirmAIImport!=='function'||typeof window.pendingImport==='undefined')return false;
    window.confirmAIImport=function(){
      if(!pendingImport)return;
      const {att,lessons,unmatched}=pendingImport;
      const incomingCanonical=canonical(att.code);
      let c=(state.classes||[]).find(x=>canonical(x.code)===incomingCanonical);
      const students=att.students.map(s=>s.english);
      const schedule=`每週${att.weekdays} ${att.startTime}–${att.endTime}`;
      const lessonData=[...lessons,...unmatched.map(x=>({classNo:x.classNo,date:x.date,unit:'待補',title:`Class ${x.classNo} · 尚未對應課綱`,content:'此堂在點名表中有日期，但目前上傳的 Syllabus 沒有對應內容。'}))].sort((a,b)=>a.classNo-b.classNo);
      if(!c){
        alert(`找不到對應的正式班級：${incomingCanonical}\n請先確認班級清單，不會另外新增重複班級。`);
        return;
      }
      if(!confirm(`將「${att.code}」的點名表／教案資料更新到既有班級「${c.code}」嗎？`))return;
      Object.assign(c,{teacher:att.teacher||c.teacher,schedule:schedule||c.schedule,students,studentDetails:att.students,lessons:lessonData,start:att.start||c.start,end:att.end||c.end});
      state.records=Array.isArray(state.records)?state.records:[];
      state.records=state.records.filter(r=>!(canonical(r.importedClassCode)===incomingCanonical&&r.type==='event'));
      for(const l of lessonData){if(l.date)state.records.push({id:Date.now()+l.classNo,type:'event',date:l.date,time:att.startTime,title:`${c.name} · Class ${l.classNo}`,note:l.unit+(l.content?` · ${l.content.slice(0,120)}`:''),importedClassCode:c.code,classId:c.id,classNo:l.classNo});}
      closeModal('importModal');pendingImport=null;persist();if(typeof window.PollyDedupeClasses==='function')window.PollyDedupeClasses();go('classes');
      alert(`匯入完成！\n已更新：${c.code}\n${students.length} 位學生\n${lessonData.length} 堂課程已建立。`);
    };
    return true;
  }
  if(!override()){let n=0;const t=setInterval(()=>{if(override()||++n>30)clearInterval(t)},200);}
})();