// Polly 工作台：跨裝置同步修正
(function(){
  const META_KEY='polly-sync-meta-v2';
  const DEVICE_KEY='polly-device-id-v1';
  const POLL_MS=4000;
  let applyingRemote=false;
  let timer=null;
  let poller=null;

  function nowIso(){return new Date().toISOString();}
  function deviceId(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){id='dev-'+Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem(DEVICE_KEY,id);}
    return id;
  }
  function meta(){
    try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')||{};}catch{return {};}
  }
  function setMeta(patch){
    const m={...meta(),...patch};
    localStorage.setItem(META_KEY,JSON.stringify(m));
    return m;
  }
  function badge(text){
    try{const el=document.getElementById('syncBadge');if(el)el.textContent=text;}catch{}
  }
  function normalizeState(s){
    if(!s||typeof s!=='object')return s;
    return s;
  }
  async function cloudRow(){
    const {data,error}=await supa.from('workspace_state').select('data,updated_at').eq('id',SUPA_ROW_ID).maybeSingle();
    if(error)throw error;
    return data||null;
  }
  async function pushNow(reason='save'){
    if(applyingRemote)return;
    const stamp=nowIso();
    const m=setMeta({localUpdatedAt:stamp,deviceId:deviceId(),pending:true});
    badge('同步中…');
    const payload=normalizeState(state);
    const {error}=await supa.from('workspace_state').upsert({id:SUPA_ROW_ID,data:payload,updated_at:stamp},{onConflict:'id'});
    if(error){
      console.error('Polly sync push failed',error);
      setMeta({pending:true,lastError:String(error.message||error)});
      badge('同步失敗');
      throw error;
    }
    setMeta({pending:false,lastPushedAt:stamp,cloudUpdatedAt:stamp,lastError:''});
    badge('已同步 ✓');
  }
  function schedulePush(){
    clearTimeout(timer);
    timer=setTimeout(()=>pushNow().catch(()=>{}),350);
  }
  function applyCloud(cloud){
    if(!cloud||!cloud.data)return;
    applyingRemote=true;
    try{
      state=normalizeState(cloud.data);
      localStorage.setItem(KEY,JSON.stringify(state));
      setMeta({cloudUpdatedAt:cloud.updated_at||nowIso(),localUpdatedAt:cloud.updated_at||nowIso(),pending:false,lastPulledAt:nowIso()});
      if(typeof ensurePollyClasses==='function')ensurePollyClasses();
      if(typeof render==='function')render();
      else if(typeof renderAll==='function')renderAll();
      badge('已同步 ✓');
    }finally{applyingRemote=false;}
  }
  async function syncCheck({startup=false}={}){
    try{
      const cloud=await cloudRow();
      if(!cloud||!cloud.data){await pushNow('seed');return;}
      const m=meta();
      const cloudTs=Date.parse(cloud.updated_at||0)||0;
      const localTs=Date.parse(m.localUpdatedAt||0)||0;
      const pending=!!m.pending;

      // 第一次套用新版同步時，優先保留目前裝置資料，避免舊雲端覆蓋手機/電腦上的新資料。
      if(startup&&!m.localUpdatedAt){
        localStorage.setItem(KEY,JSON.stringify(state));
        setMeta({localUpdatedAt:nowIso(),deviceId:deviceId(),pending:true});
        await pushNow('migration');
        return;
      }

      if(pending&&localTs>=cloudTs){await pushNow('retry');return;}
      if(cloudTs>localTs){applyCloud(cloud);return;}
      if(localTs>cloudTs){await pushNow('newer-local');return;}
      badge('已同步 ✓');
    }catch(e){
      console.error('Polly sync check failed',e);
      badge(navigator.onLine?'同步失敗':'離線，使用本機資料');
    }
  }

  // 取代舊版 saveState/persist，所有新增、編輯、刪除都會真正寫到 Supabase。
  try{
    saveState=function(){
      localStorage.setItem(KEY,JSON.stringify(state));
      if(!applyingRemote){setMeta({localUpdatedAt:nowIso(),deviceId:deviceId(),pending:true});badge('儲存中…');schedulePush();}
    };
    persist=function(){saveState();if(typeof render==='function')render();};
    pushToSupabase=pushNow;
    pullFromSupabase=function(){return syncCheck({startup:false});};
  }catch(e){console.error('Polly sync patch install failed',e);}

  window.addEventListener('online',()=>syncCheck());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncCheck();});
  window.addEventListener('focus',()=>syncCheck());

  setTimeout(()=>syncCheck({startup:true}),250);
  clearInterval(poller);
  poller=setInterval(()=>{if(document.visibilityState==='visible')syncCheck();},POLL_MS);
  console.log('Polly sync fix v2 loaded');
})();
