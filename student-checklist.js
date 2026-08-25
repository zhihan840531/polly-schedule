// Polly 工作台：每位學生行政確認單
(function(){
  function ensureDefaults(s){
    if(!s) return s;
    if(typeof s.prepaidPaid!=='boolean') s.prepaidPaid=false;
    if(typeof s.tuitionPaid!=='boolean') s.tuitionPaid=false;
    if(typeof s.contractSubmitted!=='boolean') s.contractSubmitted=false;
    if(typeof s.ptaReport!=='boolean') s.ptaReport=false;
    if(typeof s.ptaNote!=='string') s.ptaNote='';
    return s;
  }
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
    try{if(typeof saveState==='function') saveState(); else if(typeof pushToSupabase==='function') pushToSupabase();}catch(e){}
  }
  function findStudent(classId,index){
    const c=(state.classes||[]).find(x=>String(x.id)===String(classId));
    if(!c)return null;
    c.studentDetails=c.studentDetails||[];
    const s=ensureDefaults(c.studentDetails[index]);
    return s?{c,s,index}:null;
  }
  function completedCount(s){return [s.prepaidPaid,s.tuitionPaid,s.contractSubmitted,s.ptaReport].filter(Boolean).length;}
  function openChecklist(classId,index){
    const hit=findStudent(classId,index);if(!hit)return;
    const {c,s}=hit;
    let modal=document.getElementById('studentChecklistModal');
    if(!modal){
      modal=document.createElement('div');
      modal.id='studentChecklistModal';
      modal.style.cssText='position:fixed;inset:0;z-index:120;background:#0005;display:none;align-items:flex-end;justify-content:center;padding:12px';
      modal.innerHTML='<div style="width:min(520px,100%);background:#fff;border-radius:22px;padding:18px;box-shadow:0 -8px 30px #0002"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div id="scName" style="font-size:20px;font-weight:850"></div><div id="scMeta" style="font-size:12px;color:var(--muted);margin-top:3px"></div></div><button id="scClose" class="btn">×</button></div><div id="scBody" style="display:grid;gap:10px;margin-top:16px"></div><button id="scSave" class="btn primary" style="width:100%;margin-top:14px">儲存確認單</button></div>';
      document.body.appendChild(modal);
      modal.onclick=e=>{if(e.target===modal)modal.style.display='none';};
      modal.querySelector('#scClose').onclick=()=>modal.style.display='none';
      const st=document.createElement('style');
      st.textContent='.sc-row{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:12px;padding:12px;font-weight:750;background:#fffdf8}.sc-row input{width:20px;height:20px}.student-check-btn.done{background:#eef7e9;border-color:#cfe4c7;color:#4e7245}.student-phone-link{color:#258ad3;text-decoration:none;font-weight:700}';
      document.head.appendChild(st);
    }
    modal.dataset.classId=classId;modal.dataset.index=index;
    modal.querySelector('#scName').textContent=[s.chinese,s.english].filter(Boolean).join(' · ');
    modal.querySelector('#scMeta').textContent=[c.code,s.school,s.parentPhone].filter(Boolean).join(' ｜ ');
    modal.querySelector('#scBody').innerHTML=`
      <label class="sc-row"><input id="scPrepaid" type="checkbox" ${s.prepaidPaid?'checked':''}><span>已繳預繳費用</span></label>
      <label class="sc-row"><input id="scTuition" type="checkbox" ${s.tuitionPaid?'checked':''}><span>已繳學費</span></label>
      <label class="sc-row"><input id="scContract" type="checkbox" ${s.contractSubmitted?'checked':''}><span>已交定型化契約</span></label>
      <label class="sc-row"><input id="scPta" type="checkbox" ${s.ptaReport?'checked':''}><span>參加 PTA／領書面報告</span></label>
      <label style="display:grid;gap:6px;font-weight:700">PTA／書面報告備註<textarea id="scNote" rows="3" placeholder="例如：媽媽 9/5 才方便參加 PTA、書面報告已交爸爸…" style="width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:12px;padding:10px;font:inherit">${String(s.ptaNote||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</textarea></label>`;
    modal.querySelector('#scSave').onclick=()=>{
      const h=findStudent(modal.dataset.classId,Number(modal.dataset.index));if(!h)return;
      h.s.prepaidPaid=modal.querySelector('#scPrepaid').checked;
      h.s.tuitionPaid=modal.querySelector('#scTuition').checked;
      h.s.contractSubmitted=modal.querySelector('#scContract').checked;
      h.s.ptaReport=modal.querySelector('#scPta').checked;
      h.s.ptaNote=modal.querySelector('#scNote').value.trim();
      save();modal.style.display='none';
      if(typeof showClassDetail==='function')showClassDetail(Number(modal.dataset.classId));
    };
    modal.style.display='flex';
  }
  function enhanceClassDetail(classId){
    const c=(state.classes||[]).find(x=>String(x.id)===String(classId));
    const table=document.querySelector('#detailStudents .student-table');
    if(!c||!table)return;
    const details=(c.studentDetails||[]).length?c.studentDetails:(c.students||[]).map(e=>({chinese:'',english:e,birthday:'',school:'',parentPhone:''}));
    const hr=table.querySelector('thead tr');
    if(hr&&!hr.querySelector('.phone-head')){
      const phoneTh=document.createElement('th');phoneTh.className='phone-head';phoneTh.textContent='家長電話';
      const checkTh=document.createElement('th');checkTh.className='check-head';checkTh.textContent='行政確認';
      const ths=hr.querySelectorAll('th');
      if(ths[5])hr.insertBefore(phoneTh,ths[5]);else hr.appendChild(phoneTh);
      if(ths[6])hr.insertBefore(checkTh,ths[6]);else hr.appendChild(checkTh);
    }
    table.querySelectorAll('tbody tr').forEach((row,i)=>{
      const s=ensureDefaults(details[i]);if(!s)return;
      if(row.querySelector('.phone-cell'))return;
      const cells=row.querySelectorAll('td');
      const phoneTd=document.createElement('td');phoneTd.className='phone-cell';
      phoneTd.innerHTML=s.parentPhone?`<a class="student-phone-link" href="tel:${String(s.parentPhone).replace(/[^0-9+]/g,'')}" onclick="event.stopPropagation()">${s.parentPhone}</a>`:'—';
      const checkTd=document.createElement('td');checkTd.className='check-cell';
      const done=completedCount(s);
      const btn=document.createElement('button');btn.className='btn student-check-btn'+(done===4?' done':'');btn.type='button';btn.textContent=done===4?'✓ 已完成':`✓ 確認單 ${done}/4`;btn.style.cssText='font-size:11px;padding:6px 8px;white-space:nowrap';btn.onclick=e=>{e.stopPropagation();openChecklist(classId,i);};checkTd.appendChild(btn);
      if(cells[5])row.insertBefore(phoneTd,cells[5]);else row.appendChild(phoneTd);
      const cells2=row.querySelectorAll('td');
      if(cells2[6])row.insertBefore(checkTd,cells2[6]);else row.appendChild(checkTd);
    });
  }
  window.openStudentChecklist=openChecklist;
  const oldShow=window.showClassDetail;
  if(typeof oldShow==='function'){
    window.showClassDetail=function(id){const r=oldShow.apply(this,arguments);setTimeout(()=>enhanceClassDetail(id),0);return r;};
  }
  // 已經開著班級視窗時也補上入口
  setTimeout(()=>{try{if(typeof currentDetailClassId!=='undefined'&&currentDetailClassId)enhanceClassDetail(currentDetailClassId);}catch(e){}},300);
})();