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
      /* iOS Safari/PWA can give native date/time controls an intrinsic width that overflows the form. */
      #quickModal .form > label,
      #quickModal .form > label input,
      #quickModal .form > label select,
      #quickModal .form > label textarea{
        min-width:0 !important;
        max-width:100% !important;
        box-sizing:border-box !important;
      }
      #quickModal input[type="date"],
      #quickModal input[type="time"],
      #quickModal #qDate,
      #quickModal #qTime,
      #quickModal #qEndDate{
        display:block !important;
        width:100% !important;
        min-width:0 !important;
        max-width:100% !important;
        height:46px !important;
        box-sizing:border-box !important;
      }
      #quickModal .form{min-width:0 !important;overflow:hidden}
      #quickModal .sheet{overflow-x:hidden !important}
      @media(max-width:620px){
        #quickModal input[type="date"],
        #quickModal input[type="time"],
        #quickModal #qDate,
        #quickModal #qTime,
        #quickModal #qEndDate{
          width:100% !important;
          min-width:100% !important;
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

  function snapshotOne(key){
    const raw=localStorage.getItem(key);
    if(raw===null || raw==='' || raw==='null' || raw==='undefined') return;
    const parsed=safeParse(raw,null);
    if(parsed===null) return;
    const payload={savedAt:new Date().toISOString(),value:parsed};
    try{
      localStorage.setItem(backupKey(key),JSON.stringify(payload));
      localStorage.setItem(META_KEY,JSON.stringify({lastBackupAt:payload.savedAt,version:1}));
    }catch(e){console.warn('Polly backup failed',e)}
  }

  function backupAll(){
    snapshotOne(WORKSPACE_KEY);
    snapshotOne(ADMISSIONS_KEY);
  }

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

  function restoreWorkspaceIfNeeded(){
    const current=safeParse(localStorage.getItem(WORKSPACE_KEY),null);
    const backup=safeParse(localStorage.getItem(backupKey(WORKSPACE_KEY)),null);
    const old=backup?.value;
    if(!old) return false;

    const currentBroken=!current || !Array.isArray(current.records) || !Array.isArray(current.classes);
    const resetToDemo=isFreshWorkspaceDefault(current) && !isFreshWorkspaceDefault(old) && workspaceRichness(old)>workspaceRichness(current);
    if(currentBroken || resetToDemo){
      try{
        localStorage.setItem(WORKSPACE_KEY,JSON.stringify(old));
        sessionStorage.setItem('polly-restored-this-load','1');
        return true;
      }catch(e){console.warn('Polly restore failed',e)}
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

  function addBackupControls(){
    const dataPage=document.getElementById('data');
    if(!dataPage || document.getElementById('pollyBackupCard')) return;
    const grid=dataPage.querySelector('.data-grid');
    if(!grid) return;
    const card=document.createElement('div');
    card.id='pollyBackupCard';
    card.className='card';
    card.innerHTML=`<h3>🛟 資料保護</h3>
      <p style="line-height:1.6;color:var(--muted)">工作台與招生資料會自動備份在這台裝置。網站更新不會主動清除你的資料。</p>
      <div id="pollyBackupStatus" style="font-size:12px;color:var(--muted);margin-bottom:10px"></div>
      <button class="btn" id="pollyBackupNow">立即備份</button>`;
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

    const restored=restoreWorkspaceIfNeeded();
    restoreAdmissionsIfNeeded();
    if(restored && !sessionStorage.getItem('polly-reloaded-after-restore')){
      sessionStorage.setItem('polly-reloaded-after-restore','1');
      location.reload();
      return;
    }

    backupAll();
    setInterval(backupAll,5000);
    window.addEventListener('pagehide',backupAll);
    window.addEventListener('beforeunload',backupAll);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')backupAll()});
    addBackupControls();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',startProtection);
  else startProtection();
})();
