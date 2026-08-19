(() => {
  'use strict';

  const WORKSPACE_KEY = 'polly-workspace-v1';
  const TYPE_META = {
    event:    { icon:'📚', label:'課程' },
    pickup:   { icon:'🚌', label:'接送' },
    admin:    { icon:'🗂️', label:'行政' },
    task:     { icon:'✓',  label:'待辦' },
    absence:  { icon:'△',  label:'請假' },
    sub:      { icon:'👩‍🏫', label:'代課' },
    intro:    { icon:'📘', label:'課程介紹' },
    trial:    { icon:'🌱', label:'試上' },
    briefing: { icon:'📣', label:'說明會' },
    festival: { icon:'🎉', label:'節慶活動' }
  };

  const esc = (v='') => String(v).replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));

  function getState(){
    try {
      if (typeof state !== 'undefined' && state) return state;
    } catch(e) {}
    try { return JSON.parse(localStorage.getItem(WORKSPACE_KEY) || 'null'); }
    catch(e){ return null; }
  }

  function saveState(){
    try {
      if (typeof persist === 'function') { persist(); return; }
    } catch(e) {}
    const s=getState();
    if(s) localStorage.setItem(WORKSPACE_KEY, JSON.stringify(s));
    try { if(typeof render === 'function') render(); } catch(e) {}
  }

  function localToday(){
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function injectStyles(){
    if(document.getElementById('pollyEnhancementStyles')) return;
    const st=document.createElement('style');
    st.id='pollyEnhancementStyles';
    st.textContent=`
      .polly-task-editable{cursor:pointer;border-radius:8px;padding:3px 5px;margin:-3px -5px;transition:.15s}
      .polly-task-editable:hover{background:#fff7d8}
      .polly-edit-hint{font-size:10px;color:var(--muted,#817b6e);margin-left:6px;text-decoration:none!important}
      #pollyTaskEditModal{display:none;position:fixed;inset:0;background:#0006;z-index:120;align-items:center;justify-content:center;padding:16px}
      #pollyTaskEditModal.open{display:flex}
      #pollyTaskEditModal .polly-sheet{width:min(520px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:22px;padding:20px}
      #pollyTaskEditModal .polly-form{display:grid;gap:11px}
      #pollyTaskEditModal label{font-size:13px;font-weight:700}
      #pollyTaskEditModal input,#pollyTaskEditModal textarea,#pollyTaskEditModal select{width:100%;border:1px solid var(--line,#ece6d7);border-radius:10px;padding:10px;background:#fff}
      #pollyTaskEditModal textarea{min-height:100px;resize:vertical}
      #pollyTaskEditModal .polly-row{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap}
      .polly-timeline{display:grid;gap:8px}
      .polly-time-item{display:grid;grid-template-columns:64px 1fr;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line,#ece6d7)}
      .polly-time-item:last-child{border-bottom:0}
      .polly-time{font-weight:800;font-size:13px;padding-top:2px}
      .polly-time-main{min-width:0}
      .polly-time-title{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-weight:800}
      .polly-kind{font-size:10px;padding:3px 6px;border-radius:999px;background:#fff5cf;font-weight:700}
      .polly-time-note{display:block;color:var(--muted,#817b6e);font-size:12px;line-height:1.5;margin-top:2px;white-space:pre-wrap}
      .polly-time-item.done .polly-time-title{text-decoration:line-through;color:#999}
      .polly-time-item.polly-clickable{cursor:pointer;border-radius:10px;padding-left:6px;padding-right:6px;margin-left:-6px;margin-right:-6px}
      .polly-time-item.polly-clickable:hover{background:#fffdf2}
      .polly-timeline-help{font-size:12px;color:var(--muted,#817b6e);margin:-5px 0 10px;line-height:1.5}
      @media(max-width:620px){
        .polly-time-item{grid-template-columns:54px 1fr;gap:8px}
        #pollyTaskEditModal .polly-sheet{padding:16px 14px 22px}
      }
    `;
    document.head.appendChild(st);
  }

  function buildTaskEditor(){
    if(document.getElementById('pollyTaskEditModal')) return;
    const m=document.createElement('div');
    m.id='pollyTaskEditModal';
    m.innerHTML=`<div class="polly-sheet">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:14px">
        <h2 style="margin:0;font-size:20px">✏️ 編輯待辦</h2>
        <button class="btn" type="button" id="pollyTaskEditClose">✕</button>
      </div>
      <input type="hidden" id="pollyTaskEditId">
      <div class="polly-form">
        <label>待辦名稱<input id="pollyTaskEditTitle" placeholder="要做什麼？"></label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <label>日期<input id="pollyTaskEditDate" type="date"></label>
          <label>時間（選填）<input id="pollyTaskEditTime" type="time"></label>
        </div>
        <label>類別<select id="pollyTaskEditCategory">
          <option value="task">待辦</option>
          <option value="admin">行政工作</option>
          <option value="pickup">接送</option>
        </select></label>
        <label>備註<textarea id="pollyTaskEditNote" placeholder="補充內容、要追蹤的事情…"></textarea></label>
      </div>
      <div class="polly-row" style="justify-content:space-between">
        <button class="btn danger" type="button" id="pollyTaskEditDelete">🗑️ 刪除</button>
        <div style="display:flex;gap:8px">
          <button class="btn" type="button" id="pollyTaskEditCancel">取消</button>
          <button class="btn primary" type="button" id="pollyTaskEditSave">儲存修改</button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(m);
    const close=()=>m.classList.remove('open');
    document.getElementById('pollyTaskEditClose').onclick=close;
    document.getElementById('pollyTaskEditCancel').onclick=close;
    m.addEventListener('click',e=>{ if(e.target===m) close(); });
    document.getElementById('pollyTaskEditSave').onclick=saveTaskEdit;
    document.getElementById('pollyTaskEditDelete').onclick=deleteTaskEdit;
  }

  function openTaskEditor(id){
    const s=getState(); if(!s) return;
    const r=(s.records||[]).find(x=>String(x.id)===String(id));
    if(!r) return alert('找不到這筆待辦');
    document.getElementById('pollyTaskEditId').value=r.id;
    document.getElementById('pollyTaskEditTitle').value=r.title||'';
    document.getElementById('pollyTaskEditDate').value=r.date||'';
    document.getElementById('pollyTaskEditTime').value=r.time||'';
    document.getElementById('pollyTaskEditNote').value=r.note||'';
    document.getElementById('pollyTaskEditCategory').value=['admin','pickup'].includes(r.type)?r.type:'task';
    document.getElementById('pollyTaskEditModal').classList.add('open');
    setTimeout(()=>document.getElementById('pollyTaskEditTitle').focus(),20);
  }

  function saveTaskEdit(){
    const s=getState(); if(!s) return;
    const id=document.getElementById('pollyTaskEditId').value;
    const r=(s.records||[]).find(x=>String(x.id)===String(id));
    if(!r) return alert('找不到這筆待辦');
    const title=document.getElementById('pollyTaskEditTitle').value.trim();
    if(!title) return alert('請輸入待辦名稱');
    r.title=title;
    r.date=document.getElementById('pollyTaskEditDate').value||'';
    r.time=document.getElementById('pollyTaskEditTime').value||'';
    r.note=document.getElementById('pollyTaskEditNote').value.trim();
    r.type=document.getElementById('pollyTaskEditCategory').value||'task';
    document.getElementById('pollyTaskEditModal').classList.remove('open');
    saveState();
  }

  function deleteTaskEdit(){
    const s=getState(); if(!s) return;
    const id=document.getElementById('pollyTaskEditId').value;
    const r=(s.records||[]).find(x=>String(x.id)===String(id));
    if(!r) return;
    if(!confirm(`確定刪除「${r.title||'這筆待辦'}」嗎？`)) return;
    s.records=s.records.filter(x=>String(x.id)!==String(id));
    document.getElementById('pollyTaskEditModal').classList.remove('open');
    saveState();
  }

  function patchTaskLists(){
    const s=getState(); if(!s) return;
    const taskTypes=new Set(['task','admin','pickup']);
    const all=(s.records||[]).filter(x=>taskTypes.has(x.type));
    const pending=all.filter(x=>!x.done);
    const taskHtml=(r,longDelete=false)=>`<div class="task ${r.done?'done':''}">
      <input type="checkbox" ${r.done?'checked':''} onchange="toggleTask(${JSON.stringify(r.id)})">
      <span class="grow polly-task-editable" data-polly-task-id="${esc(r.id)}" title="點一下可修改">
        ${esc(r.title)}<span class="polly-edit-hint">✏️</span>
        <small style="display:block;color:var(--muted)">${esc(r.date||'未設定日期')}${r.time?' · '+esc(r.time):''}${r.note?' · '+esc(r.note):''}</small>
      </span>
      <button class="btn danger" onclick="delRecord(${JSON.stringify(r.id)})">${longDelete?'刪除':'刪'}</button>
    </div>`;
    const td=document.getElementById('todayTasks');
    if(td) td.innerHTML=pending.slice(0,6).map(r=>taskHtml(r,false)).join('')||'<div class="empty">沒有待辦 🎉</div>';
    const at=document.getElementById('allTasks');
    if(at) at.innerHTML=all.map(r=>taskHtml(r,true)).join('')||'<div class="empty">目前沒有待辦</div>';
    document.querySelectorAll('[data-polly-task-id]').forEach(el=>{
      el.onclick=(e)=>{ e.stopPropagation(); openTaskEditor(el.dataset.pollyTaskId); };
    });
    const count=document.getElementById('todoCount');
    if(count) count.textContent=pending.length;
  }

  function parseRocDate(v){
    if(!v) return '';
    const m=String(v).match(/^(\d{2,3})\/(\d{1,2})\/(\d{1,2})$/);
    if(!m) return String(v).slice(0,10);
    return `${Number(m[1])+1911}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
  }

  function classMatchesToday(c,dateStr){
    const start=parseRocDate(c.start), end=parseRocDate(c.end);
    if(start && dateStr<start) return false;
    if(end && dateStr>end) return false;
    const day=new Date(dateStr+'T12:00:00').getDay();
    const map={0:'U',1:'M',2:'T',3:'W',4:'R',5:'F',6:'S'};
    const zh={0:'日',1:'一',2:'二',3:'三',4:'四',5:'五',6:'六'};
    const sch=String(c.schedule||'').toUpperCase();
    const beforeTime=sch.split(/\d{1,2}:\d{2}/)[0];
    if(/[MTWRFSU]/.test(beforeTime)) return beforeTime.includes(map[day]);
    return String(c.schedule||'').includes(zh[day]);
  }

  function classTime(c){
    const m=String(c.schedule||'').match(/(\d{1,2}:\d{2})\s*[~～\-–—]\s*(\d{1,2}:\d{2})/);
    return m?{time:m[1],range:`${m[1]}–${m[2]}`}:{time:'',range:''};
  }

  function recordKind(r){
    if(r.type==='task'){
      if(/接送|接\s|接回|校門|交通車/.test(r.title||'')) return {icon:'🚌',label:'接送'};
      if(/月結|電訪|出勤|點名|教材|聯絡本|訂正|行政|名單|報表|影印|列印|招生/.test((r.title||'')+' '+(r.note||''))) return {icon:'🗂️',label:'行政'};
    }
    return TYPE_META[r.type]||{icon:'•',label:'事項'};
  }

  function renderDailyTimeline(){
    const box=document.getElementById('todayEvents');
    const s=getState();
    if(!box||!s) return;
    const t=localToday();
    const items=[];

    (s.classes||[]).forEach(c=>{
      if(!classMatchesToday(c,t)) return;
      const ct=classTime(c);
      items.push({
        source:'class', time:ct.time, displayTime:ct.range||'課程',
        title:c.code||c.name||'班級', note:[c.teacher?`Teacher ${c.teacher}`:'',c.schedule||''].filter(Boolean).join(' · '),
        icon:'📚', label:'班級', sort:ct.time||'99:90'
      });
    });

    (s.records||[]).filter(r=>r.date===t).forEach(r=>{
      const k=recordKind(r);
      items.push({
        source:'record', id:r.id, type:r.type, done:!!r.done,
        time:r.time||'', displayTime:r.time||(!r.time&&['task','admin','pickup'].includes(r.type)?'待辦':'—'),
        title:r.title||'', note:r.note||'', icon:k.icon, label:k.label,
        sort:r.time||(['task','admin','pickup'].includes(r.type)?'99:91':'99:90')
      });
    });

    items.sort((a,b)=>a.sort.localeCompare(b.sort)||String(a.title).localeCompare(String(b.title),'zh-Hant'));
    const h2=box.closest('.card')?.querySelector('.section-title h2');
    if(h2) h2.textContent='今天的工作時間軸';
    let help=box.parentElement?.querySelector('.polly-timeline-help');
    if(!help && box.parentElement){
      help=document.createElement('div');
      help.className='polly-timeline-help';
      help.textContent='把今天的班級、接送、行政、待辦與特殊事項排在一起；待辦只建一次，就會同步出現在這裡。';
      box.parentElement.insertBefore(help,box);
    }
    box.classList.add('polly-timeline');
    box.innerHTML=items.length?items.map(x=>{
      const editable=x.source==='record'&&['task','admin','pickup'].includes(x.type);
      return `<div class="polly-time-item ${x.done?'done':''} ${editable?'polly-clickable':''}" ${editable?`data-polly-timeline-task="${esc(x.id)}"`:''}>
        <div class="polly-time">${esc(x.displayTime)}</div>
        <div class="polly-time-main">
          <div class="polly-time-title"><span>${x.icon}</span><span class="polly-kind">${esc(x.label)}</span><span>${esc(x.title)}</span>${editable?'<span class="polly-edit-hint">✏️</span>':''}</div>
          ${x.note?`<small class="polly-time-note">${esc(x.note)}</small>`:''}
        </div>
      </div>`;
    }).join(''):'<div class="empty">今天還沒有工作安排</div>';
    box.querySelectorAll('[data-polly-timeline-task]').forEach(el=>{
      el.onclick=()=>openTaskEditor(el.dataset.pollyTimelineTask);
    });
  }

  function addQuickTypes(){
    const sel=document.getElementById('qType');
    if(!sel) return;
    const add=(value,label)=>{
      if([...sel.options].some(o=>o.value===value)) return;
      const o=document.createElement('option'); o.value=value; o.textContent=label; sel.appendChild(o);
    };
    add('pickup','接送');
    add('admin','行政工作');
  }

  function wrapTypeChanged(){
    try {
      if(typeof typeChanged!=='function' || typeChanged.__pollyWrapped) return;
      const base=typeChanged;
      typeChanged=function(){
        base();
        const val=document.getElementById('qType')?.value;
        const tl=document.getElementById('timeLabel');
        if(tl && ['task','pickup','admin'].includes(val)) tl.style.display='block';
        const title=document.getElementById('qTitle');
        const note=document.getElementById('qNote');
        if(val==='pickup'){
          if(title) title.placeholder='例如：12:40 天母國小接學生';
          if(note) note.placeholder='學校、學生、接回校區或其他提醒…';
        } else if(val==='admin'){
          if(title) title.placeholder='例如：月底月結／完成本月電訪';
          if(note) note.placeholder='行政工作內容、截止日、要準備的資料…';
        } else if(val==='task'){
          if(title) title.placeholder='例如：檢查老師教案／拍缺課聯絡本';
        }
      };
      typeChanged.__pollyWrapped=true;
    } catch(e) { console.warn('Polly typeChanged enhancement skipped',e); }
  }

  function wrapRender(){
    try {
      if(typeof render!=='function' || render.__pollyEnhanced) return;
      const base=render;
      render=function(){
        base();
        try { patchTaskLists(); } catch(e){ console.warn(e); }
        try { renderDailyTimeline(); } catch(e){ console.warn(e); }
        try { addQuickTypes(); } catch(e){ console.warn(e); }
      };
      render.__pollyEnhanced=true;
    } catch(e){ console.warn('Polly render enhancement skipped',e); }
  }

  function init(){
    injectStyles();
    buildTaskEditor();
    addQuickTypes();
    wrapTypeChanged();
    wrapRender();
    try { patchTaskLists(); } catch(e){ console.warn(e); }
    try { renderDailyTimeline(); } catch(e){ console.warn(e); }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();