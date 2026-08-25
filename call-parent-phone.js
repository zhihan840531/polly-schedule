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
    // studentDetails 是正式學生資料來源；若舊資料只有 students，先轉成 studentDetails 再寫入。
    if(!(ref.c.studentDetails||[]).length){
      ref.c.studentDetails=(ref.c.students||[]).map((e,i)=>({
        chinese:'',english:e,birthday:'',school:'',
        parentPhone:i===ref.idx?el.value.trim():''
      }));
    }else if(ref.c.studentDetails[ref.idx]){
      ref.c.studentDetails[ref.idx].parentPhone=el.value.trim();
    }
    if(typeof persist==='function')persist();
  }

  // 在「新增學生」視窗加入家長電話欄位，直接存進 studentDetails。
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

  // 班級學生清單直接顯示電話，手機可點擊撥號。
  const oldShowClassDetail=window.showClassDetail;
  if(typeof oldShowClassDetail==='function')window.showClassDetail=function(){
    const r=oldShowClassDetail.apply(this,arguments);
    setTimeout(()=>{
      document.querySelectorAll('#detailStudents tr[data-student-index]').forEach(()=>{});
      const c=state.classes.find(x=>x.id===arguments[0]);
      if(!c)return;
      const details=(c.studentDetails||[]).length?c.studentDetails:(c.students||[]).map(e=>({chinese:'',english:e,birthday:'',school:'',parentPhone:''}));
      const rows=document.querySelectorAll('#detailStudents .student-table tbody tr');
      rows.forEach((row,i)=>{
        const s=details[i];if(!s)return;
        const cells=row.querySelectorAll('td');
        if(!cells.length||row.querySelector('.parent-phone-cell'))return;
        const td=document.createElement('td');td.className='parent-phone-cell';
        td.innerHTML=s.parentPhone?`<a href="tel:${cleanPhone(s.parentPhone)}" onclick="event.stopPropagation()" style="color:inherit;text-decoration:none">📞 ${s.parentPhone}</a>`:'—';
        row.appendChild(td);
      });
      const head=document.querySelector('#detailStudents .student-table thead tr');
      if(head&&!head.querySelector('.parent-phone-head')){
        const th=document.createElement('th');th.className='parent-phone-head';th.textContent='家長電話';head.appendChild(th);
      }
    },0);
    return r;
  };

  const oldOpen=window.openCallRecord;
  if(typeof oldOpen==='function')window.openCallRecord=function(){const r=oldOpen.apply(this,arguments);setTimeout(loadCurrentPhone,0);return r;};
  const oldRender=window.renderCallStudents;
  if(typeof oldRender==='function')window.renderCallStudents=function(){const r=oldRender.apply(this,arguments);setTimeout(loadCurrentPhone,0);return r;};
  document.addEventListener('change',e=>{if(e.target?.id==='callStudentSelect')setTimeout(loadCurrentPhone,0);});
  document.addEventListener('click',e=>{if(e.target.closest?.('.call-student-btn'))setTimeout(loadCurrentPhone,20);});
  setTimeout(()=>{ensurePhoneField();ensureNewStudentPhoneField();},0);
})();