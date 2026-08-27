// Polly 工作台：班級工作固定新增／刪除操作 v4
(function(){
  const PREP='polly_work_prep_v2', FLOW='polly_class_workflow_v1';
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  function getClass(){
    try{const id=currentDetailClassId;const c=(state.classes||[]).find(x=>String(x.id)===String(id));if(c)return c;}catch(e){}
    try{
      const box=document.getElementById('detailClassWork');const text=(box?.closest('.modal,.detail-modal,.sheet')?.innerText||document.body.innerText||'');
      return (state.classes||[]).find(c=>text.includes(String(c.code||''))||text.includes(String(c.name||'')))||null;
    }catch(e){return null;}
  }
  const key=c=>String(c?.code||c?.id||c?.name||'').trim();
  function typeOf(c){const s=String(c?.code||c?.name||'').toUpperCase();if(/^PH/.test(s))return '幼兒園部';return c?.workflowType||'國小部';}
  function readPrep(){try{return JSON.parse(localStorage.getItem(PREP)||'null')||{prep:{school:{},camp:{}},admin:[]};}catch(e){return {prep:{school:{},camp:{}},admin:[]};}}
  function savePrep(p){localStorage.setItem(PREP,JSON.stringify(p));window.dispatchEvent(new Event('polly-data-changed'));}
  function prepRecord(c){const p=readPrep(),sec=typeOf(c)==='冬夏令營'?'camp':'school';p.prep=p.prep||{school:{},camp:{}};p.prep[sec]=p.prep[sec]||{};p.prep[sec][key(c)]=p.prep[sec][key(c)]||{items:[],note:''};const r=p.prep[sec][key(c)];r.items=Array.isArray(r.items)?r.items:[];return {p,r};}
  function readFlow(){try{return JSON.parse(localStorage.getItem(FLOW)||'null')||{extraClasses:[],events:[],reviews:[]};}catch(e){return {extraClasses:[],events:[],reviews:[]};}}
  function saveFlow(d){localStorage.setItem(FLOW,JSON.stringify(d));window.dispatchEvent(new Event('polly-data-changed'));}
  function addPrep(c){const title=prompt('新增確認事項');if(!title||!title.trim())return;const {p,r}=prepRecord(c);r.items.push({id:uid(),title:title.trim(),done:false,date:'',note:'',custom:true});savePrep(p);}
  function enhancePrep(box,c){
    const list=box.querySelector('#cwPrep');if(!list)return;const {r}=prepRecord(c);
    const card=list.closest('.s360-card')||list.parentElement;const head=card?.querySelector('.section-title');
    if(head&&!head.querySelector('.cwV4Add')){const b=document.createElement('button');b.type='button';b.className='btn cwV4Add';b.textContent='＋ 新增';b.onclick=e=>{e.preventDefault();e.stopPropagation();addPrep(c);};head.appendChild(b);}
    const rows=[...list.querySelectorAll(':scope > label')];
    rows.forEach((row,i)=>{
      const it=r.items[i];if(!it||row.querySelector('.cwV4Delete'))return;
      row.style.display='grid';row.style.gridTemplateColumns='auto 1fr auto';row.style.alignItems='center';row.style.gap='9px';
      const del=document.createElement('button');del.type='button';del.className='btn danger cwV4Delete';del.textContent='刪除';del.style.cssText='padding:6px 10px;font-size:12px;color:#c65345;white-space:nowrap';
      del.onclick=e=>{e.preventDefault();e.stopPropagation();if(!confirm(`確定刪除「${it.title}」嗎？`))return;const cur=prepRecord(c);cur.r.items=cur.r.items.filter(x=>x.id!==it.id);savePrep(cur.p);};
      row.appendChild(del);
    });
  }
  function enhanceEvents(box,c){
    const flow=readFlow(),ck=key(c);
    const examCard=[...box.querySelectorAll('.s360-card')].find(x=>/📝\s*考試/.test(x.innerText||''));
    if(examCard){const events=flow.events.filter(e=>e.classKey===ck);const rows=[...examCard.querySelectorAll('div')].filter(el=>/\d{4}-\d{2}-\d{2}/.test(el.textContent||'')&&!el.querySelector('.cwV4DeleteExam'));
      rows.slice(-events.length).forEach((row,i)=>{const ev=events[i];if(!ev||row.querySelector('.cwV4DeleteExam'))return;row.style.display='flex';row.style.alignItems='center';row.style.gap='8px';const b=document.createElement('button');b.type='button';b.className='btn danger cwV4DeleteExam';b.textContent='刪除';b.style.cssText='margin-left:auto;padding:6px 10px;font-size:12px;color:#c65345';b.onclick=e=>{e.stopPropagation();if(!confirm('確定刪除這筆考試嗎？'))return;const d=readFlow();d.events=d.events.filter(x=>x.id!==ev.id);saveFlow(d);};row.appendChild(b);});}
    const reviewCard=[...box.querySelectorAll('.s360-card')].find(x=>/📚\s*簿本複查/.test(x.innerText||''));
    if(reviewCard){const reviews=flow.reviews.filter(r=>r.classKey===ck);const rows=[...reviewCard.querySelectorAll('div')].filter(el=>/\d{4}-\d{2}-\d{2}/.test(el.textContent||'')&&!el.querySelector('.cwV4DeleteReview'));
      rows.slice(-reviews.length).forEach((row,i)=>{const rv=reviews[i];if(!rv||row.querySelector('.cwV4DeleteReview'))return;row.style.display='flex';row.style.alignItems='center';row.style.gap='8px';const b=document.createElement('button');b.type='button';b.className='btn danger cwV4DeleteReview';b.textContent='刪除';b.style.cssText='margin-left:auto;padding:6px 10px;font-size:12px;color:#c65345';b.onclick=e=>{e.stopPropagation();if(!confirm('確定刪除這一輪簿本複查嗎？'))return;const d=readFlow();d.reviews=d.reviews.filter(x=>x.id!==rv.id);saveFlow(d);};row.appendChild(b);});}
  }
  let applying=false;
  function apply(){if(applying)return;const box=document.getElementById('detailClassWork');if(!box||box.style.display==='none')return;const c=getClass();if(!c)return;applying=true;try{enhancePrep(box,c);enhanceEvents(box,c);}finally{applying=false;}}
  function start(){const root=document.body;const obs=new MutationObserver(()=>{if(!applying)requestAnimationFrame(apply);});obs.observe(root,{childList:true,subtree:true});document.addEventListener('click',()=>requestAnimationFrame(apply));window.addEventListener('polly-data-changed',()=>requestAnimationFrame(apply));apply();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();