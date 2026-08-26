// Polly 工作台：準備工作＋行政工作＋首頁瘦身
(function(){
  const STORE='polly_work_prep_v1';
  const defaults={
    prep:[
      {id:'school',title:'🎒 開學準備',groups:[{name:'國小部',items:[]},{name:'幼兒園部',items:[]}]},
      {id:'camp',title:'☀️❄️ 冬／夏令營準備',groups:[{name:'國小部',items:[]},{name:'幼兒園部',items:[]}]}
    ],
    admin:[]
  };
  function load(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(STORE)||'{}'));}catch(e){return JSON.parse(JSON.stringify(defaults));}}
  let data=load();
  function save(){localStorage.setItem(STORE,JSON.stringify(data));}
  function esc(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
  function hideDuplicates(){
    document.querySelectorAll('.card').forEach(card=>{
      const t=(card.innerText||'').trim();
      if(/^待處理\b/.test(t)&&!t.includes('今日待處理')) card.style.display='none';
      if(/^請假\s*\/\s*代課/.test(t)) card.style.display='none';
    });
  }
  function ensureWorkPage(){
    const pages=[...document.querySelectorAll('.page')];
    const work=pages.find(p=>/工作/.test((p.querySelector('h1,h2')||{}).textContent||'')||p.id==='workPage'||p.id==='page-work');
    if(!work)return;
    let host=work.querySelector('#pollyWorkPrep');
    if(!host){host=document.createElement('div');host.id='pollyWorkPrep';work.prepend(host);}
    render(host);
  }
  function render(host){
    host.innerHTML=`<div class="card"><div class="section-title"><h2>準備工作</h2></div><div id="prepSections"></div></div>
      <div class="card" style="margin-top:14px"><div class="section-title"><h2>📋 行政工作</h2><button class="btn" id="addAdmin">＋ 新增</button></div><div id="adminItems"></div></div>`;
    const ps=host.querySelector('#prepSections');
    data.prep.forEach(sec=>{
      const box=document.createElement('div');box.style.cssText='border-top:1px solid var(--line);padding:12px 0';
      box.innerHTML=`<div style="font-weight:850;font-size:17px;margin-bottom:8px">${sec.title}</div>`;
      sec.groups.forEach(g=>{
        const gb=document.createElement('div');gb.style.cssText='margin:10px 0;padding:10px;border:1px solid var(--line);border-radius:12px;background:#fffdf8';
        gb.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><b>${g.name}</b><button class="btn addPrep">＋ 班級／項目</button></div><div class="prepList"></div>`;
        gb.querySelector('.addPrep').onclick=()=>addPrep(sec.id,g.name);
        const list=gb.querySelector('.prepList');
        (g.items||[]).forEach(it=>list.appendChild(itemRow(it,()=>{g.items=g.items.filter(x=>x.id!==it.id);save();render(host);},()=>editItem(it,()=>{save();render(host);} ))));
        if(!g.items.length)list.innerHTML='<div class="empty">尚未建立準備事項</div>';
        box.appendChild(gb);
      }); ps.appendChild(box);
    });
    host.querySelector('#addAdmin').onclick=()=>addAdmin(host);
    const ai=host.querySelector('#adminItems');
    data.admin.forEach(it=>ai.appendChild(itemRow(it,()=>{data.admin=data.admin.filter(x=>x.id!==it.id);save();render(host);},()=>editItem(it,()=>{save();render(host);} ))));
    if(!data.admin.length)ai.innerHTML='<div class="empty">尚未建立行政工作</div>';
  }
  function itemRow(it,onDelete,onEdit){
    const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--line)';
    row.innerHTML=`<input type="checkbox" ${it.done?'checked':''} style="width:20px;height:20px"><div style="flex:1"><b>${esc(it.title)}</b>${it.date?`<div style="font-size:12px;color:var(--muted)">${esc(it.date)}</div>`:''}${it.note?`<div style="font-size:12px;color:var(--muted)">${esc(it.note)}</div>`:''}</div><button class="btn edit">編輯</button><button class="btn danger del">刪除</button>`;
    row.querySelector('input').onchange=e=>{it.done=e.target.checked;save();};row.querySelector('.edit').onclick=onEdit;row.querySelector('.del').onclick=onDelete;return row;
  }
  function promptItem(seed={}){
    const title=prompt('事項名稱',seed.title||'');if(!title)return null;
    const date=prompt('截止／發生日期（可留空，例如 2026-08-30）',seed.date||'')||'';
    const note=prompt('備註（可留空）',seed.note||'')||'';
    return {title:title.trim(),date:date.trim(),note:note.trim()};
  }
  function addPrep(secId,groupName){const v=promptItem();if(!v)return;const sec=data.prep.find(x=>x.id===secId),g=sec.groups.find(x=>x.name===groupName);g.items.push({id:uid(),done:false,...v});save();ensureWorkPage();}
  function addAdmin(host){const v=promptItem();if(!v)return;data.admin.push({id:uid(),done:false,...v});save();render(host);}
  function editItem(it,done){const v=promptItem(it);if(!v)return;Object.assign(it,v);done();}
  function init(){hideDuplicates();ensureWorkPage();setTimeout(hideDuplicates,500);}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(init,700));
  document.addEventListener('click',()=>setTimeout(()=>{hideDuplicates();ensureWorkPage();},80));
})();