// Polly 工作台：Syllabus 完整解析修正 v3
(function(){
  function looksLikeSyllabus(doc){
    const name=String(doc?.name||'');
    const text=String(doc?.text||'');
    return /syllabus/i.test(name)||/Suggested\s+Syllabus/i.test(text);
  }
  function labelForPage(pg){
    const t=String(pg?.text||'').replace(/\s+/g,' ');
    const m=t.match(/\b([1-9][A-Z]?)\s+(Unit\s+\d+|Review)\s+Class\b/i);
    return m?`${m[1].toUpperCase()} ${m[2].replace(/\s+/g,' ')}`:'';
  }
  function parseFullSyllabus(doc){
    const lessons=[];
    for(const pg of (doc?.pages||[])){
      const label=labelForPage(pg);
      const items=pg.items||[];
      const candidates=items.filter(i=>/^\d{1,2}$/.test(i.text)&&Number(i.text)>=1&&Number(i.text)<=99&&i.x<pg.width*0.12).sort((a,b)=>b.y-a.y);
      const uniq=[];for(const c of candidates)if(!uniq.some(u=>u.text===c.text))uniq.push(c);
      for(let idx=0;idx<uniq.length;idx++){
        const c=uniq[idx],num=Number(c.text),upper=idx===0?c.y+45:(uniq[idx-1].y+c.y)/2,lower=idx===uniq.length-1?c.y-45:(c.y+uniq[idx+1].y)/2;
        const band=items.filter(i=>i.y<upper&&i.y>lower&&i!==c),rows=typeof groupRows==='function'?groupRows(band):[];
        let content=rows.map(r=>r.texts.join(' ')).join(' · ').replace(/\s+/g,' ').replace(/□|/g,'').trim().replace(new RegExp(`^${num}\\s*`),'').trim();
        if(content.length>5)lessons.push({classNo:num,unit:label||'1A',content});
      }
    }
    const map=new Map();lessons.forEach(l=>map.set(l.classNo,l));
    return {kind:'syllabus',lessons:[...map.values()].sort((a,b)=>a.classNo-b.classNo)};
  }
  window.pageClassLabel=labelForPage;
  window.parseSyllabus=parseFullSyllabus;
  // The supplied 261A01 syllabus is image-only: PDF.js returns no text, so filename must be accepted as syllabus.
  window.detectDoc=function(doc){
    const t=String(doc?.text||'');
    if(looksLikeSyllabus(doc))return parseFullSyllabus(doc);
    if(/哥大英語/.test(t)&&/每週/.test(t)&&/Present/.test(t))return parseAttendance(doc);
    return {kind:'unknown'};
  };
})();
