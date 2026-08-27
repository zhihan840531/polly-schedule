// Keep newly created classes at the front of the main class list.
(function(){
  function wrap(){
    if(window.__pollyClassOrderWrapped||typeof window.saveClass!=='function')return;
    const old=window.saveClass;
    window.saveClass=function(){
      let before=[];try{before=(state.classes||[]).map(c=>String(c.id));}catch(e){}
      const result=old.apply(this,arguments);
      try{
        const list=state.classes||[];
        const added=list.find(c=>!before.includes(String(c.id)));
        if(added){state.classes=[added,...list.filter(c=>c!==added)];if(typeof persist==='function')persist();else if(typeof saveState==='function')saveState();}
      }catch(e){}
      return result;
    };
    window.__pollyClassOrderWrapped=true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wrap,700));else setTimeout(wrap,700);
  setTimeout(wrap,1600);
})();