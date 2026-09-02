// Polly 工作台：課程進度清楚顯示 v1
(function(){
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const weekday=d=>{if(!d)return'';const x=new Date(d+'T12:00:00');return Number.isNaN(x.getTime())?'':'（'+['日','一','二','三','四','五','六'][x.getDay()]+'）'};
  const clean=s=>String(s||'').replace(/\s+/g,' ').replace(/\s*[-·]\s*/g,' · ').trim();
  const labels=[
    ['🧠 單字／複習',/(review|spelling|vocab|\bW\d+\b)/i],
    ['📘 課本／文法',/(learning zone|grammar|unit\s*\d+\s*week|\bSB\b|\bWB\b)/i],
    ['✏️ Writing',/(writing|first draft|final copy)/i],
    ['📚 Reader',/(reader|read section|gulliver|zack)/i],
    ['🎭 Role Play',/(role play|script|reader theater|chant)/i],
    ['🏠 Homework',/(homework|\bHW\b|HWB|copy words|study for)/i]
  ];
  function splitContent(raw){
    let text=clean(raw).replace(/\(\d+\s*(?:-|–)\s*\d+\s*min[^)]*\)/gi,'').replace(/\(\d+\s*min[^)]*\)/gi,'');
    const parts=text.split(/\s*[·|]\s*|\s+-\s+/).map(clean).filter(Boolean).filter(x=>!/^(CB|HW Checking|Correction:?|In-class Work|REMEMBER|NO MISTAKES!?|Optional:?|Choose an activity)$/i.test(x));
    const groups=new Map(labels.map(([n])=>[n,[]])); const other=[];
    for(const p of parts){let hit=false;for(const [name,re] of labels){if(re.test(p)){groups.get(name).push(p);hit=true;break;}}if(!hit)other.push(p);}
    const out=[];for(const [name] of labels){const vals=[...new Set(groups.get(name))];if(vals.length)out.push([name,vals.join(' · ')]);}if(other.length)out.push(['📌 其他',[...new Set(other)].join(' · ')]);return out;
  }
  function render(){
    const box=document.getElementById('detailLessons'); if(!box||box.style.display==='none')return;
    let c=null;try{c=(state.classes||[]).find(x=>String(x.id)===String(currentDetailClassId))}catch(e){} if(!c)return;
    const ls=c.lessons||[];
    if(!ls.length){box.innerHTML='<div class="empty">這個班級還沒有匯入課程資料</div>';return;}
    box.innerHTML=ls.map((l,i)=>{
      const groups=splitContent(l.content||'');
      const unit=l.unit&&String(l.unit).trim()?`<span style="background:#fff2cc;border-radius:999px;padding:4px 9px;font-size:12px">${esc(l.unit)}</span>`:'';
      const body=groups.length?groups.map(([name,val])=>`<div style="display:grid;grid-template-columns:125px 1fr;gap:10px;padding:7px 0;border-top:1px solid #f0eadc"><b style="font-size:13px">${name}</b><span style="font-size:13px;line-height:1.55">${esc(val)}</span></div>`).join(''):`<div style="color:var(--muted);padding:8px 0">${esc(l.content||'尚未對應課綱')}</div>`;
      return `<details class="lesson-clear-card" ${i<3?'open':''} style="background:#fff;border:1px solid var(--line);border-radius:14px;margin:9px 0;overflow:hidden"><summary style="cursor:pointer;list-style:none;padding:13px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b style="font-size:15px">${esc(l.date||'未配日期')}${weekday(l.date)}</b><b>Class ${esc(l.classNo)}</b>${unit}<span style="margin-left:auto;color:var(--muted);font-size:12px">查看內容 ▾</span></summary><div style="padding:0 14px 12px">${body}</div></details>`;
    }).join('');
  }
  const old=window.switchClassTab;
  window.switchClassTab=function(tab){if(typeof old==='function')old(tab);if(tab==='lessons')setTimeout(render,0)};
  const obs=new MutationObserver(()=>{const b=document.getElementById('detailLessons');if(b&&b.style.display!=='none'&&!b.querySelector('.lesson-clear-card'))render()});
  function init(){obs.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
