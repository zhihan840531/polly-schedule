// Polly 工作台：班級名單 Excel/CSV 匯入（支援 115Polly 橫向三班格式）
(function(){
  function norm(s){return String(s??'').trim().replace(/\s+/g,' ');}
  function classNameFromCode(code){const m=norm(code).match(/^\d+-(.+?)-\d+$/);return m?m[1]:norm(code);}
  function splitRange(v){const s=norm(v);const m=s.match(/^(.+?)[-~～](.+)$/);return m?[m[1],m[2]]:['',''];}
  function parsePollyBlocks(ws){
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''});
    if(!rows.length)return [];
    const out=[];
    const starts=[0,5,10];
    for(const col of starts){
      let codeRow=-1,code='';
      for(let r=0;r<Math.min(rows.length,12);r++){
        const v=norm((rows[r]||[])[col]);
        if(/^\d{2}-[A-Za-z0-9]+-\d{2}$/.test(v)){codeRow=r;code=v;break;}
      }
      if(codeRow<0)continue;
      const status=norm((rows[Math.max(0,codeRow-3)]||[])[col]);
      const period=norm((rows[Math.max(0,codeRow-2)]||[])[col]);
      const [start,end]=splitRange(period);
      const schedule=norm((rows[codeRow+1]||[])[col]);
      const teacher=norm((rows[codeRow+2]||[])[col]);
      const admin=norm((rows[codeRow+3]||[])[col])||'Polly';
      let firstStudent=codeRow+4;
      while(firstStudent<rows.length && !(norm((rows[firstStudent]||[])[col])||norm((rows[firstStudent]||[])[col+1]))) firstStudent++;
      const details=[];
      for(let r=firstStudent;r<rows.length;r++){
        const row=rows[r]||[];
        const chinese=norm(row[col]),english=norm(row[col+1]),birthday=norm(row[col+2]),school=norm(row[col+3]),parentPhone=norm(row[col+4]);
        if(!chinese&&!english&&!birthday&&!school&&!parentPhone)continue;
        if(!chinese&&!english)continue;
        if(/^\d{2}-[A-Za-z0-9]+-\d{2}$/.test(chinese))break;
        details.push({chinese,english,birthday,school,parentPhone});
      }
      if(details.length)out.push({code,name:classNameFromCode(code),status,statusRaw:status,start,end,schedule,teacher,admin,studentDetails:details});
    }
    return out;
  }
  function parseGenericSheet(ws,sheetName){
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''});if(!rows.length)return [];
    let hi=-1;for(let i=0;i<Math.min(rows.length,12);i++){const line=(rows[i]||[]).map(v=>norm(v).toLowerCase()).join('|');if(/姓名|english|英文/.test(line)){hi=i;break;}}
    if(hi<0)return [];
    const headers=(rows[hi]||[]).map(x=>norm(x).toLowerCase());
    const find=(res)=>{for(const re of res){const i=headers.findIndex(x=>re.test(x));if(i>=0)return i;}return -1;};
    const ci=find([/^中文姓名$/,/(學生)?姓名/,/中文/]),ei=find([/english/,/英文名/,/英文姓名/]),bi=find([/生日/,/出生/]),si=find([/學校/,/校名/,/年級/]),pi=find([/家長.*電話/,/電話/,/手機/,/聯絡/]);
    const details=[];for(let r=hi+1;r<rows.length;r++){const row=rows[r]||[];const chinese=ci>=0?norm(row[ci]):'',english=ei>=0?norm(row[ei]):'';if(!chinese&&!english)continue;details.push({chinese,english,birthday:bi>=0?norm(row[bi]):'',school:si>=0?norm(row[si]):'',parentPhone:pi>=0?norm(row[pi]):''});}
    return details.length?[{code:norm(sheetName)||'新班級',name:norm(sheetName)||'新班級',teacher:'',admin:'Polly',schedule:'',start:'',end:'',status:'',studentDetails:details}]:[];
  }
  function ensureUI(){
    const page=document.getElementById('classes');if(!page||document.getElementById('classImportBtn'))return;
    const title=page.querySelector('.section-title');if(title){const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end';const oldBtn=title.querySelector('button');if(oldBtn){oldBtn.remove();actions.appendChild(oldBtn);}const btn=document.createElement('button');btn.id='classImportBtn';btn.className='btn';btn.textContent='⬆️ 匯入班級名單';btn.onclick=()=>document.getElementById('classImportFile').click();actions.insertBefore(btn,actions.firstChild);title.appendChild(actions);}
    const input=document.createElement('input');input.id='classImportFile';input.type='file';input.accept='.xlsx,.xls,.csv';input.style.display='none';input.onchange=importFiles;document.body.appendChild(input);
    const note=document.createElement('div');note.id='classImportStatus';note.style.cssText='font-size:12px;color:var(--muted);margin:4px 0 12px';note.textContent='支援 115Polly.xlsx：會自動辨識每張工作表橫向 3 個班級與家長電話。';const toolbar=page.querySelector('.class-toolbar');if(toolbar)toolbar.parentNode.insertBefore(note,toolbar.nextSibling);
  }
  function safeSave(){
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){console.warn(e);}
    try{if(typeof pushToSupabase==='function')pushToSupabase();}catch(e){console.warn(e);}
    try{if(typeof renderClasses==='function')renderClasses();}catch(e){console.warn(e);}
    try{if(typeof refreshCallStudentOptions==='function')refreshCallStudentOptions();}catch(e){}
  }
  function mergeClass(incoming){
    state.classes=state.classes||[];
    let c=state.classes.find(x=>norm(x.code)===norm(incoming.code));
    let created=false;if(!c){c={id:Date.now()+Math.floor(Math.random()*100000),code:incoming.code,name:incoming.name,students:[],studentDetails:[]};state.classes.push(c);created=true;}
    c.name=incoming.name||c.name;c.teacher=incoming.teacher||c.teacher;c.admin=incoming.admin||c.admin||'Polly';c.schedule=incoming.schedule||c.schedule;c.start=incoming.start||c.start;c.end=incoming.end||c.end;c.status=incoming.status||c.status;
    c.studentDetails=c.studentDetails||[];c.students=c.students||[];
    let added=0,updated=0;
    for(const s of incoming.studentDetails){const ex=c.studentDetails.find(x=>(s.chinese&&norm(x.chinese)===norm(s.chinese))||(s.english&&norm(x.english).toLowerCase()===norm(s.english).toLowerCase()));if(ex){Object.assign(ex,{chinese:s.chinese||ex.chinese,english:s.english||ex.english,birthday:s.birthday||ex.birthday,school:s.school||ex.school,parentPhone:s.parentPhone||ex.parentPhone});updated++;}else{c.studentDetails.push(s);c.students.push(s.english||s.chinese);added++;}}
    return {created,added,updated};
  }
  async function importFiles(e){
    const file=e.target.files?.[0];if(!file)return;const status=document.getElementById('classImportStatus');status.textContent='⏳ 正在讀取 '+file.name+'…';
    try{
      const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});let classes=[];
      for(const sn of wb.SheetNames){const ws=wb.Sheets[sn];const polly=parsePollyBlocks(ws);classes.push(...(polly.length?polly:parseGenericSheet(ws,sn)));}
      if(!classes.length)throw new Error('沒有辨識到班級資料');
      let newClasses=0,addedStudents=0,updatedStudents=0;for(const c of classes){const r=mergeClass(c);if(r.created)newClasses++;addedStudents+=r.added;updatedStudents+=r.updated;}
      safeSave();
      status.textContent=`✓ 已匯入 ${classes.length} 個班級｜新增 ${addedStudents} 位｜更新 ${updatedStudents} 位`;
      alert(`完成！\n辨識 ${classes.length} 個班級\n新增 ${newClasses} 個班級\n新增學生 ${addedStudents} 位\n更新既有學生 ${updatedStudents} 位\n家長電話也已帶入學生資料。`);
    }catch(err){console.error(err);status.textContent='匯入失敗：'+(err.message||err);alert('匯入失敗：'+(err.message||err));}
    e.target.value='';
  }
  setTimeout(ensureUI,0);
})();