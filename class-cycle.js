// Polly 工作台：班級週期／本期設定 v1
(function(){
 const KEY='polly_class_cycles_v1';
 let cycles={}; try{cycles=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){}
 const save=()=>localStorage.setItem(KEY,JSON.stringify(cycles));
 const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
 function allClasses(){try{if(typeof state!=='undefined'&&state&&Array.isArray(state.classes))return state.classes;}catch(e){} try{if(typeof POLLY_CLASS_DATA!=='undefined')return POLLY_CLASS_DATA;}catch(e){} return [];}
 function key(c){return String(c.code||c.id||c.name||'');}
 function isoFromROC(s){const m=String(s||'').match(/^(\d{3})\/(\d{1,2})\/(\d{1,2})$/);if(!m)return /^\d{4}-\d{2}-\d{2}$/.test(String(s||''))?s:'';return `${Number(m[1])+1911}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;}
 function rec(c){const k=key(c);if(!cycles[k])cycles[k]={start:isoFromROC(c.start),end:isoFromROC(c.end),prepDeadline:'',history:[]};return cycles[k];}
 function dayBefore(s){if(!s)return '';const d=new Date(s+'T12:00:00');d.setDate(d.getDate()-1);return d.toISOString().slice(0,10);}
 function addButtons(){document.querySelectorAll('#classList .class-card, #classList .card').forEach(card=>{if(card.querySelector('.cycleBtn'))return;const txt=card.innerText||'';const c=allClasses().find(x=>txt.includes(x.code||'___')||txt.includes(x.name||'___'));if(!c)return;const b=document.createElement('button');b.className='btn cycleBtn';b.textContent='📅 本期設定';b.style.marginTop='8px';b.onclick=e=>{e.stopPropagation();open(c);};card.appendChild(b);});}
 function open(c){const r=rec(c);if(!r.prepDeadline)r.prepDeadline=dayBefore(r.start);let m=document.getElementById('cycleModal');if(!m){m=document.createElement('div');m.id='cycleModal';m.className='modal';m.innerHTML='<div class="modal-card" style="max-width:520px"><div class="section-title"><h2>📅 班級本期設定</h2><button class="btn" id="cycleClose">關閉</button></div><div id="cycleBody"></div></div>';document.body.appendChild(m);m.querySelector('#cycleClose').onclick=()=>m.style.display='none';}
 m.querySelector('#cycleBody').innerHTML=`<div style="margin-bottom:10px"><b>${esc(c.name||c.code)}</b><div style="font-size:12px;color:var(--muted)">${esc(c.code||'')}</div></div><label>開課日期<input id="cyStart" type="date" value="${esc(r.start)}"></label><label>結束日期<input id="cyEnd" type="date" value="${esc(r.end)}"></label><label>開學準備截止日<input id="cyPrep" type="date" value="${esc(r.prepDeadline)}"></label><div class="row" style="margin-top:14px"><button class="btn primary" id="cySave">儲存本期</button><button class="btn" id="cyNew">🔄 建立新一期</button></div>${r.history.length?`<div style="margin-top:16px"><b>歷史期別</b>${r.history.map(h=>`<div style="font-size:13px;color:var(--muted);padding:5px 0">${esc(h.start)} ～ ${esc(h.end)}</div>`).join('')}</div>`:''}`;
 m.style.display='flex';
 m.querySelector('#cySave').onclick=()=>{r.start=m.querySelector('#cyStart').value;r.end=m.querySelector('#cyEnd').value;r.prepDeadline=m.querySelector('#cyPrep').value;save();m.style.display='none';};
 m.querySelector('#cyNew').onclick=()=>{if(!confirm('建立新一期後，會保留本期日期到歷史紀錄，並將新一期的準備確認重新開始。確定嗎？'))return;if(r.start||r.end)r.history.unshift({start:r.start,end:r.end,prepDeadline:r.prepDeadline,closedAt:new Date().toISOString()});r.start='';r.end='';r.prepDeadline='';save();try{const wp=JSON.parse(localStorage.getItem('polly_work_prep_v2')||'{}');['school','camp'].forEach(sec=>{if(wp.prep&&wp.prep[sec]&&wp.prep[sec][key(c)]&&Array.isArray(wp.prep[sec][key(c)].items))wp.prep[sec][key(c)].items.forEach(i=>i.done=false);});localStorage.setItem('polly_work_prep_v2',JSON.stringify(wp));}catch(e){} open(c);};
 }
 function init(){addButtons();setTimeout(addButtons,800);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,700));else setTimeout(init,700);
 document.addEventListener('click',()=>setTimeout(addButtons,100));
})();