(() => {
  'use strict';

  function closeOverlay(el){
    if(!el) return;
    if(el.id && typeof window.closeModal === 'function' && el.classList.contains('modal')){
      try { window.closeModal(el.id); return; } catch(e) {}
    }
    el.classList.remove('open');
  }

  function installOutsideDismiss(){
    // Generic workspace modals: only close when the dimmed blank backdrop itself is tapped.
    document.addEventListener('click', (e) => {
      const target = e.target;
      if(!(target instanceof HTMLElement)) return;

      if(target.classList.contains('modal') && target.classList.contains('open')){
        closeOverlay(target);
        return;
      }

      // Custom overlays used by enhanced task editor / admissions form.
      if(target.id === 'pollyTaskEditModal' && target.classList.contains('open')){
        closeOverlay(target);
        return;
      }
      if(target.id === 'admModal' && target.classList.contains('open')){
        closeOverlay(target);
        return;
      }
    }, true);

    // Prevent taps inside sheets/cards from ever bubbling into a backdrop-close handler.
    document.addEventListener('click', (e) => {
      const el = e.target;
      if(!(el instanceof Element)) return;
      if(el.closest('.sheet, .polly-sheet, .adm-sheet')) e.stopPropagation();
    }, false);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', installOutsideDismiss, {once:true});
  }else{
    installOutsideDismiss();
  }
})();