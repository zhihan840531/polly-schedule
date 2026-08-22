// Polly 工作台：行事曆手機版可讀性與指定事件選擇
(function(){
  const style=document.createElement('style');
  style.textContent=`
    #calendarPage .day{position:relative;align-content:start}
    #calendarPage .day .badge{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    @media(max-width:620px){
      #calendarPage .day{min-height:92px!important;padding:5px 3px!important;text-align:left!important}
      #calendarPage .day>b{display:grid!important;place-items:center!important;width:24px!important;height:24px!important;margin:0 auto 3px!important;border-radius:50%!important;font-size:12px!important}
      #calendarPage .day .badge{display:block!important;width:100%!important;height:auto!important;min-width:0!important;margin:2px 0!important;padding:2px 4px!important;border:0!important;border-radius:5px!important;color:#5b5343!important;font-size:9px!important;line-height:1.25!important;background:#f6edcf!important;text-align:left!important}
      #calendarPage .day .badge:nth-of-type(n+3){display:none!important}
      #calendarPage .day .more-count{display:block;margin-top:2px;text-align:center;color:#9b8b5f;font-size:9px;line-height:1}
    }
    #pollyDayAgenda{display:none;position:fixed;inset:0;z-index:80;background:#0005;align-items:flex-end;justify-content:center;padding:12px}
    #pollyDayAgenda.open{display:flex}
    #pollyDayAgenda .agenda-sheet{width:min(520px,100%);max-height:78vh;overflow:auto;background:#fff;border-radius:22px 22px 16px 16px;padding:18px;box-shadow:0 -8px 30px #0002}
    #pollyDayAgenda .agenda-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}
    #pollyDayAgenda .agenda-title{font-size:20px;font-weight:800}
    #pollyDayAgenda .agenda-close{border:1px solid var(--line);background:#fff;border-radius:12px;width:42px;height:42px;font-size:20px;color:#258ad3}
    #pollyDayAgenda .agenda-item{display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid var(--line);border-radius:14px;margin:8px 0;background:#fffdf8;cursor:pointer}
    #pollyDayAgenda .agenda-time{min-width:46px;font-size:12px;font-weight:800;color:var(--muted);padding-top:2px}
    #pollyDayAgenda .agenda-main{min-width:0;flex:1}
    #pollyDayAgenda .agenda-name{font-weight:800;line-height:1.4;word-break:break-word}
    #pollyDayAgenda .agenda-note{margin-top:3px;font-size:12px;color:var(--muted);line-height:1.4}
    #pollyDayAgenda .agenda-add{width:100%;margin-top:12px;border:0;border-radius:14px;padding:12px;background:var(--gold);font-weight:800;color:#4a4030}
  `;
  document.head.appendChild(style);

  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function typePrefix(r){return r.type==='absence'?'請假 ':r.type==='sub'?'代課 ':r.type==='task'?'✓ ':r.type==='intro'?'介紹 ':r.type==='trial'?'試上 ':r.type==='briefing'?'說明會 ':r.type==='festival'?'節慶 ':'';}

  const agenda=document.createElement('div');
  agenda.id='pollyDayAgenda';
  agenda.innerHTML='<div class="agenda-sheet"><div class="agenda-head"><div class="agenda-title" id="pollyAgendaTitle"></div><button class="agenda-close" type="button">×</button></div><div id="pollyAgendaList"></div><button class="agenda-add" type="button">＋ 新增這天的行程</button></div>';
  document.body.appendChild(agenda);
  agenda.addEventListener('click',e=>{if(e.target===agenda) agenda.classList.remove('open');});
  agenda.querySelector('.agenda-close').onclick=()=>agenda.classList.remove('open');

  window.openPollyDayAgenda=function(ds){
    const rec=(state.records||[]).filter(x=>x.date===ds).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
    if(!rec.length){openQuick('event',ds);return;}
    const d=new Date(ds+'T12:00:00');
    document.getElementById('pollyAgendaTitle').textContent=`${d.getMonth()+1} 月 ${d.getDate()} 日 · ${rec.length} 件`;
    const list=document.getElementById('pollyAgendaList');
    list.innerHTML=rec.map(r=>`<div class="agenda-item" data-id="${r.id}"><div class="agenda-time">${esc(r.time||'全天')}</div><div class="agenda-main"><div class="agenda-name">${esc(typePrefix(r)+r.title)}</div>${r.note?`<div class="agenda-note">${esc(r.note)}</div>`:''}</div></div>`).join('');
    list.querySelectorAll('.agenda-item').forEach(el=>el.onclick=()=>{agenda.classList.remove('open');openCalendarEvent(el.dataset.id);});
    agenda.querySelector('.agenda-add').onclick=()=>{agenda.classList.remove('open');openQuick('event',ds);};
    agenda.classList.add('open');
  };

  window.renderCalendar=function(){
    monthTitle.textContent=`${view.getFullYear()} 年 ${view.getMonth()+1} 月`;
    let y=view.getFullYear(),m=view.getMonth(),first=new Date(y,m,1),start=new Date(y,m,1-first.getDay());
    let html=['日','一','二','三','四','五','六'].map(x=>`<div class="dow">${x}</div>`).join('');
    for(let i=0;i<42;i++){
      let d=new Date(start);d.setDate(start.getDate()+i);
      let ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      let rec=(state.records||[]).filter(x=>x.date===ds);
      const chips=rec.slice(0,2).map(r=>`<span class="badge badge-${r.type}" title="${esc(typePrefix(r)+r.title)}" onclick="event.stopPropagation();openCalendarEvent('${r.id}')">${esc(typePrefix(r)+r.title)}</span>`).join('');
      const more=rec.length>2?`<span class="more-count">＋${rec.length-2} 件</span>`:'';
      html+=`<div class="day ${d.getMonth()!==m?'muted':''} ${ds===today()?'today':''}" onclick="openPollyDayAgenda('${ds}')"><b>${d.getDate()}</b>${chips}${more}</div>`;
    }
    calendar.innerHTML=html;
  };

  setTimeout(()=>{try{renderCalendar();}catch(e){console.error('calendar UI fix',e);}},0);
})();
