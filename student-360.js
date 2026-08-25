// Polly 工作台：360° 學生資料卡（學生作為所有工作的中心）
(function(){
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  function cls(id){return (state.classes||[]).find(c=>String(c.id)===String(id));}
  function student(classId,index){const c=cls(classId);if(!c)return null;c.studentDetails=c.studentDetails||[];const s=c.studentDetails[index];return s?{c,s,index}:null;}
  function countAdmin(s){return [s.officialAccountAdded,s.prepaidPaid,s.tuitionPaid,s.contractSubmitted,s.ptaReport].filter(Boolean).length;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}try{if(typeof saveState==='function')saveState();else if(typeof pushToSupabase==='function')pushToSupabase();}catch(e){}}
  function modal(){
    let m=document.getElementById('student360Modal');if(m)return m;
    m=document.createElement('div');m.id='student360Modal';m.style.cssText='position:fixed;inset:0;z-index:115;background:#0005;display:none;align-items:flex-end;justify-content:center;padding:10px';
    m.innerHTML='<div class="s360-sheet"><div id="s360Content"></div></div>';document.body.appendChild(m);
    m.onclick=e=>{if(e.target===m)m.style.display='none';};
    const st=document.createElement('style');st.textContent=`
      .s360-sheet{width:min(760px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:24px 24px 18px 18px;padding:18px;box-shadow:0 -12px 36px #0002}
      .s360-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.s360-name{font-size:23px;font-weight:900}.s360-sub{color:var(--muted);font-size:13px;margin-top:4px}
      .s360-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.s360-actions .btn{padding:11px 8px}
      .s360-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.s360-card{border:1px solid var(--line);border-radius:15px;padding:12px;background:#fffdf8}.s360-label{font-size:11px;color:var(--muted);font-weight:750}.s360-value{font-weight:800;margin-top:3px;word-break:break-word}
      .s360-next{margin-top:12px;border:1px solid #eadfb8;background:#fff9e7;border-radius:15px;padding:12px}.s360-next textarea{width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:10px;padding:9px;font:inherit;margin-top:7px}
      .s360-foot{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.s360-foot .btn{flex:1;min-width:120px}
      @media(max-width:600px){.s360-sheet{padding:15px}.s360-grid{grid-template-columns:1fr}.s360-actions{grid-template-columns:repeat(3,1fr)}.s360-name{font-size:21px}}
    `;document.head.appendChild(st);return m;
  }
  function open(classId,index){
    const h=student(classId,index);if(!h)return;const {c,s}=h,m=modal();m.dataset.classId=classId;m.dataset.index=index;
    const done=countAdmin(s),phone=String(s.parentPhone||'').replace(/[^0-9+]/g,'');
    document.getElementById('s360Content').innerHTML=`
      <div class="s360-head"><div><div class="s360-name">${esc(s.chinese)} ${esc(s.english)}</div><div class="s360-sub">${esc(c.code||c.name||'')} · ${esc(s.status||'在讀')}</div></div><button class="btn" id="s360Close">×</button></div>
      <div class="s360-actions"><button class="btn" id="s360Phone">📞 家長</button><button class="btn" id="s360Call">✏️ 電訪</button><button class="btn" id="s360Admin">✓ 行政 ${done}/5</button></div>
      <div class="s360-grid">
        <div class="s360-card"><div class="s360-label">出生年月日</div><div class="s360-value">${esc(s.birthday||'—')}</div></div>
        <div class="s360-card"><div class="s360-label">學校／班級</div><div class="s360-value">${esc(s.school||'—')}</div></div>
        <div class="s360-card"><div class="s360-label">家長電話</div><div class="s360-value">${esc(s.parentPhone||'—')}</div></div>
        <div class="s360-card"><div class="s360-label">行政確認</div><div class="s360-value">${done===5?'✓ 已完成':`待完成 ${5-done} 項`}</div></div>
      </div>
      <div class="s360-next"><b>📌 下一步</b><div class="s360-label">這位學生接下來要記得做什麼？</div><textarea id="s360Next" rows="2" placeholder="例如：開學第一週觀察換老師後的上課狀況">${esc(s.nextAction||'')}</textarea><div style="display:flex;gap:8px;margin-top:8px"><input id="s360NextDate" type="date" value="${esc(s.nextActionDate||'')}" style="flex:1;border:1px solid var(--line);border-radius:10px;padding:9px"><button class="btn primary" id="s360SaveNext">儲存下一步</button></div></div>
      <div class="s360-foot"><button class="btn" id="s360Notebook">📒 記事本</button><button class="btn" id="s360Edit">✏️ 編輯基本資料</button></div>`;
    document.getElementById('s360Close').onclick=()=>m.style.display='none';
    document.getElementById('s360Phone').onclick=()=>{if(phone)location.href='tel:'+phone;else alert('這位學生還沒有家長電話，請先編輯基本資料。');};
    document.getElementById('s360Admin').onclick=()=>{if(typeof openStudentChecklist==='function')openStudentChecklist(classId,index);};
    document.getElementById('s360Call').onclick=()=>{m.style.display='none';if(typeof openCallRecord==='function'){openCallRecord();setTimeout(()=>{try{if(typeof currentCallClassId!=='undefined')currentCallClassId=c.id;if(typeof currentCallStudentIndex!=='undefined')currentCallStudentIndex=index;if(typeof renderCallStudents==='function')renderCallStudents();}catch(e){}},30);}};
    document.getElementById('s360Notebook').onclick=()=>{m.style.display='none';if(typeof openStudentNotebook==='function')openStudentNotebook(c.id,index);};
    document.getElementById('s360Edit').onclick=()=>{if(typeof openStudentEdit==='function')openStudentEdit(c.id,index);};
    document.getElementById('s360SaveNext').onclick=()=>{s.nextAction=document.getElementById('s360Next').value.trim();s.nextActionDate=document.getElementById('s360NextDate').value;save();alert('下一步已儲存');};
    m.style.display='flex';
  }
  window.openStudent360=open;
  // 班級名單：點學生資料區直接進 360 卡；管理按鈕不受影響。
  document.addEventListener('click',e=>{
    if(e.target.closest('button,a,input,textarea,select'))return;
    const row=e.target.closest('#detailStudents .student-table tbody tr');if(!row)return;
    const rows=[...row.parentElement.children],i=rows.indexOf(row);let classId=null;
    try{if(typeof currentDetailClassId!=='undefined')classId=currentDetailClassId;}catch(err){}
    if(classId!=null&&i>=0){e.stopPropagation();open(classId,i);}
  },true);
})();