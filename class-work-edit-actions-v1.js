// Polly 工作台：班級工作新增／刪除操作 v3
(function(){
  const PREP='polly_work_prep_v2';
  const ELEMENTARY=['確認學生名單','學生通訊錄製作','打開課電話','準備教材','準備姓名貼','催費','準備聯絡本','準備通知單｜定型化契約','準備通知單｜課程介紹信','準備通知單｜請假退費辦法','準備通知單｜代辦必發','準備通知單｜行事曆','教材歸位','準備考試卷','準備學習單'];
  const KINDER=ELEMENTARY.filter(x=>!['準備考試卷','準備學習單'].includes(x));
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  let busy=false, observer=null;
  function getClass(){try{return (state.classes||[]).find(c=>String(c.id)===String(currentDetailClassId));}catch(e){return null;}}
  function key(c){return String(c.code||c.id||c.name||'').trim();}
  function typeOf(c){const s=String(c.code||c.name||'').toUpperCase();if(/^PH/.test(s))return '幼兒園部';return c.workflowType||'國小部';}
  function read(){try{return JSON.parse(localStorage.getItem(PREP)||'null')||{prep:{school:{},camp:{}},admin:[]};}catch(e){return {prep:{school:{},camp:{}},admin:[]};}}
  function write(p){localStorage.setItem(PREP,JSON.stringify(p));window.dispatchEvent(new Event('polly-data-changed'));}
  function record(c){const p=read(),sec=typeOf(c)==='冬夏令營'?'camp':'school';p.prep=p.prep||{school:{},camp:{}};p.prep[sec]=p.prep[sec]||{};let r=p.prep[sec][key(c)];if(!r){r={items:[],note:'',templateInitialized:false};p.prep[sec][key(c)]=r;}r.items=Array.isArray(r.items)?r.items:[];if(sec==='school'&&r.items.length===0&&!r.userClearedAll){const tpl=typeOf(c)==='幼兒園部'?KINDER:ELEMENTARY;r.items=tpl.map(title=>({id:uid(),title,done:false,date:'',note:'',custom:false}));r.templateInitialized=true;write(p);}return {p,r};}
  function refresh(){try{if(typeof renderClassWork==='function')renderClassWork();}catch(e){}requestAnimationFrame(enhance);}
  function addItem(c){const title=prompt('新增確認事項');if(!title||!title.trim())return;const {p,r}=record(c);r.items.push({id:uid(),title:title.trim(),done:false,date:'',note:'',custom:true});r.userClearedAll=false;write(p);refresh();}
  function removeItem(c,index,title){if(!confirm(`確定刪除「${title}」嗎？`))return;const {p,r}=record(c);r.items.splice(index,1);if(r.items.length===0)r.userClearedAll=true;write(p);refresh();}
  function enhance(){
    if(busy)return;const box=document.getElementById('detailClassWork');if(!box||box.style.display==='none')return;const c=getClass();if(!c)return;busy=true;
    try{
      const {r}=record(c),list=box.querySelector('#cwPrep');if(!list)return;
      const card=list.closest('.s360-card')||list.parentElement;const head=card?.querySelector('.section-title');
      if(head&&!head.querySelector('.cwAddPrep')){const b=document.createElement('button');b.className='btn cwAddPrep';b.textContent='＋ 新增';b.onclick=e=>{e.stopPropagation();addItem(c);};head.appendChild(b);}
      const rows=[...list.querySelectorAll('label')];
      rows.forEach((row,i)=>{const it=r.items[i];if(!it||row.querySelector('.cwDeletePrep'))return;row.style.display='flex';row.style.alignItems='center';const text=row.querySelector('span');if(text)text.style.flex='1';const del=document.createElement('button');del.type='button';del.className='btn danger cwDeletePrep';del.textContent='刪除';del.style.cssText='margin-left:auto;padding:6px 10px;font-size:12px;flex:0 0 auto;color:#c65345';del.onclick=e=>{e.preventDefault();e.stopPropagation();removeItem(c,i,it.title);};row.appendChild(del);});
    }finally{busy=false;}
  }
  function watch(){const box=document.getElementById('detailClassWork');if(!box){setTimeout(watch,500);return;}observer?.disconnect();observer=new MutationObserver(()=>{if(!busy)queueMicrotask(enhance);});observer.observe(box,{childList:true,subtree:true});enhance();}
  document.addEventListener('click',()=>requestAnimationFrame(enhance));window.addEventListener('polly-data-changed',()=>requestAnimationFrame(enhance));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();
})();