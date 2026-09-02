// Polly 工作台：Syllabus 完整解析修正 v2
(function(){
  function labelForPage(pg){
    const t=String(pg?.text||'').replace(/\s+/g,' ');
    const m=t.match(/\b([1-9][A-Z]?)\s+(Unit\s+\d+|Review)\s+Class\b/i);
    if(!m)return '';
    return `${m[1].toUpperCase()} ${m[2].replace(/\s+/g,' ')}`;
  }

  function parseFullSyllabus(doc){
    const lessons=[];
    for(const pg of (doc?.pages||[])){
      const label=labelForPage(pg);
      const items=pg.items||[];
      // 舊版只抓到 Class 52；這裡放寬到 99，讓 2A 2.5hr 的 Class 53-56 也能匯入。
      const candidates=items
        .filter(i=>/^\d{1,2}$/.test(i.text) && Number(i.text)>=1 && Number(i.text)<=99 && i.x < pg.width*0.09)
        .sort((a,b)=>b.y-a.y);
      const uniq=[];
      for(const c of candidates){
        if(!uniq.some(u=>u.text===c.text))uniq.push(c);
      }
      for(let idx=0;idx<uniq.length;idx++){
        const c=uniq[idx], num=Number(c.text);
        const upper=idx===0?c.y+45:(uniq[idx-1].y+c.y)/2;
        const lower=idx===uniq.length-1?c.y-45:(c.y+uniq[idx+1].y)/2;
        const band=items.filter(i=>i.y<upper && i.y>lower && i!==c);
        const rows=typeof groupRows==='function'?groupRows(band):[];
        let content=rows.map(r=>r.texts.join(' ')).join(' · ')
          .replace(/\s+/g,' ').replace(/□|/g,'').trim();
        content=content.replace(new RegExp(`^${num}\\s*`),'').trim();
        if(content.length>5)lessons.push({classNo:num,unit:label||'2A',content});
      }
    }
    const map=new Map();
    lessons.forEach(l=>map.set(l.classNo,l));
    return {kind:'syllabus',lessons:[...map.values()].sort((a,b)=>a.classNo-b.classNo)};
  }

  // 覆寫主程式的全域解析函式；detectDoc() 之後會直接呼叫這個新版。
  window.pageClassLabel=labelForPage;
  window.parseSyllabus=parseFullSyllabus;
})();
