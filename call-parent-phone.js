// Polly 工作台：學生家長電話（正式存入學生資料，會跟 state 一起同步 Supabase）
(function(){
  function cleanPhone(v){return String(v||'').replace(/[^0-9+]/g,'');}

  function currentStudentRef(){
    try{
      if(typeof getCallNameMode==='function'&&getCallNameMode()==='list'&&typeof getCurrentCallStudent==='function'){
        const cur=getCurrentCallStudent();
        if(cur?.c&&cur?.s)return {c:cur.c,s:cur.s,idx:cur.idx};
      }
    }catch{}
    return null;
  }

  function ensurePhoneField(){
    const modal=document.getElementById('callModal');
    if(!modal)return;
    const source=document.getElementById('callSource');
    if(!source||document.getElementById('callParentPhone'))return;
    const wrap=document.createElement('div');
    wrap.id='callPhoneWrap';
    wrap.style.cssText='display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin:8px 0 10px';
    wrap.innerHTML='<label style="display:grid;gap:5px;font-size:13px;font-weight:700">家長電話<input id="callParentPhone" type="tel" inputmode="tel" placeholder="例如 0912-345-678" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:10px"></label><button id="callParentDial" class="btn primary" type="button" style="height:42px">📞 撥電話</button>';
    source.parentElement.insertBefore(wrap,source);
    document.getElementById('callParentDial').onclick=()=>{
      const p=cleanPhone(document.getElementById('callParentPhone').value);
      if(!p)return alert('請先輸入家長電話');
      location.href='tel:'+p;
    };
    const el=document.getElementById('callParentPhone');
    el.addEventListener('change',saveCurrentPhone);
    el.addEventListener('blur',saveCurrentPhone);
  }

  function loadCurrentPhone(){
    ensurePhoneField();
    const ref=currentStudentRef(),el=document.getElementById('callParentPhone');
    if(!el)return;
    el.value=ref?.s?.parentPhone||'';
  }

  function saveCurrentPhone(){
    const ref=currentStudentRef(),el=document.getElementById('callParentPhone');
    if(!ref||!el)return;
    ref.s.parentPhone=el.value.trim();
    if(!(ref.c.studentDetails||[]).length){
      ref.c.studentDetails=(ref.c.students||[]).map((e,i)=>({chinese:'',english:e,birthday:'',school:'',parentPhone:i===ref.idx?el.value.trim():''}));
    }else if(ref.c.studentDetails[ref.idx]){
      ref.c.studentDetails[ref.idx].parentPhone=el.value.trim();
    }
    if(typeof persist==='function')persist();
  }

  function ensureNewStudentPhoneField(){
    const modal=document.getElementById('studentModal');
    if(!modal||document.getElementById('newStudentParentPhone'))return;
    const school=document.getElementById('newStudentSchool');
    if(!school)return;
    const label=document.createElement('label');
    label.innerHTML='家長電話<input id="newStudentParentPhone" type="tel" inputmode="tel" placeholder="例如：0912-345-678">';
    school.closest('label')?.after(label);
  }

  const oldOpenAdd=window.openAddStudent;
  if(typeof oldOpenAdd==='function')window.openAddStudent=function(){
    ensureNewStudentPhoneField();
    const r=oldOpenAdd.apply(this,arguments);
    const el=document.getElementById('newStudentParentPhone');if(el)el.value='';
    return r;
  };

  const oldSaveNew=window.saveNewStudent;
  if(typeof oldSaveNew==='function')window.saveNewStudent=function(){
    const classId=typeof addStudentClassId!=='undefined'?addStudentClassId:null;
    const c=state.classes.find(x=>x.id===classId);
    const before=c?.studentDetails?.length||0;
    const phone=document.getElementById('newStudentParentPhone')?.value.trim()||'';
    const r=oldSaveNew.apply(this,arguments);
    const target=state.classes.find(x=>x.id===classId);
    if(target?.studentDetails?.length>before){
      target.studentDetails[target.studentDetails.length-1].parentPhone=phone;
      if(typeof persist==='function')persist();
    }
    return r;
  };

  // 電訪視窗仍可查看、編輯與撥打家長電話；班級清單的家長電話欄統一交給 student-checklist.js 顯示，避免重複欄位。
  const oldOpen=window.openCallRecord;
  if(typeof oldOpen==='function')window.openCallRecord=function(){const r=oldOpen.apply(this,arguments);setTimeout(loadCurrentPhone,0);return r;};
  const oldRender=window.renderCallStudents;
  if(typeof oldRender==='function')window.renderCallStudents=function(){const r=oldRender.apply(this,arguments);setTimeout(loadCurrentPhone,0);return r;};
  document.addEventListener('change',e=>{if(e.target?.id==='callStudentSelect')setTimeout(loadCurrentPhone,0);});
  document.addEventListener('click',e=>{if(e.target.closest?.('.call-student-btn'))setTimeout(loadCurrentPhone,20);});
  setTimeout(()=>{ensurePhoneField();ensureNewStudentPhoneField();},0);
})();