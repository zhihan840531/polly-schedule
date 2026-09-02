// Polly 工作台：點名表＋教案匯入只更新既有班級，並依 Class 編號完整配對日期／課綱
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

      // 點名表負責日期，Syllabus 負責每堂內容；以 Class 編號做唯一配對。
      const dateByClass=new Map();
      for(const x of (unmatched||[])) if(x?.classNo!=null&&x?.date) dateByClass.set(Number(x.classNo),x.date);
      // 有些舊解析流程會把已配對日期直接放在 lessons 上，也一併保留。
      for(const l of (lessons||[])) if(l?.classNo!=null&&l?.date) dateByClass.set(Number(l.classNo),l.date);

      const syllabusByClass=new Map();
      for(const l of (lessons||[])){
        const no=Number(l?.classNo);
        if(Number.isFinite(no)) syllabusByClass.set(no,l);
      }

      // 若 pendingImport 的 lessons 沒帶完整內容，優先使用本次 Syllabus 解析結果。
      const detected=(window.pendingImport&&window.pendingImport.syllabusLessons)||[];
      for(const l of detected){
        const no=Number(l?.classNo);
        if(Number.isFinite(no)) syllabusByClass.set(no,l);
      }

      const allNos=new Set([...dateByClass.keys(),...syllabusByClass.keys()]);
      const lessonData=[...allNos].sort((a,b)=>a-b).map(no=>{
        const s=syllabusByClass.get(no)||{};
        return {
          ...s,
          classNo:no,
          date:s.date||dateByClass.get(no)||'',
          unit:s.unit||'',
          title:s.title||`Class ${no}`,
          content:s.content||''
        };
      });

      if(!c){
        alert(`找不到對應的正式班級：${incomingCanonical}\n請先確認班級清單，不會另外新增重複班級。`);
        return;
      }
      if(!confirm(`將「${att.code}」的點名表／教案資料更新到既有班級「${c.code}」嗎？`))return;
      Object.assign(c,{teacher:att.teacher||c.teacher,schedule:schedule||c.schedule,students,studentDetails:att.students,lessons:lessonData,start:att.start||c.start,end:att.end||c.end});
      state.records=Array.isArray(state.records)?state.records:[];
      state.records=state.records.filter(r=>!(canonical(r.importedClassCode)===incomingCanonical&&r.type==='event'));
      for(const l of lessonData){
        if(l.date) state.records.push({id:Date.now()+l.classNo,type:'event',date:l.date,time:att.startTime,title:`${c.name} · Class ${l.classNo}`,note:(l.unit?l.unit:'')+(l.content?`${l.unit?' · ':''}${l.content.slice(0,120)}`:''),importedClassCode:c.code,classId:c.id,classNo:l.classNo});
      }
      closeModal('importModal');pendingImport=null;persist();if(typeof window.PollyDedupeClasses==='function')window.PollyDedupeClasses();go('classes');
      const withContent=lessonData.filter(x=>x.content).length;
      alert(`匯入完成！\n已更新：${c.code}\n${students.length} 位學生\n${lessonData.length} 堂課程已建立\n${withContent} 堂已帶入課綱內容。`);
    };
    return true;
  }
  if(!override()){let n=0;const t=setInterval(()=>{if(override()||++n>30)clearInterval(t)},200);}
})();