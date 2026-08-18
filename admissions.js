(() => {
  const KEY = 'polly_admissions_v1';
  const priorities = {
    urgent: {label:'極重要', color:'#c94f4f', bg:'#fff0f0'},
    high: {label:'重要', color:'#d9822b', bg:'#fff5e8'},
    normal: {label:'一般', color:'#6a7a62', bg:'#f4f7f2'},
    low: {label:'低', color:'#7c7c7c', bg:'#f7f7f7'}
  };
  const statuses = ['新名單','待聯絡','已聯絡','預約測試','預約體驗','考慮中','待追蹤','已報名','未成班','暫不考慮'];
  const sources = ['路過／店家','家長介紹','兄弟姊妹','Facebook','LINE','Google','活動','舊生回流','其他'];

  function load(){ try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e){ return []; } }
  function save(data){ localStorage.setItem(KEY, JSON.stringify(data)); }
  let leads = load();
  let editingId = null;

  function esc(v=''){ return String(v).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function today(){ return new Date().toISOString().slice(0,10); }
  function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

  function injectStyles(){
    const s=document.createElement('style');
    s.textContent=`
      #admissionOverlay{display:none;position:fixed;inset:0;background:#fffdf7;z-index:90;overflow:auto;color:var(--ink,#3f3b32)}
      #admissionOverlay.open{display:block}
      .adm-top{position:sticky;top:0;z-index:2;background:#fff2cc;border-bottom:1px solid #eadcae;padding:12px 16px;display:flex;align-items:center;gap:10px;justify-content:space-between}
      .adm-top h2{margin:0;font-size:20px}.adm-wrap{max-width:1080px;margin:auto;padding:18px 16px 100px}
      .adm-actions{display:flex;gap:8px;flex-wrap:wrap}.adm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}
      .adm-stat{background:white;border:1px solid #ece6d7;border-radius:16px;padding:14px}.adm-stat b{font-size:24px;display:block}.adm-stat span{font-size:12px;color:#817b6e}
      .adm-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.adm-toolbar input,.adm-toolbar select{border:1px solid #ece6d7;border-radius:10px;padding:10px;background:#fff}.adm-toolbar input{flex:1;min-width:180px}
      .adm-list{display:grid;gap:10px}.adm-card{background:#fff;border:1px solid #ece6d7;border-radius:16px;padding:14px;box-shadow:0 2px 8px rgba(80,65,20,.04)}
      .adm-card-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.adm-name{font-size:18px;font-weight:800}.adm-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.adm-tag{font-size:11px;padding:4px 7px;border-radius:999px;background:#fff5cf}
      .adm-meta{font-size:13px;line-height:1.7;color:#817b6e;margin-top:10px}.adm-note{margin-top:8px;padding:9px 10px;background:#fff9e7;border-radius:10px;white-space:pre-wrap}.adm-card-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
      .adm-btn{border:1px solid #ece6d7;background:#fff;border-radius:10px;padding:8px 11px;cursor:pointer}.adm-btn.primary{background:#e9c768;border-color:#e9c768;font-weight:700}.adm-btn.danger{color:#c85d53}
      #admModal{display:none;position:fixed;inset:0;background:#0006;z-index:100;align-items:center;justify-content:center;padding:14px}#admModal.open{display:flex}.adm-sheet{width:min(620px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:20px;padding:18px}.adm-sheet h3{margin:0 0 12px}.adm-form{display:grid;grid-template-columns:1fr 1fr;gap:10px}.adm-form label{font-size:12px;font-weight:700}.adm-form input,.adm-form select,.adm-form textarea{width:100%;border:1px solid #ece6d7;border-radius:10px;padding:9px;background:#fff}.adm-form textarea{min-height:86px}.adm-span2{grid-column:1/-1}.adm-empty{text-align:center;color:#817b6e;padding:38px 10px;background:#fff;border:1px dashed #e1d5ae;border-radius:16px}
      @media(max-width:700px){.adm-grid{grid-template-columns:1fr 1fr}.adm-form{grid-template-columns:1fr}.adm-span2{grid-column:auto}.adm-top{align-items:flex-start}.adm-card-top{flex-direction:column}}
    `;
    document.head.appendChild(s);
  }

  function buildUI(){
    const topActions=document.querySelector('.top-actions');
    if(topActions && !document.getElementById('admissionOpenBtn')){
      const b=document.createElement('button');
      b.id='admissionOpenBtn'; b.className='btn'; b.innerHTML='🎯 招生'; b.onclick=openAdmissions;
      topActions.insertBefore(b, topActions.firstChild);
    }
    const o=document.createElement('div'); o.id='admissionOverlay';
    o.innerHTML=`<div class="adm-top"><div><h2>🎯 招生工作區</h2><div style="font-size:12px;color:#817b6e;margin-top:2px">潛在學生、家長需求與後續追蹤</div></div><div class="adm-actions"><button class="adm-btn primary" id="admAdd">＋ 新增招生名單</button><button class="adm-btn" id="admClose">返回工作台</button></div></div>
    <div class="adm-wrap">
      <div class="adm-grid"><div class="adm-stat"><b id="admTotal">0</b><span>招生名單</span></div><div class="adm-stat"><b id="admUrgent">0</b><span>極重要／重要</span></div><div class="adm-stat"><b id="admFollow">0</b><span>今天前需追蹤</span></div><div class="adm-stat"><b id="admJoined">0</b><span>已報名</span></div></div>
      <div class="adm-toolbar"><input id="admSearch" placeholder="搜尋孩子、家長、電話、需求…"><select id="admStatusFilter"><option value="">全部狀態</option>${statuses.map(x=>`<option>${x}</option>`).join('')}</select><select id="admPriorityFilter"><option value="">全部重要度</option>${Object.entries(priorities).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select></div>
      <div id="admList" class="adm-list"></div>
    </div>`;
    document.body.appendChild(o);

    const m=document.createElement('div'); m.id='admModal';
    m.innerHTML=`<div class="adm-sheet"><h3 id="admModalTitle">新增招生名單</h3><div class="adm-form">
      <label>孩子姓名<input id="admChild" placeholder="中文或英文姓名"></label><label>家長稱呼<input id="admParent" placeholder="例如：Emma 媽媽"></label>
      <label>聯絡方式<input id="admContact" placeholder="電話／LINE"></label><label>年級／年齡<input id="admAge" placeholder="例如：小一、5歲"></label>
      <label>學校<input id="admSchool" placeholder="學校／幼兒園"></label><label>想了解的班級<input id="admClass" placeholder="例如：自然發音班、1A"></label>
      <label>招生來源<select id="admSource">${sources.map(x=>`<option>${x}</option>`).join('')}</select></label><label>狀態<select id="admStatus">${statuses.map(x=>`<option>${x}</option>`).join('')}</select></label>
      <label>重要程度<select id="admPriority">${Object.entries(priorities).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select></label><label>下次追蹤日期<input id="admFollowDate" type="date"></label>
      <label class="adm-span2">家長需求／孩子狀況<textarea id="admNeed" placeholder="例如：希望二四班、需要接送、零基礎、兄妹一起…"></textarea></label>
      <label class="adm-span2">聯絡紀錄／備註<textarea id="admNote" placeholder="記錄今天談了什麼、下一步要做什麼"></textarea></label>
    </div><div class="adm-card-actions" style="justify-content:flex-end;margin-top:14px"><button class="adm-btn" id="admCancel">取消</button><button class="adm-btn primary" id="admSave">儲存</button></div></div>`;
    document.body.appendChild(m);

    document.getElementById('admClose').onclick=closeAdmissions;
    document.getElementById('admAdd').onclick=()=>openForm();
    document.getElementById('admCancel').onclick=()=>m.classList.remove('open');
    document.getElementById('admSave').onclick=saveForm;
    document.getElementById('admSearch').oninput=render;
    document.getElementById('admStatusFilter').onchange=render;
    document.getElementById('admPriorityFilter').onchange=render;
    m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')});
  }

  function openAdmissions(){ document.getElementById('admissionOverlay').classList.add('open'); document.body.style.overflow='hidden'; render(); }
  function closeAdmissions(){ document.getElementById('admissionOverlay').classList.remove('open'); document.body.style.overflow=''; }

  function openForm(id){
    editingId=id||null;
    const x=id?leads.find(a=>a.id===id):null;
    document.getElementById('admModalTitle').textContent=x?'編輯招生名單':'新增招生名單';
    const set=(id,v='')=>document.getElementById(id).value=v;
    set('admChild',x?.child); set('admParent',x?.parent); set('admContact',x?.contact); set('admAge',x?.age); set('admSchool',x?.school); set('admClass',x?.targetClass); set('admSource',x?.source||sources[0]); set('admStatus',x?.status||statuses[0]); set('admPriority',x?.priority||'normal'); set('admFollowDate',x?.followDate); set('admNeed',x?.need); set('admNote',x?.note);
    document.getElementById('admModal').classList.add('open');
  }

  function saveForm(){
    const g=id=>document.getElementById(id).value.trim();
    const child=g('admChild'); if(!child){alert('請輸入孩子姓名');return;}
    const obj={id:editingId||uid(),child,parent:g('admParent'),contact:g('admContact'),age:g('admAge'),school:g('admSchool'),targetClass:g('admClass'),source:g('admSource'),status:g('admStatus'),priority:g('admPriority'),followDate:g('admFollowDate'),need:g('admNeed'),note:g('admNote'),updatedAt:new Date().toISOString()};
    if(editingId){ const i=leads.findIndex(x=>x.id===editingId); if(i>=0) leads[i]={...leads[i],...obj}; }
    else leads.unshift({...obj,createdAt:new Date().toISOString()});
    save(leads); document.getElementById('admModal').classList.remove('open'); render();
  }

  function removeLead(id){ const x=leads.find(a=>a.id===id); if(!x||!confirm(`確定刪除「${x.child}」的招生紀錄嗎？`))return; leads=leads.filter(a=>a.id!==id); save(leads); render(); }
  function markJoined(id){ const x=leads.find(a=>a.id===id); if(!x)return; x.status='已報名'; x.updatedAt=new Date().toISOString(); save(leads); render(); }
  async function copyLead(id){
    const x=leads.find(a=>a.id===id); if(!x)return;
    const text=`【招生追蹤】\n孩子：${x.child}${x.age?'｜'+x.age:''}${x.school?'｜'+x.school:''}\n家長：${x.parent||'-'}\n聯絡：${x.contact||'-'}\n班級需求：${x.targetClass||'-'}\n狀態：${x.status}｜${priorities[x.priority]?.label||'一般'}\n需求：${x.need||'-'}\n備註：${x.note||'-'}\n下次追蹤：${x.followDate||'-'}`;
    try{await navigator.clipboard.writeText(text);alert('已複製招生紀錄');}catch(e){prompt('請複製以下內容',text);}
  }

  function render(){
    const q=(document.getElementById('admSearch')?.value||'').toLowerCase();
    const sf=document.getElementById('admStatusFilter')?.value||'';
    const pf=document.getElementById('admPriorityFilter')?.value||'';
    const filtered=leads.filter(x=>{const hay=[x.child,x.parent,x.contact,x.age,x.school,x.targetClass,x.need,x.note,x.source].join(' ').toLowerCase();return(!q||hay.includes(q))&&(!sf||x.status===sf)&&(!pf||x.priority===pf)});
    const t=today();
    document.getElementById('admTotal').textContent=leads.length;
    document.getElementById('admUrgent').textContent=leads.filter(x=>['urgent','high'].includes(x.priority)&&x.status!=='已報名').length;
    document.getElementById('admFollow').textContent=leads.filter(x=>x.followDate&&x.followDate<=t&&!['已報名','暫不考慮'].includes(x.status)).length;
    document.getElementById('admJoined').textContent=leads.filter(x=>x.status==='已報名').length;
    const box=document.getElementById('admList');
    if(!filtered.length){box.innerHTML='<div class="adm-empty">目前沒有符合的招生紀錄。<br>按「＋ 新增招生名單」開始記錄。</div>';return;}
    box.innerHTML=filtered.map(x=>{const p=priorities[x.priority]||priorities.normal;const overdue=x.followDate&&x.followDate<=t&&!['已報名','暫不考慮'].includes(x.status);return `<div class="adm-card" style="border-left:5px solid ${p.color}"><div class="adm-card-top"><div><div class="adm-name">${esc(x.child)}</div><div class="adm-tags"><span class="adm-tag" style="background:${p.bg};color:${p.color}">${p.label}</span><span class="adm-tag">${esc(x.status||'新名單')}</span>${x.targetClass?`<span class="adm-tag">${esc(x.targetClass)}</span>`:''}${x.source?`<span class="adm-tag">來源：${esc(x.source)}</span>`:''}</div></div><div style="font-size:12px;color:${overdue?'#c85d53':'#817b6e'}">${x.followDate?(overdue?'⚠️ ':'')+'追蹤 '+esc(x.followDate):'未設定追蹤日'}</div></div><div class="adm-meta">${x.parent?'家長：<b>'+esc(x.parent)+'</b>　':''}${x.contact?'聯絡：'+esc(x.contact)+'　':''}${x.age?'年級／年齡：'+esc(x.age)+'　':''}${x.school?'學校：'+esc(x.school):''}</div>${x.need?`<div class="adm-note"><b>需求：</b>${esc(x.need)}</div>`:''}${x.note?`<div class="adm-note"><b>紀錄：</b>${esc(x.note)}</div>`:''}<div class="adm-card-actions"><button class="adm-btn" data-edit="${x.id}">編輯</button><button class="adm-btn" data-copy="${x.id}">複製紀錄</button>${x.status!=='已報名'?`<button class="adm-btn primary" data-joined="${x.id}">✓ 已報名</button>`:''}<button class="adm-btn danger" data-del="${x.id}">刪除</button></div></div>`}).join('');
    box.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openForm(b.dataset.edit));
    box.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>copyLead(b.dataset.copy));
    box.querySelectorAll('[data-joined]').forEach(b=>b.onclick=()=>markJoined(b.dataset.joined));
    box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>removeLead(b.dataset.del));
  }

  injectStyles(); buildUI(); render();
})();