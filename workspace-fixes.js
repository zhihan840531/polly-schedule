(() => {
  'use strict';

  const WORKSPACE_KEY='polly-workspace-v1';
  const ADMISSIONS_KEY='polly_admissions_v1';
  const BACKUP_PREFIX='polly-auto-backup::';
  const META_KEY='polly-auto-backup-meta-v1';

  function injectFixStyles(){
    if(document.getElementById('pollyWorkspaceFixStyles')) return;
    const s=document.createElement('style');
    s.id='pollyWorkspaceFixStyles';
    s.textContent=`
      /* Quick modal: every single-line control must have the same size. */
      #quickModal .sheet{overflow-x:visible !important}
      #quickModal .form{
        display:grid !important;
        grid-template-columns:minmax(0,1fr) !important;
        width:100% !important;
        min-width:0 !important;
      }
      #quickModal .form > label{
        display:block !important;
        width:100% !important;
        min-width:0 !important;
        max-width:100% !important;
      }
      #quickModal .form input,
      #quickModal .form select{
        display:block !important;
        width:100% !important;
        inline-size:100% !important;
        min-width:0 !important;
        min-inline-size:0 !important;
        max-width:100% !important;
        max-inline-size:100% !important;
        height:46px !important;
        min-height:46px !important;
        box-sizing:border-box !important;
        border:1px solid var(--line,#ece6d7) !important;
        border-radius:10px !important;
        padding:10px 12px !important;
        background:#fff !important;
        font:inherit !important;
      }
      #quickModal .form textarea{
        display:block !important;
        width:100% !important;
        min-width:0 !important;
        max-width:100% !important;
        box-sizing:border-box !important;
      }
      /* iOS gives date/time inputs a large intrinsic width and different native shape. */
      #quickModal input[type="date"],
      #quickModal input[type="time"]{
        -webkit-appearance:none !important;
        appearance:none !important;
        text-align:left !important;
        line-height:24px !important;
      }
      #quickModal input[type="date"]::-webkit-date-and-time-value,
      #quickModal input[type="time"]::-webkit-date-and-time-value{
        text-align:left !important;
        min-height:24px !important;
      }
      #quickModal input[type="date"]::-webkit-calendar-picker-indicator,
      #quickModal input[type="time"]::-webkit-calendar-picker-indicator{
        opacity:1 !important;
        margin:0 !important;
      }
      /* Time is useful for tasks/admin/pickups too, so never remove the field. */
      #quickModal #timeLabel{display:block !important}
      @media(max-width:620px){
        #quickModal .sheet{width:calc(100% - 2px) !important;max-width:100% !important}
        #quickModal .form input,
        #quickModal .form select,
        #quickModal .form textarea{
          width:100% !important;
          inline-size:100% !important;
          max-width:100% !important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  function safeParse(raw,fallback=null){
    try{return JSON.parse(raw)}catch(e){return fallback}
  }
  function backupKey(key){return BACKUP_PREFIX+key}

  function isFreshWorkspaceDefault(v){
    if(!v || !Array.isArray(v.records) || !Array.isArray(v.classes)) return true;
    const demoTitles=new Set(['通知 Emma 媽媽補課','印 PHC worksheet']);
    const hasDemo=v.records.some(r=>demoTitles.has(r?.title));
    const onlyDemoClass=v.classes.length<=1 && (!v.classes[0] || v.classes[0].code==='PHC-01');
    return v.records.length<=6 && hasDemo && onlyDemoClass;
  }

  function workspaceRichness(v){
    if(!v || typeof v!=='object') return 0;
    return (Array.isArray(v.records)?v.records.length*2:0)
      +(Array.isArray(v.classes)?v.classes.length*5:0)
      +(Array.isArray(v.studentNotes)?v.studentNotes.length*3:0)
      +(v.logs&&typeof v.logs==='object'?Object.keys(v.logs).length:0);
  }

  function snapshotOne(key){
    const raw=localStorage.getItem(key);
    if(raw===null || raw==='' || raw==='null' || raw==='undefined') return;
    const parsed=safeParse(raw,null);
    if(parsed===null) return;

    /* Never overwrite a richer workspace backup with the demo/reset state. */
    const previous=safeParse(localStorage.getItem(backupKey(key)),null);
    if(key===WORKSPACE_KEY && previous?.value){
      const prevScore=workspaceRichness(previous.value);
      const newScore=workspaceRichness(parsed);
      if(isFreshWorkspaceDefault(parsed) && !isFreshWorkspaceDefault(previous.value) && prevScore>newScore) return;
    }
    if(key===ADMISSIONS_KEY && Array.isArray(previous?.value) && previous.value.length>0 && Array.isArray(parsed) && parsed.length===0) return;

    const payload={savedAt:new Date().toISOString(),value:parsed};
    try{
      localStorage.setItem(backupKey(key),JSON.stringify(payload));
      localStorage.setItem(META_KEY,JSON.stringify({lastBackupAt:payload.savedAt,version:2}));
    }catch(e){console.warn('Polly backup failed',e)}
  }

  function backupAll(){snapshotOne(WORKSPACE_KEY);snapshotOne(ADMISSIONS_KEY)}

  function restoreWorkspaceIfNeeded(){
    const current=safeParse(localStorage.getItem(WORKSPACE_KEY),null);
    const backup=safeParse(localStorage.getItem(backupKey(WORKSPACE_KEY)),null);
    const old=backup?.value;
    if(!old) return false;
    const currentBroken=!current || !Array.isArray(current.records) || !Array.isArray(current.classes);
    const resetToDemo=isFreshWorkspaceDefault(current) && !isFreshWorkspaceDefault(old) && workspaceRichness(old)>workspaceRichness(current);
    if(currentBroken || resetToDemo){
      try{localStorage.setItem(WORKSPACE_KEY,JSON.stringify(old));return true}catch(e){console.warn('Polly restore failed',e)}
    }
    return false;
  }

  function restoreAdmissionsIfNeeded(){
    const current=safeParse(localStorage.getItem(ADMISSIONS_KEY),null);
    const backup=safeParse(localStorage.getItem(backupKey(ADMISSIONS_KEY)),null);
    const old=backup?.value;
    if(!Array.isArray(old) || old.length===0) return false;
    if(!Array.isArray(current) || current.length===0){
      try{localStorage.setItem(ADMISSIONS_KEY,JSON.stringify(old));return true}catch(e){}
    }
    return false;
  }

  function normalizeQuickModal(){
    const modal=document.getElementById('quickModal');
    if(!modal) return;
    const timeLabel=document.getElementById('timeLabel');
    if(timeLabel) timeLabel.style.setProperty('display','block','important');
    ['qType','qDate','qTitle','qTime','qDateMode','qEndDate'].forEach(id=>{
      const el=document.getElementById(id);
      if(!el) return;
      el.style.setProperty('width','100%','important');
      el.style.setProperty('max-width','100%','important');
      el.style.setProperty('min-width','0','important');
      el.style.setProperty('box-sizing','border-box','important');
    });
  }

  function wrapQuickFunctions(){
    try{
      if(typeof openQuick==='function' && !openQuick.__pollyStable){
        const baseOpen=openQuick;
        openQuick=function(...args){
          const out=baseOpen.apply(this,args);
          requestAnimationFrame(normalizeQuickModal);
          setTimeout(normalizeQuickModal,50);
          return out;
        };
        openQuick.__pollyStable=true;
      }
      if(typeof typeChanged==='function' && !typeChanged.__pollyStable){
        const baseType=typeChanged;
        typeChanged=function(...args){
          const out=baseType.apply(this,args);
          normalizeQuickModal();
          return out;
        };
        typeChanged.__pollyStable=true;
      }
    }catch(e){console.warn('Quick modal stabilization skipped',e)}
  }

  function auditQuickModal(){
    normalizeQuickModal();
    const form=document.querySelector('#quickModal .form');
    if(!form) return;
    const fw=form.getBoundingClientRect().width;
    form.querySelectorAll('input,select,textarea').forEach(el=>{
      const w=el.getBoundingClientRect().width;
      if(w>fw+2){
        el.style.setProperty('width','100%','important');
        el.style.setProperty('max-width','100%','important');
      }
    });
  }

  function addBackupControls(){
    const dataPage=document.getElementById('data');
    if(!dataPage || document.getElementById('pollyBackupCard')) return;
    const grid=dataPage.querySelector('.data-grid');
    if(!grid) return;
    const card=document.createElement('div');
    card.id='pollyBackupCard';card.className='card';
    card.innerHTML=`<h3>🛟 資料保護</h3><p style="line-height:1.6;color:var(--muted)">工作台與招生資料會自動備份在這台裝置。更新時若偵測到資料被重設，會優先保留較完整的版本。</p><div id="pollyBackupStatus" style="font-size:12px;color:var(--muted);margin-bottom:10px"></div><button class="btn" id="pollyBackupNow">立即備份</button>`;
    grid.appendChild(card);
    const status=card.querySelector('#pollyBackupStatus');
    const refresh=()=>{
      const meta=safeParse(localStorage.getItem(META_KEY),null);
      status.textContent=meta?.lastBackupAt?`最近自動備份：${new Date(meta.lastBackupAt).toLocaleString('zh-TW')}`:'尚未建立備份';
    };
    card.querySelector('#pollyBackupNow').onclick=()=>{backupAll();refresh();alert('資料已備份在這台裝置。')};
    refresh();
  }

  function startProtection(){
    injectFixStyles();
    wrapQuickFunctions();
    normalizeQuickModal();

    const restored=restoreWorkspaceIfNeeded();
    const restoredAdmissions=restoreAdmissionsIfNeeded();
    if((restored||restoredAdmissions) && !sessionStorage.getItem('polly-reloaded-after-restore-v2')){
      sessionStorage.setItem('polly-reloaded-after-restore-v2','1');
      location.reload();
      return;
    }

    backupAll();
    setInterval(backupAll,10000);
    window.addEventListener('pagehide',backupAll);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')backupAll()});
    window.addEventListener('resize',auditQuickModal);
    addBackupControls();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',startProtection,{once:true});
  else startProtection();
})();
