// Polly 工作台：天母校小學部／幼兒部行事曆匯入修正
(function(){
  // 手機版行事曆：固定七欄，避免長活動名稱把整個月曆撐出螢幕。
  const mobileCalendarStyle=document.createElement('style');
  mobileCalendarStyle.textContent=`
    #calendarPage{min-width:0;overflow-x:hidden}
    #calendarPage .calendar{width:100%;max-width:100%;min-width:0;grid-template-columns:repeat(7,minmax(0,1fr))}
    #calendarPage .dow,#calendarPage .day{min-width:0;overflow:hidden}
    #calendarPage .badge{display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    @media(max-width:620px){
      #calendarPage .calendar-head{align-items:flex-start;gap:8px}
      #calendarPage .calendar-head h1{font-size:30px}
      #calendarPage .calendar-head>div:last-child{display:flex;align-items:center;gap:6px;white-space:nowrap}
      #calendarPage .calendar-head .btn{padding:8px 10px;border-radius:12px}
      #calendarPage .calendar{border-radius:16px}
      #calendarPage .dow{padding:8px 0;font-size:11px}
      #calendarPage .day{min-height:82px;padding:5px 4px;font-size:12px}
      #calendarPage .day>b{font-size:13px}
      #calendarPage .badge{margin-top:4px;padding:4px 3px;border-radius:6px;font-size:8.5px;line-height:1.2}
    }
    @media(max-width:390px){
      #calendarPage .day{min-height:74px;padding:4px 3px}
      #calendarPage .badge{font-size:8px;padding:3px 2px}
    }
  `;
  document.head.appendChild(mobileCalendarStyle);

  function isoDate(year,month,day){
    return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }
  function cleanTitle(s){
    return String(s||'').replace(/\s+/g,' ').replace(/\s*([：:、，,（）()])\s*/g,'$1').trim();
  }
  function eventKind(title){
    return /放假|停課|補假|國定|春節|連假/.test(title)?'放假／停課':/考|評量|期中|期末/.test(title)?'考試／評量':'學校活動';
  }
  function parseSheet(ws){
    const grid=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''});
    const header=grid.slice(0,4).flat().map(String).join(' ');
    let department='';
    if(/小學部行事曆/.test(header)) department='小學部';
    else if(/幼兒園部行事曆/.test(header)) department='幼兒部';
    else return [];

    let currentYear=new Date().getFullYear();
    let currentMonth=1;
    const out=[];
    for(const row of grid){
      for(const raw of row){
        const s=String(raw||'').replace(/\s+/g,' ').trim();
        if(!s) continue;

        const mh=s.match(/(20\d{2})年\s*(\d{1,2})月/);
        if(mh){
          currentYear=Number(mh[1]);
          currentMonth=Number(mh[2]);
          continue;
        }

        // 只抓「日期開頭＋活動名稱」的儲存格，月曆裡單純的 1、2、8/31 不算活動。
        const m=s.match(/^\s*(\d{1,2})\/(\d{1,2})(?:\s*(?:-|–|—|~|～)\s*(?:(\d{1,2})\/)?(\d{1,2}))?\s*(?:\([一二三四五六日]\))?\s*/);
        if(!m) continue;
        const title=cleanTitle(s.slice(m[0].length).replace(/^[：:\-–—\s]+/,''));
        if(!title) continue;

        const startMonth=Number(m[1]);
        const startDay=Number(m[2]);
        let startYear=currentYear;
        if(currentMonth===12 && startMonth===1) startYear++;
        else if(currentMonth===1 && startMonth===12) startYear--;

        const startDate=isoDate(startYear,startMonth,startDay);
        let endDate='';
        if(m[4]){
          const endMonth=m[3]?Number(m[3]):startMonth;
          const endDay=Number(m[4]);
          let endYear=startYear;
          if(startMonth===12 && endMonth===1) endYear++;
          endDate=isoDate(endYear,endMonth,endDay);
        }

        out.push({
          date:startDate,
          endDate,
          title,
          type:eventKind(title),
          departments:[department]
        });
      }
    }
    return out;
  }
  function mergeRows(rows){
    const map=new Map();
    for(const row of rows){
      const key=`${row.date}|${row.endDate||''}|${cleanTitle(row.title)}`;
      if(!map.has(key)) map.set(key,{...row,departments:[...(row.departments||[])]});
      else {
        const cur=map.get(key);
        cur.departments=[...new Set([...(cur.departments||[]),...(row.departments||[])])];
      }
    }
    return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'zh-Hant'));
  }
  function eachDate(start,end){
    if(!end || end<start) return [start];
    const dates=[];
    let d=new Date(start+'T12:00:00');
    const e=new Date(end+'T12:00:00');
    while(d<=e){
      dates.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
      d.setDate(d.getDate()+1);
    }
    return dates;
  }

  window.startSchoolCalendarImport=async function(inp){
    const file=inp.files?.[0];
    if(!file) return;
    schoolCalStatus.textContent='⏳ 正在讀取小學部／幼兒部行事曆…';
    try{
      const name=file.name.toLowerCase();
      let rows=[];
      if(name.endsWith('.xlsx')||name.endsWith('.xls')||name.endsWith('.csv')){
        const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});
        for(const sheetName of wb.SheetNames){
          rows.push(...parseSheet(wb.Sheets[sheetName]));
        }
        rows=mergeRows(rows);
        if(!rows.length){
          throw new Error('沒有找到「小學部行事曆」或「幼兒園部行事曆」。其他工作表會自動忽略。');
        }
      }else{
        // PDF 仍沿用原本解析方式。
        const doc=await readPdf(file);
        rows=parseSchoolText(doc.text);
      }

      pendingSchoolCalendar=rows;
      const elementary=rows.filter(r=>(r.departments||[]).includes('小學部')).length;
      const kindergarten=rows.filter(r=>(r.departments||[]).includes('幼兒部')).length;
      schoolCalStatus.textContent=`✓ 找到 ${rows.length} 筆（小學部 ${elementary}／幼兒部 ${kindergarten}），請確認`;
      renderSchoolCalPreview();
      schoolCalModal.classList.add('open');
    }catch(err){
      console.error(err);
      schoolCalStatus.textContent='讀取失敗：'+(err.message||err);
    }
    inp.value='';
  };

  window.renderSchoolCalPreview=function(){
    schoolCalPreview.innerHTML=pendingSchoolCalendar.length?pendingSchoolCalendar.map((r,i)=>{
      const dept=(r.departments||[]).join('＋')||'學校';
      const range=r.endDate?` ～ ${r.endDate}`:'';
      return `<div class="school-cal-row" title="${dept}${range}"><input type="date" value="${r.date}" onchange="pendingSchoolCalendar[${i}].date=this.value"><input class="school-cal-title" value="${String(r.title).replace(/"/g,'&quot;')}" onchange="pendingSchoolCalendar[${i}].title=this.value"><select onchange="pendingSchoolCalendar[${i}].type=this.value"><option ${r.type==='學校活動'?'selected':''}>學校活動</option><option ${r.type==='放假／停課'?'selected':''}>放假／停課</option><option ${r.type==='考試／評量'?'selected':''}>考試／評量</option></select><button class="btn danger" onclick="pendingSchoolCalendar.splice(${i},1);renderSchoolCalPreview()">✕</button></div>`;
    }).join(''):'<div class="empty">沒有辨識到日期事件。</div>';
  };

  window.confirmSchoolCalendarImport=function(){
    if(!pendingSchoolCalendar.length) return alert('沒有可匯入的行事');
    state.schoolCalendarEvents=state.schoolCalendarEvents||[];
    state.records=state.records||[];

    let addedEvents=0;
    let mergedEvents=0;
    let addedCalendarDays=0;

    for(const [i,row] of pendingSchoolCalendar.entries()){
      const title=cleanTitle(row.title);
      const key=x=>`${x.date}|${cleanTitle(x.title)}`;
      let existing=state.schoolCalendarEvents.find(x=>key(x)===`${row.date}|${title}`);
      if(existing){
        existing.departments=[...new Set([...(existing.departments||[]),...(row.departments||[])])];
        if(row.endDate&&!existing.endDate) existing.endDate=row.endDate;
        mergedEvents++;
      }else{
        existing={
          id:Date.now()+i,
          date:row.date,
          endDate:row.endDate||'',
          title,
          type:row.type,
          departments:row.departments||[],
          source:'天母校行事曆'
        };
        state.schoolCalendarEvents.push(existing);
        addedEvents++;
      }

      const dept=(row.departments||[]).join('＋');
      const note=[dept,row.endDate?`${row.date} ～ ${row.endDate}`:'',row.type].filter(Boolean).join(' · ');
      for(const date of eachDate(row.date,row.endDate)){
        const already=state.records.some(r=>r.date===date&&cleanTitle(r.title)===title&&r.importedSchoolCalendar);
        if(already) continue;
        state.records.push({
          id:Date.now()+100000+i*100+addedCalendarDays,
          type:'event',
          date,
          time:'',
          title,
          note,
          done:false,
          importedSchoolCalendar:true,
          schoolCalendarEventId:existing.id,
          departments:row.departments||[]
        });
        addedCalendarDays++;
      }
    }

    const total=pendingSchoolCalendar.length;
    persist();
    pendingSchoolCalendar=[];
    closeModal('schoolCalModal');
    schoolCalStatus.textContent=`✓ 已匯入 ${addedEvents} 筆活動，行事曆新增 ${addedCalendarDays} 天`;
    alert(`完成！共辨識 ${total} 筆活動。\n新增 ${addedEvents} 筆，合併 ${mergedEvents} 筆重複活動。\n已顯示在行事曆 ${addedCalendarDays} 個日期上。`);
  };

  console.log('Polly school calendar importer fix loaded');
})();
