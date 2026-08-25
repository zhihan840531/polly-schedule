// Polly 工作台：學生家長電話
(function(){
  function phoneKey(classId,index){return `polly-parent-phone:${classId}:${index}`;}
  function getPhone(classId,index){return localStorage.getItem(phoneKey(classId,index))||'';}
  function setPhone(classId,index,value){localStorage.setItem(phoneKey(classId,index),String(value||'').trim());}
  function cleanPhone(v){return String(v||'').replace(/[^0-9+]/g,'');}
  function ensurePhoneField(){
    const modal=document.getElementById('callModal');
    if(!modal)return;
    const source=document.getElementById('callSource');
    if(!source||document.getElementById('callParentPhone'))return;
    const wrap=document.createElement('div');
    wrap.id='callPhoneWrap';
    wrap.style.cssText='display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin:8px 0 10px';
    wrap.innerHTML='<label style="display:grid;gap:5px;font-size:13px;font-weight:700">家長電話<input id="callParentPhone" type="tel" inputmode="tel" placeholder="例如 0912-345-678" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:10px"></label><button id="callParentDial" class="btn primary" type="button" style="height:42px">📞 撥電話</button>';
    source.parentElement.insertBefore(wrap,source);
    document.getElementById('callParentDial').onclick=()=>{
      const p=cleanPhone(document.getElementById('callParentPhone').value);
      if(!p)return alert('請先輸入家長電話');
      location.href='tel:'+p;
    };
    document.getElementById('callParentPhone').addEventListener('change',saveCurrentPhone);
    document.getElementById('callParentPhone').addEventListener('blur',saveCurrentPhone);
  }
  function current(){
    try{
      if(typeof getCallNameMode==='function'&&getCallNameMode()==='list'&&typeof getCurrentCallStudent==='function'){
        const s=getCurrentCallStudent();
        if(s)return {classId:s.classId??currentCallClassId,index:s.index??currentCallStudentIndex};
      }
    }catch{}
    return null;
  }
  function saveCurrentPhone(){
    const c=current(),el=document.getElementById('callParentPhone');
    if(c&&el)setPhone(c.classId,c.index,el.value);
  }
  function loadCurrentPhone(){
    ensurePhoneField();
    const c=current(),el=document.getElementById('callParentPhone');
    if(!el)return;
    el.value=c?getPhone(c.classId,c.index):'';
  }
  const oldOpen=window.openCallRecord;
  if(typeof oldOpen==='function')window.openCallRecord=function(){const r=oldOpen.apply(this,arguments);setTimeout(loadCurrentPhone,0);return r;};
  const oldRender=window.renderCallStudents;
  if(typeof oldRender==='function')window.renderCallStudents=function(){const r=oldRender.apply(this,arguments);setTimeout(loadCurrentPhone,0);return r;};
  document.addEventListener('click',e=>{if(e.target.closest?.('.call-student-btn'))setTimeout(loadCurrentPhone,20);});
  setTimeout(ensurePhoneField,0);
})();