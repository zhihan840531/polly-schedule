// Polly 工作台：每位學生行政確認單＋學生資料編輯
(function(){
  function ensureDefaults(s){
    if(!s)return s;
    if(typeof s.officialAccountAdded!=='boolean')s.officialAccountAdded=false;
    if(typeof s.prepaidPaid!=='boolean')s.prepaidPaid=false;
    if(typeof s.tuitionPaid!=='boolean')s.tuitionPaid=false;
    if(typeof s.contractSubmitted!=='boolean')s.contractSubmitted=false;
    if(typeof s.ptaReport!=='boolean')s.ptaReport=false;
    if(typeof s.ptaNote!=='string')s.ptaNote='';
    if(typeof s.parentPhone!=='string')s.parentPhone='';
    return s;
  }
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}try{if(typeof saveState==='function')saveState();else if(typeof pushToSupabase==='function')pushToSupabase();}catch(e){}}
  function findStudent(classId,index){const c=(state.classes||[]).find(x=>String(x.id)===String(classId));if(!c)return null;c.studentDetails=c.studentDetails||[];const s=ensureDefaults(c.studentDetails[index]);return s?{c,s,index}:null;}
  function completedCount(s){return [s.officialAccountAdded,s.prepaidPaid,s.tuitionPaid,s.contractSubmitted,s.ptaReport].filter(Boolean).length;}
  function closeModal(modal){if(!modal)return;modal.style.display='none';modal.classList.remove('open');}
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}

  function openEditStudent(classId,index){
    const hit=findStudent(classId,index);if(!hit)return;const {c,s}=hit;
    let modal=document.getElementById('studentEditModal');
    if(!modal){
      modal=document.createElement('div');modal.id='studentEditModal';modal.style.cssText='position:fixed;inset:0;z-index:125;background:#0005;display:none;align-items:flex-end;justify-content:center;padding:12px';
      modal.innerHTML=`<div class="student-edit-sheet" style="width:min(520px,100%);background:#fff;border-radius:22px;padding:18px;box-shadow:0 -8px 30px #0002"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div style="font-size:20px;font-weight:850">修改學生資料</div><div id="seClass" style="font-size:12px;color:var(--muted);margin-top:3px"></div></div><button id="seClose" class="btn">×</button></div><div id="seBody" class="form" style="margin-top:16px"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button id="seCancel" class="btn">取消</button><button id="seSave" class="btn primary">儲存修改</button></div></div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click',e=>{if(e.target===modal)closeModal(modal);});
      modal.querySelector('#seClose').onclick=()=>closeModal(modal);modal.querySelector('#seCancel').onclick=()=>closeModal(modal);
    }
    modal.dataset.classId=classId;modal.dataset.index=index;modal.querySelector('#seClass').textContent=c.code||'';
    modal.querySelector('#seBody').innerHTML=`
      <label>中文姓名<input id="seChinese" value="${esc(s.chinese)}"></label>
      <label>English Name<input id="seEnglish" value="${esc(s.english)}"></label>
      <label>出生年月日<input id="seBirthday" value="${esc(s.birthday)}" placeholder="例如 5/13/2021"></label>
      <label>學校／班級<input id="seSchool" value="${esc(s.school)}" placeholder="例如 雙連1-1"></label>
      <label>家長電話<input id="sePhone" type="tel" inputmode="tel" value="${esc(s.parentPhone)}" placeholder="例如 0912-345-678"></label>`;
    modal.querySelector('#seSave').onclick=()=>{
      const h=findStudent(modal.dataset.classId,Number(modal.dataset.index));if(!h)return;
      h.s.chinese=modal.querySelector('#seChinese').value.trim();
      h.s.english=modal.querySelector('#seEnglish').value.trim();
      h.s.birthday=modal.querySelector('#seBirthday').value.trim();
      h.s.school=modal.querySelector('#seSchool').value.trim();
      h.s.parentPhone=modal.querySelector('#sePhone').value.trim();
      if(h.c.students&&h.c.students[h.index]!==undefined)h.c.students[h.index]=h.s.english||h.s.chinese;
      save();closeModal(modal);if(typeof showClassDetail==='function')showClassDetail(Number(modal.dataset.classId));
    };
    modal.style.display='flex';
  }

  function openChecklist(classId,index){
    const hit=findStudent(classId,index);if(!hit)return;const {c,s}=hit;
    let modal=document.getElementById('studentChecklistModal');
    if(!modal){
      modal=document.createElement('div');modal.id='studentChecklistModal';modal.style.cssText='position:fixed;inset:0;z-index:120;background:#0005;display:none;align-items:flex-end;justify-content:center;padding:12px';
      modal.innerHTML='<div class="sc-sheet" style="width:min(520px,100%);background:#fff;border-radius:22px;padding:18px;box-shadow:0 -8px 30px #0002"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div id="scName" style="font-size:20px;font-weight:850"></div><div id="scMeta" style="font-size:12px;color:var(--muted);margin-top:3px"></div></div><button id="scClose" class="btn">×</button></div><div id="scBody" style="display:grid;gap:10px;margin-top:16px"></div><button id="scSave" class="btn primary" style="width:100%;margin-top:14px">儲存確認單</button></div>';
      document.body.appendChild(modal);modal.addEventListener('click',e=>{if(e.target===modal)closeModal(modal);});modal.querySelector('#scClose').onclick=()=>closeModal(modal);
      const st=document.createElement('style');st.textContent='.sc-row{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:12px;padding:12px;font-weight:750;background:#fffdf8}.sc-row input{width:20px;height:20px}.student-check-btn.done{background:#eef7e9;border-color:#cfe4c7;color:#4e7245}.student-phone-link{color:#258ad3;text-decoration:none;font-weight:700}.student-edit-btn{margin-right:6px}';document.head.appendChild(st);
    }
    modal.dataset.classId=classId;modal.dataset.index=index;modal.querySelector('#scName').textContent=[s.chinese,s.english].filter(Boolean).join(' · ');modal.querySelector('#scMeta').textContent=[c.code,s.school,s.parentPhone].filter(Boolean).join(' ｜ ');
    modal.querySelector('#scBody').innerHTML=`
      <label class="sc-row"><input id="scOfficial" type="checkbox" ${s.officialAccountAdded?'checked':''}><span>已加入官方帳號</span></label>
      <label class="sc-row"><input id="scPrepaid" type="checkbox" ${s.prepaidPaid?'checked':''}><span>已繳預繳費用</span></label>
      <label class="sc-row"><input id="scTuition" type="checkbox" ${s.tuitionPaid?'checked':''}><span>已繳學費</span></label>
      <label class="sc-row"><input id="scContract" type="checkbox" ${s.contractSubmitted?'checked':''}><span>已交定型化契約</span></label>
      <label class="sc-row"><input id="scPta" type="checkbox" ${s.ptaReport?'checked':''}><span>參加 PTA／領書面報告</span></label>
      <label style="display:grid;gap:6px;font-weight:700">PTA／書面報告備註<textarea id="scNote" rows="3" placeholder="例如：媽媽 9/5 才方便參加 PTA、書面報告已交爸爸…" style="width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:12px;padding:10px;font:inherit">${String(s.ptaNote||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</textarea></label>`;
    modal.querySelector('#scSave').onclick=()=>{const h=findStudent(modal.dataset.classId,Number(modal.dataset.index));if(!h)return;h.s.officialAccountAdded=modal.querySelector('#scOfficial').checked;h.s.prepaidPaid=modal.querySelector('#scPrepaid').checked;h.s.tuitionPaid=modal.querySelector('#scTuition').checked;h.s.contractSubmitted=modal.querySelector('#scContract').checked;h.s.ptaReport=modal.querySelector('#scPta').checked;h.s.ptaNote=modal.querySelector('#scNote').value.trim();save();closeModal(modal);if(typeof showClassDetail==='function')showClassDetail(Number(modal.dataset.classId));};
    modal.style.display='flex';
  }
  function enhanceClassDetail(classId){
    const c=(state.classes||[]).find(x=>String(x.id)===String(classId)),table=document.querySelector('#detailStudents .student-table');if(!c||!table)return;
    const details=(c.studentDetails||[]).length?c.studentDetails:(c.students||[]).map(e=>({chinese:'',english:e,birthday:'',school:'',parentPhone:''}));const hr=table.querySelector('thead tr');
    if(hr&&!hr.querySelector('.phone-head')){const phoneTh=document.createElement('th');phoneTh.className='phone-head';phoneTh.textContent='家長電話';const checkTh=document.createElement('th');checkTh.className='check-head';checkTh.textContent='行政確認';const ths=hr.querySelectorAll('th');if(ths[5])hr.insertBefore(phoneTh,ths[5]);else hr.appendChild(phoneTh);if(ths[6])hr.insertBefore(checkTh,ths[6]);else hr.appendChild(checkTh);}
    table.querySelectorAll('tbody tr').forEach((row,i)=>{
      const s=ensureDefaults(details[i]);if(!s)return;
      const cells=row.querySelectorAll('td');
      if(!row.querySelector('.phone-cell')){const phoneTd=document.createElement('td');phoneTd.className='phone-cell';phoneTd.innerHTML=s.parentPhone?`<a class="student-phone-link" href="tel:${String(s.parentPhone).replace(/[^0-9+]/g,'')}" onclick="event.stopPropagation()">${s.parentPhone}</a>`:'—';if(cells[5])row.insertBefore(phoneTd,cells[5]);else row.appendChild(phoneTd);}
      if(!row.querySelector('.check-cell')){const checkTd=document.createElement('td');checkTd.className='check-cell';const done=completedCount(s),btn=document.createElement('button');btn.className='btn student-check-btn'+(done===5?' done':'');btn.type='button';btn.textContent=done===5?'✓ 已完成':`✓ 確認單 ${done}/5`;btn.style.cssText='font-size:11px;padding:6px 8px;white-space:nowrap';btn.onclick=e=>{e.stopPropagation();openChecklist(classId,i);};checkTd.appendChild(btn);const cells2=row.querySelectorAll('td');if(cells2[6])row.insertBefore(checkTd,cells2[6]);else row.appendChild(checkTd);}
      const manage=row.querySelector('td:last-child');
      if(manage&&!manage.querySelector('.student-edit-btn')){const edit=document.createElement('button');edit.className='btn student-edit-btn';edit.type='button';edit.textContent='編輯';edit.onclick=e=>{e.stopPropagation();openEditStudent(classId,i);};manage.insertBefore(edit,manage.firstChild);}
    });
  }
  window.openStudentChecklist=openChecklist;window.openEditStudent=openEditStudent;
  const oldShow=window.showClassDetail;if(typeof oldShow==='function')window.showClassDetail=function(id){const r=oldShow.apply(this,arguments);setTimeout(()=>enhanceClassDetail(id),0);return r;};
  document.addEventListener('click',e=>{const modal=e.target;if(modal&&modal.classList&&modal.classList.contains('modal'))modal.classList.remove('open');});
  const oldDelete=window.deleteStudent;if(typeof oldDelete==='function')window.deleteStudent=function(){const args=arguments,r=oldDelete.apply(this,args);setTimeout(()=>{document.querySelectorAll('#studentNotebookModal.open,#studentChecklistModal,#studentEditModal').forEach(m=>closeModal(m));const detail=document.getElementById('classDetailModal');if(detail)detail.classList.remove('open');},0);return r;};
  setTimeout(()=>{try{if(typeof currentDetailClassId!=='undefined'&&currentDetailClassId)enhanceClassDetail(currentDetailClassId);}catch(e){}},300);
})();