// Polly 工作台：班級工作新增／刪除操作 v1
(function(){
  const PREP='polly_work_prep_v2';
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  function getClass(){
    try{return (state.classes||[]).find(c=>String(c.id)===String(currentDetailClassId));}catch(e){return null;}
  }
  function key(c){return String(c.code||c.id||c.name||'').trim();}
  function typeOf(c){const s=String(c.code||c.name||'').toUpperCase();if(/^PH/.test(s))return '幼兒園部';return c.workflowType||'國小部';}
  function read(){try{return JSON.parse(localStorage.getItem(PREP)||'null')||{prep:{school:{},camp:{}},admin:[]};}catch(e){return {prep:{school:{},camp:{}},admin:[]};}}
  function write(p){localStorage.setItem(PREP,JSON.stringify(p));window.dispatchEvent(new Event('polly-data-changed'));}
  function record(c){const p=read(),sec=typeOf(c)==='冬夏令營'?'camp':'school';p.prep=p.prep||{school:{},camp:{}};p.prep[sec]=p.prep[sec]||{};p.prep[sec][key(c)]=p.prep[sec][key(c)]||{items:[],note:'',templateInitialized:true};return {p,sec,r:p.prep[sec][key(c)]};}
  function rerender(){try{if(typeof renderClassWork==='function')renderClassWork();}catch(e){}setTimeout(enhance,30);}
  function addItem(c){const title=prompt('新增確認事項');if(!title||!title.trim())return;const {p,r}=record(c);r.items=Array.isArray(r.items)?r.items:[];r.items.push({id:uid(),title:title.trim(),done:false,date:'',note:'',custom:true});write(p);rerender();}
  function deleteItem(c,index,title){if(!confirm(`確定刪除「${title}」嗎？`))return;const {p,r}=record(c);r.items=Array.isArray(r.items)?r.items:[];r.items.splice(index,1);write(p);rerender();}
  function enhance(){
    const box=document.getElementById('detailClassWork');if(!box||box.offsetParent===null)return;const c=getClass();if(!c)return;
    // 尋找開課準備區塊，以標題作定位。
    const title=[...box.querySelectorAll('h2,h3,b,strong,div')].find(el=>/^🎒?\s*開課準備$/.test((el.textContent||'').trim())||((el.textContent||'').trim()==='開課準備'));
    if(!title)return;
    let section=title.closest('.card')||title.parentElement;if(!section)return;
    let head=title.parentElement;
    if(!head.querySelector('.cwAddPrep')){
      const b=document.createElement('button');b.className='btn cwAddPrep';b.textContent='＋ 新增';b.style.marginLeft='auto';b.onclick=e=>{e.stopPropagation();addItem(c);};
      if(getComputedStyle(head).display!=='flex'){head.style.display='flex';head.style.alignItems='center';head.style.gap='8px';}head.appendChild(b);
    }
    const {r}=record(c),items=Array.isArray(r.items)?r.items:[];
    // 依畫面文字找到各確認事項列，補刪除鍵；預設與自訂項目都可刪。
    items.forEach((it,i)=>{
      const candidates=[...section.querySelectorAll('div,label')].filter(el=>{
        const t=(el.textContent||'').trim();return t.includes(it.title)&&!el.querySelector('.cwDeletePrep')&&el.children.length<8;
      });
      const row=candidates.find(el=>el.querySelector('input[type="checkbox"]'))||candidates[0];if(!row)return;
      if(row.querySelector('.cwDeletePrep'))return;
      const del=document.createElement('button');del.className='btn danger cwDeletePrep';del.textContent='刪除';del.style.cssText='margin-left:auto;padding:6px 9px;font-size:12px;flex:0 0 auto';del.onclick=e=>{e.stopPropagation();deleteItem(c,i,it.title);};
      if(getComputedStyle(row).display!=='flex'){row.style.display='flex';row.style.alignItems='center';row.style.gap='8px';}row.appendChild(del);
    });
  }
  document.addEventListener('click',()=>setTimeout(enhance,80));
  window.addEventListener('polly-data-changed',()=>setTimeout(enhance,80));
  setInterval(enhance,1200);
})();