(() => {
  'use strict';
  const KEY='polly-workspace-v1';
  const DEFAULTS=[
    {id:'lesson',text:'查看今天老師教案',days:[1,2,3,4,5]},
    {id:'absence',text:'確認今日缺課／請假學生',days:[1,2,3,4,5]},
    {id:'correction',text:'追蹤學生訂正／未完成作業',days:[1,2,3,4,5]},
    {id:'contactbook',text:'確認缺課聯絡本／需要通知家長的事項',days:[1,2,3,4,5]},
    {id:'papers',text:'確認考卷／資料是否需要交給家長',days:[1,2,3,4,5]}
  ];
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const getState=()=>{try{return typeof state!=='undefined'&&state?state:JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}};
  function ensure(s){s.dailyChecklist=s.dailyChecklist||{};s.checklistTemplates=s.checklistTemplates||DEFAULTS.map(x=>({...x}));}
  function save(s){localStorage.setItem(KEY,JSON.stringify(s));try{if(typeof persist==='function')persist()}catch(e){}}
  function injectStyle(){if(document.getElementById('pollyChecklistStyle'))return;const st=document.createElement('style');st.id='pollyChecklistStyle';st.textContent=`.polly-check-card{margin-top:16px}.polly-check-row{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--line,#ece6d7)}.polly-check-row:last-child{border-bottom:0}.polly-check-row input{width:20px;height:20px;flex:0 0 20px;margin-top:1px}.polly-check-row.done span{text-decoration:line-through;color:#aaa}.polly-check-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.polly-check-note{font-size:12px;color:var(--muted,#817b6e);margin-top:3px}`;document.head.appendChild(st)}
  function renderChecklist(){const s=getState(),page=document.getElementById('today');if(!s||!page)return;ensure(s);let card=document.getElementById('pollyDailyChecklist');if(!card){card=document.createElement('div');card.id='pollyDailyChecklist';card.className='card polly-check-card';const grid=page.querySelector('.grid');if(grid)grid.insertAdjacentElement('afterend',card);else page.appendChild(card)}const date=today(),day=new Date(date+'T12:00:00').getDay(),items=s.checklistTemplates.filter(x=>(x.days||[]).includes(day)),done=s.dailyChecklist[date]||{};card.innerHTML=`<div class="polly-check-head"><div><h2 style="font-size:18px;margin:0">☑️ 今日檢查清單</h2><div class="polly-check-note">每天重新計算，不會塞進一般待辦。</div></div><b>${items.filter(x=>done[x.id]).length}/${items.length}</b></div><div>${items.map(x=>`<label class="polly-check-row ${done[x.id]?'done':''}"><input type="checkbox" data-check-id="${x.id}" ${done[x.id]?'checked':''}><span>${x.text}</span></label>`).join('')||'<div class="empty">今天沒有固定檢查項目</div>'}</div>`;card.querySelectorAll('[data-check-id]').forEach(el=>el.onchange=()=>{const ss=getState();ensure(ss);ss.dailyChecklist[date]=ss.dailyChecklist[date]||{};ss.dailyChecklist[date][el.dataset.checkId]=el.checked;localStorage.setItem(KEY,JSON.stringify(ss));renderChecklist()})}
  function wrapRender(){try{if(typeof render!=='function'||render.__checklist)return;const base=render;render=function(){base();setTimeout(renderChecklist,0)};render.__checklist=true}catch(e){}}
  function init(){injectStyle();wrapRender();renderChecklist()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();