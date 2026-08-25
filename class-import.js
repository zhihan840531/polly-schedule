// Polly 工作台：班級名單 Excel/CSV 匯入
(function(){
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function norm(s){return String(s??'').trim().replace(/\s+/g,' ');}
  function detectHeader(rows){
    const keys=['中文','姓名','english','英文','生日','學校','班級','電話','手機','家長'];
    for(let i=0;i<Math.min(rows.length,12);i++){
      const line=(rows[i]||[]).map(v=>norm(v).toLowerCase()).join('|');
      const hits=keys.filter(k=>line.includes(k)).length;
      if(hits>=2)return i;
    }
    return 0;
  }
  function pickIndex(headers, patterns){
    const h=headers.map(x=>norm(x).toLowerCase());
    for(const p of patterns){const i=h.findIndex(x=>p.test(x));if(i>=0)return i;}
    return -1;
  }
  function parseSheet(ws,sheetName){
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''});
    if(!rows.length)return null;
    const hi=detectHeader(rows),headers=(rows[hi]||[]).map(norm);
    const ci=pickIndex(headers,[/^中文姓名$/,/(學生)?姓名/,/中文/]);
    const ei=pickIndex(headers,[/english/,/英文名/,/英文姓名/,/english name/]);
    const bi=pickIndex(headers,[/生日/,/出生/]);
    const si=pickIndex(headers,[/學校/,/校名/,/年級/,/班級/]);
    const pi=pickIndex(headers,[/家長.*電話/,/電話/,/手機/,/聯絡/]);
    const details=[];
    for(let r=hi+1;r<rows.length;r++){
      const row=rows[r]||[];
      let chinese=ci>=0?norm(row[ci]):'',english=ei>=0?norm(row[ei]):'';
      if(ci<0&&ei<0){
        const vals=row.map(norm).filter(Boolean);
        if(!vals.length)continue;
        chinese=/[\u4e00-\u9fff]/.test(vals[0])?vals[0]:'';
        english=chinese?(vals[1]||''):vals[0];
      }
      if(!chinese&&!english)continue;
      if(/^(中文姓名|姓名|english name|英文姓名)$/i.test(chinese||english))continue;
      details.push({
        chinese,english,
        birthday:bi>=0?norm(row[bi]):'',
        school:si>=0?norm(row[si]):'',
        parentPhone:pi>=0?norm(row[pi]):''
      });
    }
    if(!details.length)return null;
    return {name:norm(sheetName)||'新班級',code:norm(sheetName)||'新班級',studentDetails:details};
  }
  function ensureUI(){
    const page=document.getElementById('classes');
    if(!page||document.getElementById('classImportBtn'))return;
    const title=page.querySelector('.section-title');
    if(title){
      const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end';
      const oldBtn=title.querySelector('button');
      if(oldBtn){oldBtn.remove();actions.appendChild(oldBtn);}
      const btn=document.createElement('button');btn.id='classImportBtn';btn.className='btn';btn.textContent='⬆️ 匯入班級名單';btn.onclick=()=>document.getElementById('classImportFile').click();
      actions.insertBefore(btn,actions.firstChild);title.appendChild(actions);
    }
    const input=document.createElement('input');
    input.id='classImportFile';input.type='file';input.accept='.xlsx,.xls,.csv';input.multiple=true;input.style.display='none';input.onchange=importFiles;
    document.body.appendChild(input);
    const note=document.createElement('div');note.id='classImportStatus';note.style.cssText='font-size:12px;color:var(--muted);margin:4px 0 12px';note.textContent='可直接上傳 Excel / CSV 班級名單；每個工作表會視為一個班級。';
    const toolbar=page.querySelector('.class-toolbar');if(toolbar)toolbar.parentNode.insertBefore(note,toolbar.nextSibling);
  }
  async function importFiles(e){
    const files=[...(e.target.files||[])];if(!files.length)return;
    const status=document.getElementById('classImportStatus');status.textContent='⏳ 正在讀取班級名單…';
    try{
      let classes=[];
      for(const file of files){
        const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});
        for(const sheetName of wb.SheetNames){const parsed=parseSheet(wb.Sheets[sheetName],sheetName);if(parsed)classes.push(parsed);}
      }
      if(!classes.length)throw new Error('沒有辨識到學生名單，請確認檔案內有姓名欄位。');
      state.classes=state.classes||[];
      let added=0,merged=0,students=0;
      for(const incoming of classes){
        let c=state.classes.find(x=>norm(x.code)===norm(incoming.code)||norm(x.name)===norm(incoming.name));
        if(!c){
          c={id:Date.now()+added+Math.floor(Math.random()*1000),code:incoming.code,name:incoming.name,teacher:'',schedule:'',students:[],studentDetails:[]};
          state.classes.push(c);added++;
        }else merged++;
        c.studentDetails=c.studentDetails||[];
        c.students=c.students||[];
        for(const s of incoming.studentDetails){
          const exists=c.studentDetails.find(x=>(s.english&&norm(x.english).toLowerCase()===norm(s.english).toLowerCase())||(s.chinese&&norm(x.chinese)===norm(s.chinese)));
          if(exists){Object.assign(exists,{birthday:s.birthday||exists.birthday||'',school:s.school||exists.school||'',parentPhone:s.parentPhone||exists.parentPhone||''});}
          else{c.studentDetails.push(s);c.students.push(s.english||s.chinese);students++;}
        }
      }
      if(typeof persist==='function')persist();else{localStorage.setItem(KEY,JSON.stringify(state));if(typeof render==='function')render();}
      if(typeof renderClasses==='function')renderClasses();
      status.textContent=`✓ 完成：新增 ${added} 個班級、合併 ${merged} 個班級、加入 ${students} 位學生`;
      alert(`班級名單匯入完成！\n新增 ${added} 個班級\n合併 ${merged} 個既有班級\n加入 ${students} 位學生`);
    }catch(err){console.error(err);status.textContent='匯入失敗：'+(err.message||err);alert('匯入失敗：'+(err.message||err));}
    e.target.value='';
  }
  setTimeout(ensureUI,0);
})();