// Polly 工作台：準備工作＋行政工作＋首頁瘦身 v3
(function(){
  const STORE='polly_work_prep_v2';
  const LEGACY='polly_work_prep_v1';
  const WORKFLOW='polly_class_workflow_v1';
  const defaultPrep={school:{},camp:{}};
  const ELEMENTARY=['確認學生名單','學生通訊錄製作','打開課電話','準備教材','準備姓名貼','催費','準備聯絡本','準備通知單｜定型化契約','準備通知單｜課程介紹信','準備通知單｜請假退費辦法','準備通知單｜代辦必發','準備通知單｜行事曆','教材歸位','準備考試卷','準備學習單'];
  const KINDER=ELEMENTARY.filter(x=>!['準備考試卷','準備學習單'].includes(x));
  let data=load();

  function load(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORE)||'null');
      if(saved)return saved;
      const legacy=JSON.parse(localStorage.getItem(LEGACY)||'null');
      const fresh={prep:JSON.parse(JSON.stringify(defaultPrep)),admin:[]};
      if(legacy&&Array.isArray(legacy.admin))fresh.admin=legacy.admin;
      return fresh;
    }catch(e){return {prep:JSON.parse(JSON.stringify(defaultPrep)),admin:[]};}
  }
  function save(){try{localStorage.setItem(STORE,JSON.stringify(data));window.dispatchEvent(new Event('polly-data-changed'));}catch(e){}}
  function esc(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}

  function classes(){
    let all=[];
    try{if(typeof state!=='undefined'&&state&&Array.isArray(state.classes))all=all.concat(state.classes);}catch(e){}
    if(!all.length){try{if(typeof POLLY_CLASS_DATA!=='undefined'&&Array.isArray(POLLY_CLASS_DATA))all=all.concat(POLLY_CLASS_DATA.map((c,i)=>({id:c.id||c.code||i,code:c.code,name:c.name,start:c.start,end:c.end,status:c.status,students:c.students})));}catch(e){}}
    try{const wf=JSON.parse(localStorage.getItem(WORKFLOW)||'null');if(wf&&Array.isArray(wf.extraClasses))all=all.concat(wf.extraClasses);}catch(e){}
    const seen=new Set();return all.filter(c=>{const k=classKey(c);if(!k||seen.has(k))return false;seen.add(k);return true;});
  }
  function classKey(c){return String(c.code||c.id||c.name||'').trim();}
  function classType(c){if(c.workflowType)return c.workflowType;const code=String(c.code||c.name||'').toUpperCase();return /(^|-)PH[A-Z0-9]*($|-)/.test(code)||/^PH/.test(String(c.name||'').toUpperCase())?'幼兒園部':'國小部';}
  function groupName(c){const t=classType(c);return t==='幼兒園部'?'幼兒園部':'國小部';}
  function isCamp(c){return classType(c)==='冬夏令營';}
  function classLabel(c){return [c.name,c.code&&c.code!==c.name?c.code:''].filter(Boolean).join(' · ');}
  function ensureClass(secId,c){
    data.prep[secId]=data.prep[secId]||{};const k=classKey(c);
    if(!data.prep[secId][k])data.prep[secId][k]={items:[],note:'',templateInitialized:false};
    const rec=data.prep[secId][k];rec.items=Array.isArray(rec.items)?rec.items:[];
    if(secId==='school'&&!rec.templateInitialized&&rec.items.length===0){
      const tpl=groupName(c)==='幼兒園部'?KINDER:ELEMENTARY;
      rec.items=tpl.map(title=>({id:uid(),title,done:false,date:'',note:''}));rec.templateInitialized=true;save();
    }
    return rec;
  }

  function removeDuplicateUI(){
    ['todayTasks','todaySpecial'].forEach(id=>{const el=document.getElementById(id);const card=el&&el.closest('.card');if(card)card.remove();});
    const today=document.getElementById('today');
    if(today){const grid=today.querySelector('.grid');if(grid){[...grid.children].forEach(ch=>{if(!ch.querySelector('.card'))ch.remove();});if(grid.children.length===1)grid.style.gridTemplateColumns='1fr';}}
    const work=document.getElementById('work');
    if(work){[...work.children].forEach(ch=>{if(ch.id==='pollyWorkPrep')return;if(ch.classList&&ch.classList.contains('section-title'))ch.remove();else if(ch.querySelector&&ch.querySelector('#allTasks'))ch.remove();});}
  }

  function ensureWorkPage(){
    const work=document.getElementById('work')||[...document.querySelectorAll('.page')].find(p=>/工作/.test((p.querySelector('h1')||{}).textContent||''));
    if(!work)return;
    let host=work.querySelector('#pollyWorkPrep');
    if(!host){host=document.createElement('div');host.id='pollyWorkPrep';work.prepend(host);}
    render(host);removeDuplicateUI();
  }

  function render(host){
    host.innerHTML=`
      <div class="section-title"><div><h1 style="margin:0">工作</h1><small style="color:var(--muted)">準備工作與固定行政集中在這裡</small></div></div>
      <div class="card"><div class="section-title"><h2>🎒 開學準備</h2></div><div id="schoolPrep"></div></div>
      <div class="card" style="margin-top:14px"><div class="section-title"><h2>☀️❄️ 冬／夏令營準備</h2></div><div id="campPrep"></div></div>
      <div class="card" style="margin-top:14px"><div class="section-title"><h2>📋 行政工作</h2><button class="btn" id="addAdmin">＋ 新增</button></div><div id="adminItems"></div></div>`;
    renderPrepSection(host.querySelector('#schoolPrep'),'school',host);
    renderPrepSection(host.querySelector('#campPrep'),'camp',host);
    host.querySelector('#addAdmin').onclick=()=>addAdmin(host);renderAdmin(host);
  }

  function renderPrepSection(box,secId,host){
    const all=classes();
    if(secId==='camp'){
      const cs=all.filter(isCamp);const wrap=document.createElement('div');wrap.style.cssText='border-top:1px solid var(--line);padding:12px 0';
      wrap.innerHTML='<div class="prepClassList"></div>';const list=wrap.querySelector('.prepClassList');
      if(!cs.length)list.innerHTML='<div class="empty">目前沒有冬／夏令營班級，可從班級管理新增</div>';
      cs.forEach(c=>list.appendChild(classCard(secId,c,host)));box.appendChild(wrap);return;
    }
    ['國小部','幼兒園部'].forEach(group=>{
      const cs=all.filter(c=>!isCamp(c)&&groupName(c)===group);
      const wrap=document.createElement('div');wrap.style.cssText='border-top:1px solid var(--line);padding:12px 0';
      wrap.innerHTML=`<div style="font-weight:850;font-size:17px;margin-bottom:8px">${group}</div><div class="prepClassList"></div>`;
      const list=wrap.querySelector('.prepClassList');if(!cs.length)list.innerHTML='<div class="empty">目前沒有班級資料</div>';
      cs.forEach(c=>list.appendChild(classCard(secId,c,host)));box.appendChild(wrap);
    });
  }

  function classCard(secId,c,host){
    const rec=ensureClass(secId,c),items=rec.items||[],done=items.filter(x=>x.done).length;
    const card=document.createElement('div');card.style.cssText='margin:9px 0;border:1px solid var(--line);border-radius:14px;background:#fffdf8;overflow:hidden';
    card.innerHTML=`<div class="prepClassHead" style="display:flex;align-items:center;gap:10px;padding:12px;cursor:pointer"><div style="flex:1"><b style="font-size:16px">${esc(classLabel(c))}</b><div style="font-size:12px;color:var(--muted);margin-top:3px">${esc(c.start||'')}${c.end?' ～ '+esc(c.end):''}</div></div><span class="badge">${done}/${items.length}</span><span class="prepArrow">›</span></div><div class="prepClassBody" style="display:none;border-top:1px solid var(--line);padding:10px 12px"><div class="prepItems"></div><button class="btn addItem" style="width:100%;margin-top:8px">＋ 新增確認事項</button></div>`;
    const body=card.querySelector('.prepClassBody'),arrow=card.querySelector('.prepArrow');
    card.querySelector('.prepClassHead').onclick=()=>{const open=body.style.display!=='none';body.style.display=open?'none':'block';arrow.textContent=open?'›':'⌄';};
    const list=card.querySelector('.prepItems');if(!items.length)list.innerHTML='<div class="empty">尚未建立確認事項</div>';
    items.forEach(it=>list.appendChild(itemRow(it,()=>{rec.items=rec.items.filter(x=>x.id!==it.id);save();render(host);},()=>editItem(it,()=>{save();render(host);} ))));
    card.querySelector('.addItem').onclick=e=>{e.stopPropagation();const v=promptItem();if(!v)return;rec.items.push({id:uid(),done:false,...v});save();render(host);setTimeout(()=>{const heads=[...host.querySelectorAll('.prepClassHead')];const h=heads.find(x=>(x.innerText||'').includes(c.name||c.code));if(h)h.click();},0);};
    return card;
  }

  function renderAdmin(host){const ai=host.querySelector('#adminItems');ai.innerHTML='';(data.admin||[]).forEach(it=>ai.appendChild(itemRow(it,()=>{data.admin=data.admin.filter(x=>x.id!==it.id);save();render(host);},()=>editItem(it,()=>{save();render(host);} ))));if(!data.admin.length)ai.innerHTML='<div class="empty">尚未建立行政工作</div>';}
  function itemRow(it,onDelete,onEdit){const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--line)';row.innerHTML=`<input type="checkbox" ${it.done?'checked':''} style="width:20px;height:20px"><div style="flex:1"><b>${esc(it.title)}</b>${it.date?`<div style="font-size:12px;color:var(--muted)">${esc(it.date)}</div>`:''}${it.note?`<div style="font-size:12px;color:var(--muted)">${esc(it.note)}</div>`:''}</div><button class="btn edit">編輯</button><button class="btn danger del">刪除</button>`;row.querySelector('input').onchange=e=>{it.done=e.target.checked;save();};row.querySelector('.edit').onclick=onEdit;row.querySelector('.del').onclick=()=>{if(confirm(`確定刪除「${it.title}」嗎？`))onDelete();};return row;}
  function promptItem(seed={}){const title=prompt('事項名稱',seed.title||'');if(!title)return null;const date=prompt('截止／發生日期（可留空，例如 2026-08-30）',seed.date||'')||'';const note=prompt('備註（可留空）',seed.note||'')||'';return {title:title.trim(),date:date.trim(),note:note.trim()};}
  function addAdmin(host){const v=promptItem();if(!v)return;data.admin=data.admin||[];data.admin.push({id:uid(),done:false,...v});save();render(host);}
  function editItem(it,done){const v=promptItem(it);if(!v)return;Object.assign(it,v);done();}

  function init(){ensureWorkPage();removeDuplicateUI();setTimeout(()=>{ensureWorkPage();removeDuplicateUI();},700);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,500));else setTimeout(init,500);
  document.addEventListener('click',()=>setTimeout(removeDuplicateUI,30));
})();