// Polly 工作台：每位學生行政確認單
(function(){
  const norm=s=>String(s??'').trim();
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
    try{if(typeof pushToSupabase==='function') pushToSupabase();}catch(e){}
    try{if(typeof renderClasses==='function') renderClasses();}catch(e){}
  }
  function findStudent(classId,index){
    const c=(state.classes||[]).find(x=>String(x.id)===String(classId));
    if(!c) return null;
    c.studentDetails=c.studentDetails||[];
    return {c,s:ensureDefaults(c.studentDetails[index]),index};
  }
  function openChecklist(classId,index){
    const hit=findStudent(classId,index); if(!hit||!hit.s) return;
    const {c,s}=hit;
    let modal=document.getElementById('studentChecklistModal');
    if(!modal){
      modal=document.createElement('div'); modal.id='studentChecklistModal'; modal.style.cssText='position:fixed;inset:0;z-index:120;background:#0005;display:none;align-items:flex-end;justify-content:center;padding:12px';
      modal.innerHTML='<div style="width:min(520px,100%);background:#fff;border-radius:22px;padding:18px;box-shadow:0 -8px 30px #0002"><div style="display:flex;justify-content:space-between;align-items:center"><div><div id="scName" style="font-size:20px;font-weight:850"></div><div id="scMeta" style="font-size:12px;color:var(--muted);margin-top:3px"></div></div><button id="scClose" class="btn">×</button></div><div id="scBody" style="display:grid;gap:10px;margin-top:16px"></div><button id="scSave" class="btn primary" style="width:100%;margin-top:14px">儲存確認單</button></div>';
      document.body.appendChild(modal); modal.onclick=e=>{if(e.target===modal)modal.style.display='none';}; modal.querySelector('#scClose').onclick=()=>modal.style.display='none';
    }
    modal.dataset.classId=classId; modal.dataset.index=index;
    modal.querySelector('#scName').textContent=[s.chinese,s.english].filter(Boolean).join(' · ');
    modal.querySelector('#scMeta').textContent=[c.code,s.school,s.parentPhone].filter(Boolean).join(' ｜ ');
    modal.querySelector('#scBody').innerHTML=`
      <label class="sc-row"><input id="scPrepaid" type="checkbox" ${s.prepaidPaid?'checked':''}> <span>已繳預繳費用</span></label>
      <label class="sc-row"><input id="scTuition" type="checkbox" ${s.tuitionPaid?'checked':''}> <span>已繳學費</span></label>
      <label class="sc-row"><input id="scContract" type="checkbox" ${s.contractSubmitted?'checked':''}> <span>已交定型化契約</span></label>
      <label class="sc-row"><input id="scPta" type="checkbox" ${s.ptaReport?'checked':''}> <span>參加 PTA／領書面報告</span></label>
      <label style="display:grid;gap:6px;font-weight:700">備註<textarea id="scNote" rows="3" placeholder="例如：媽媽 9/5 才方便參加 PTA、報告已交爸爸…" style="width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:12px;padding:10px;font:inherit">${String(s.ptaNote||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</textarea></label>`;
    if(!document.getElementById('studentChecklistStyle')){const st=document.createElement('style');st.id='studentChecklistStyle';st.textContent='.sc-row{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:12px;padding:12px;font-weight:750;background:#fffdf8}.sc-row input{width:20px;height:20px}';document.head.appendChild(st);}
    modal.querySelector('#scSave').onclick=()=>{
      const h=findStudent(modal.dataset.classId,Number(modal.dataset.index)); if(!h||!h.s)return;
      h.s.prepaidPaid=modal.querySelector('#scPrepaid').checked;
      h.s.tuitionPaid=modal.querySelector('#scTuition').checked;
      h.s.contractSubmitted=modal.querySelector('#scContract').checked;
      h.s.ptaReport=modal.querySelector('#scPta').checked;
      h.s.ptaNote=modal.querySelector('#scNote').value.trim(); save(); modal.style.display='none';
    };
    modal.style.display='flex';
  }
  function injectButtons(){
    document.querySelectorAll('[data-class-id]').forEach(card=>{
      const classId=card.dataset.classId; if(!classId)return;
      const c=(state.classes||[]).find(x=>String(x.id)===String(classId)); if(!c)return;
      const rows=card.querySelectorAll('[data-student-index]');
      rows.forEach(row=>{const i=row.dataset.studentIndex;if(row.querySelector('.student-check-btn'))return;const b=document.createElement('button');b.className='btn student-check-btn';b.type='button';b.textContent='✓ 確認單';b.style.cssText='font-size:11px;padding:6px 8px';b.onclick=e=>{e.stopPropagation();openChecklist(classId,Number(i));};row.appendChild(b);});
    });
  }
  // 若舊 UI 沒有 data 標記，提供全域函式讓班級學生編輯區也可呼叫。
  window.openStudentChecklist=openChecklist;
  const old=window.renderClasses;
  if(typeof old==='function') window.renderClasses=function(){const r=old.apply(this,arguments);setTimeout(injectButtons,0);return r;};
  setTimeout(injectButtons,300);
})();