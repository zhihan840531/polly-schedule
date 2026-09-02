// Polly 工作台：115Polly.xlsx 專用班級名單匯入
(function(){
  const norm=s=>String(s??'').trim().replace(/\s+/g,' ');
  const canonicalCode=code=>norm(code).toUpperCase().replace(/^(\d{2})-EL-/,'$1-');
  const classCodeRe=/^\d{2}-[A-Za-z0-9]+-\d{2}$/;
  function ensureUI(){
    const page=document.getElementById('classes'); if(!page||document.getElementById('classImportBtn')) return;
    const title=page.querySelector('.section-title');
    if(title){
      const actions=document.createElement('div'); actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end';
      const old=title.querySelector('button'); if(old){old.remove();actions.appendChild(old);}
      const btn=document.createElement('button'); btn.id='classImportBtn'; btn.className='btn'; btn.textContent='⬆️ 匯入班級名單';
      btn.onclick=()=>document.getElementById('classImportFile').click(); actions.insertBefore(btn,actions.firstChild); title.appendChild(actions);
    }
    const input=document.createElement('input'); input.id='classImportFile'; input.type='file'; input.accept='.xlsx,.xls'; input.style.display='none'; input.onchange=importFile; document.body.appendChild(input);
    const note=document.createElement('div'); note.id='classImportStatus'; note.style.cssText='font-size:12px;color:var(--muted);margin:4px 0 12px'; note.textContent='支援 Polly 的 115Polly.xlsx 格式：課程區間 → 班級 → 上課時間 → 授課老師 → 行政 → 學生資料。';
    const toolbar=page.querySelector('.class-toolbar'); if(toolbar) toolbar.parentNode.insertBefore(note,toolbar.nextSibling);
  }
  function findClassBlocks(rows){
    const out=[];
    for(let r=0;r<rows.length;r++){
      for(const c of [0,5,10]){
        const code=norm(rows[r]?.[c]);
        if(!classCodeRe.test(code)) continue;
        let period='',status='';
        for(let rr=r-1;rr>=Math.max(0,r-4);rr--){
          const v=norm(rows[rr]?.[c]);
          if(!period&&/^\d{3}\/\d{2}\/\d{2}\s*[-~～]\s*\d{3}\/\d{2}\/\d{2}$/.test(v)) period=v;
          else if(!status&&/^(on going|semester)$/i.test(v)) status=v;
        }
        const schedule=norm(rows[r+1]?.[c]);
        const teacher=norm(rows[r+2]?.[c]);
        const admin=norm(rows[r+3]?.[c]);
        const students=[];
        for(let sr=r+4;sr<rows.length;sr++){
          const chinese=norm(rows[sr]?.[c]);
          const english=norm(rows[sr]?.[c+1]);
          const birthday=norm(rows[sr]?.[c+2]);
          const school=norm(rows[sr]?.[c+3]);
          const parentPhone=norm(rows[sr]?.[c+4]);
          if(!chinese&&!english){if(students.length) break;continue;}
          if(classCodeRe.test(chinese)) break;
          students.push({chinese,english,birthday,school,parentPhone});
        }
        out.push({code,name:code.split('-').slice(1,-1).join('-'),status,period,schedule,teacher,admin,studentDetails:students});
      }
    }
    return out;
  }
  function mergeClass(incoming){
    state.classes=state.classes||[];
    const ck=canonicalCode(incoming.code);
    let c=state.classes.find(x=>canonicalCode(x.code)===ck);
    if(!c){ c={id:Date.now()+Math.floor(Math.random()*100000),code:ck,name:incoming.name,students:[],studentDetails:[]}; state.classes.push(c); }
    else if(/^\d{2}-EL-/i.test(norm(c.code))) c.code=ck;
    c.name=incoming.name||c.name; c.status=incoming.status||c.status; c.start=(incoming.period||'').split(/[-~～]/)[0]?.trim()||c.start; c.end=(incoming.period||'').split(/[-~～]/)[1]?.trim()||c.end;
    c.schedule=incoming.schedule||c.schedule; c.teacher=incoming.teacher||c.teacher; c.admin=incoming.admin||c.admin||'Polly'; c.studentDetails=c.studentDetails||[]; c.students=c.students||[];
    for(const s of incoming.studentDetails){
      let ex=c.studentDetails.find(x=>(s.english&&norm(x.english).toLowerCase()===norm(s.english).toLowerCase())||(s.chinese&&norm(x.chinese)===norm(s.chinese)));
      if(ex) Object.assign(ex,{chinese:s.chinese||ex.chinese,english:s.english||ex.english,birthday:s.birthday||ex.birthday,school:s.school||ex.school,parentPhone:s.parentPhone||ex.parentPhone});
      else { c.studentDetails.push({...s}); c.students.push(s.english||s.chinese); }
    }
    return c;
  }
  async function saveAll(){
    localStorage.setItem(KEY,JSON.stringify(state));
    if(typeof saveState==='function') try{saveState();}catch(e){console.warn(e);}
    if(typeof pushToSupabase==='function') try{await pushToSupabase();}catch(e){console.warn(e);}
    if(typeof window.PollyDedupeClasses==='function') try{window.PollyDedupeClasses();}catch(e){}
    if(typeof renderClasses==='function') renderClasses();
  }
  async function importFile(e){
    const file=e.target.files?.[0]; if(!file) return;
    const status=document.getElementById('classImportStatus'); status.textContent='⏳ 正在讀取 115Polly.xlsx…';
    try{
      const wb=XLSX.read(await file.arrayBuffer(),{type:'array'}); let blocks=[];
      for(const sn of wb.SheetNames){const rows=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,raw:false,defval:''}); blocks.push(...findClassBlocks(rows));}
      blocks=blocks.filter(b=>b.code&&b.studentDetails.length);
      if(!blocks.length) throw new Error('沒有辨識到班級區塊');
      let total=0; for(const b of blocks){mergeClass(b); total+=b.studentDetails.length;}
      await saveAll();
      status.textContent=`✓ 匯入完成：${blocks.length} 個班級、${total} 位學生，家長電話已寫入學生資料`;
      alert(`匯入完成！\n班級：${blocks.length} 個\n學生：${total} 位\n家長電話已一起匯入。`);
    }catch(err){console.error(err); status.textContent='匯入失敗：'+(err.message||err); alert('匯入失敗：'+(err.message||err));}
    e.target.value='';
  }
  setTimeout(ensureUI,0);
})();