// 261A01 1A 2.5hr：圖片型 Syllabus 固定資料 fallback（Class 1-56）
(function(){
 const rows=[
[1,'1A Unit 1','W1 · SB 2-3 · Unit 1 Week 1 p.1-2 · Grammar Pre-Lesson: Alphabet A-Z HWB p.71; Days of the Week HWB p.72 · Role Play Unit 1 #1 · Spelling WS W1 #1 HWB p.21'],
[2,'1A Unit 1','Review W1 · WB 2-3 · Grammar Pre-Lesson: Be Verb HWB p.73-74; Numbers 1-10 HWB p.75 · Role Play Unit 1 #1 · Copy words X3 & sentence X1'],
[3,'1A Unit 1','Review W1 · Practice Spelling Test · SB 4-5 · Unit 1 Week 1 p.1-2 · Role Play Unit 1 #2 · Study for spelling test · Spelling WS W1 #2 HWB p.22'],
[4,'1A Unit 1','Review W1 · W1 Spelling Test · W2 · WB 4-5 · Unit 1 Week 1 p.3-4 · Role Play Unit 1 #2 · Spelling WS W2 #1 HWB p.23 · HW WS Week 1 HWB p.104'],
[5,'1A Unit 1','Review W2 · SB 6-7 · Unit 1 Week 2 p.5-6 · Role Play Unit 1 #3 · Copy words X3 & sentence X1'],
[6,'1A Unit 1','Review W2 · WB 6-7 · Unit 1 Week 2 p.7-8 · Role Play Unit 1 #3 · Study for spelling test · Spelling WS W2 #2 HWB p.24 · HW WS Week 2 HWB p.105'],
[7,'1A Unit 1','Review W2 · W2 Spelling Test · W3 · SB 8-9 · Unit 1 Week 3 p.9-10 · Role Play Unit 1 #4 · Spelling WS W3 #1 HWB p.25 · HW WS Week 3-1 HWB p.106'],
[8,'1A Unit 1','Review W3 · WB 8-9 · Unit 1 Week 3 p.11-12 · Role Play Unit 1 #4 · Copy words X3 & sentence X1 · HW WS Week 3-2 HWB p.107'],
[9,'1A Unit 1','Review W3 · SB 10-11 · Unit 1 Week 4 p.13-14 · Role Play Unit 1 #5 · Study for spelling test · Spelling WS W3 #2 HWB p.26 · HW WS Week 3-3 HWB p.108'],
[10,'1A Unit 1','Review W3 · W3 Spelling Test · W4 · WB 10-11 · Unit 1 Week 4 p.15-16 · Role Play Unit 1 #5 · Spelling WS W4 #1 HWB p.27 · HW WS Week 4 HWB p.109'],
[11,'1A Unit 1','Review W4 · SB 12 · WB 12 · Review for the test · Writing Unit 1 HWB p.79-80 · First Draft HWB p.81 · Role Play Unit 1 #6 · Copy words X3 & sentence X1'],
[12,'1A Unit 1','Review W4 · SB 116 · WB 13 · Review Worksheet · Writing Final Copy HWB p.82 · Role Play Unit 1 #6 · Study for spelling test · Spelling WS W4 #2 HWB p.28 · Study for Unit Test'],
[13,'1A Unit 2','Review W4 · W4 Spelling Test · W5 · Review / Unit 1 Test · Reader 1: My Backpack HWB p.3-4 · Role Play Unit 1 #6 · Spelling WS W5 #1 HWB p.29'],
[14,'1A Unit 2','Review W5 · SB 14-15 · Unit 2 Week 5 p.17-18 · Reader 2: Meet My Farm Friends HWB p.5-6 · Book Report HWB p.98 · Role Play Unit 2 #1 · Copy words X3 & sentence X1'],
[15,'1A Unit 2','Review W5 · WB 14-15 · Unit 2 Week 5 p.19-20 · Role Play Unit 2 #1 · Study for spelling test · Spelling WS W5 #2 HWB p.30 · HW WS Week 5 HWB p.110'],
[16,'1A Unit 2','Review W5 · W5 Spelling Test · W6 · SB 16-17 · Unit 2 Week 6 p.21-22 · Role Play Unit 2 #2 · Spelling WS W6 #1 HWB p.31'],
[17,'1A Unit 2','Review W6 · WB 16-17 · Unit 2 Week 6 p.23-24 · Role Play Unit 2 #2 · Copy words X3 & sentence X1 · HW WS Week 6 HWB p.111'],
[18,'1A Unit 2','Review W6 · SB 18-19 · Unit 2 Week 7 p.25-26 · Role Play Unit 2 #3 · Study for spelling test · Spelling WS W6 #2 HWB p.32'],
[19,'1A Unit 2','Review W6 · W6 Spelling Test · W7 · WB 18-19 · Unit 2 Week 7 p.27-28 · Role Play Unit 2 #3 · Spelling WS W7 #1 HWB p.33 · HW WS Week 7 HWB p.112'],
[20,'1A Unit 2','Review W7 · SB 20-21 · Unit 2 Week 8 p.29-30 · Reader Theater I Part 1 HWB p.67 · Role Play Unit 2 #4 · Copy words X3 & sentence X1 · HW WS Week 8-1 HWB p.113'],
[21,'1A Unit 2','Review W7 · WB 20-21 · Unit 2 Week 8 p.31-32 · Reader Theater I Part 2 HWB p.67 · Role Play Unit 2 #4 · Study for spelling test · Spelling WS W7 #2 HWB p.34 · HW WS Week 8-2 HWB p.114'],
[22,'1A Unit 2','Review W7 · W7 Spelling Test · W8 · SB 22-23 · Unit 2 Week 8 p.33-35 · Reader Theater I Part 2 HWB p.67 · Role Play Unit 2 #5 · Spelling WS W8 #1 HWB p.35 · HW WS Week 8-3 HWB p.115'],
[23,'1A Unit 2','Review W8 · WB 22-23 · Writing Unit 2 HWB p.83-84 · First Draft HWB p.84 · Role Play Unit 2 #5 · Copy words X3 & sentence X1'],
[24,'1A Unit 2','Review W8 · SB 24 · WB 24 · Review for the test · Writing Final Copy HWB p.85 · Role Play Unit 2 #6 · Study for spelling test · Spelling WS W8 #2 HWB p.36'],
[25,'1A Unit 3','Review W8 · W8 Spelling Test · W9 · SB 117 · WB 25 · Review Worksheet · Reader 3: Shapes HWB p.7-8 · Role Play Unit 2 #6 · Spelling WS W9 #1 HWB p.37 · Study for Unit Test'],
[26,'1A Unit 3','Review W9 · Review / Unit 2 Test · Reader 4: Doing Jobs Together HWB p.9-10 · Book Report HWB p.99 · Role Play Unit 2 #7 · Copy words X3 & sentence X1'],
[27,'1A Unit 3','Review W9 · SB 30-31 · Unit 3 Week 9 p.33-34 · Role Play Unit 3 #1 · Study for spelling test · Spelling WS W9 #2 HWB p.38'],
[28,'1A Unit 3','Review W9 · W9 Spelling Test · W10 · WB 30-31 · Unit 3 Week 9 p.35-36 · Role Play Unit 3 #1 · Spelling WS W10 #1 HWB p.39 · HW WS Week 9 HWB p.116'],
[29,'1A Unit 3','Review W10 · SB 32-33 · Unit 3 Week 10 p.37-38 · Role Play Unit 3 #2 · Copy words X3 & sentence X1 · HW WS Week 10-1 HWB p.117'],
[30,'1A Unit 3','Review W10 · WB 32-33 · Unit 3 Week 10 p.39-40 · Role Play Unit 3 #2 · Study for spelling test · Spelling WS W10 #2 HWB p.40 · HW WS Week 10-2 HWB p.118'],
[31,'1A Unit 3','Review W10 · W10 Spelling Test · W11 · SB 34-35 · Unit 3 Week 11 p.41-42 · Role Play Unit 3 #3 · Spelling WS W11 #1 HWB p.41'],
[32,'1A Unit 3','Review W11 · WB 34-35 · Unit 3 Week 11 p.43-44 · Role Play Unit 3 #3 · Copy words X3 & sentence X1 · HW WS Week 11 HWB p.119'],
[33,'1A Unit 3','Review W11 · SB 36-37 · Unit 3 Week 12 p.45-46 · Role Play Unit 3 #4 · Study for spelling test · Spelling WS W11 #2 HWB p.42 · HW WS Week 12-1 HWB p.120'],
[34,'1A Unit 3','Review W11 · W11 Spelling Test · W12 · WB 36-37 · Unit 3 Week 12 p.47-48 · Role Play Unit 3 #4 · Spelling WS W12 #1 HWB p.43 · HW WS Week 12-2 HWB p.121'],
[35,'1A Unit 3','Review W12 · SB 38-39 · Writing Unit 3 HWB p.86-87 · First Draft HWB p.88 · Role Play Unit 3 #5 · Copy words X3 & sentence X1'],
[36,'1A Unit 3','Review W12 · WB 38-39 · Writing Final Copy HWB p.89 · Role Play Unit 3 #5 · Study for spelling test · Spelling WS W12 #2 HWB p.44'],
[37,'1A Unit 4','Review W12 · W12 Spelling Test · W13 · SB 40 · WB 40 · Review for the test · Role Play Unit 3 #6 · Spelling WS W13 #1 HWB p.45'],
[38,'1A Unit 4','Review W13 · SB 118 · WB 41 · Review Worksheet · Reader 5: Living on a Farm HWB p.11-12 · Role Play Unit 3 #6 · Copy words X3 & sentence X1 · Study for Unit Test'],
[39,'1A Unit 4','Review W13 · Review / Unit 3 Test · Reader 6: What People Do HWB p.13-14 · Book Report HWB p.100 · Role Play Unit 3 #7 · Study for spelling test · Spelling WS W13 #2 HWB p.46'],
[40,'1A Unit 4','Review W13 · W13 Spelling Test · W14 · SB 42-43 · Unit 4 Week 13 p.49-50 · Role Play Unit 4 #1 · Spelling WS W14 #1 HWB p.47'],
[41,'1A Unit 4','Review W14 · WB 42-43 · Unit 4 Week 13 p.51-52 · Role Play Unit 4 #1 · Copy words X3 & sentence X1 · HW WS Week 13 HWB p.122'],
[42,'1A Unit 4','Review W14 · SB 44-45 · Unit 4 Week 14 p.53-54 · Role Play Unit 4 #2 · Study for spelling test · Spelling WS W14 #2 HWB p.48 · HW WS Week 14-1 HWB p.123'],
[43,'1A Unit 4','Review W14 · W14 Spelling Test · W15 · WB 44-45 · Unit 4 Week 14 p.55-56 · Role Play Unit 4 #2 · Spelling WS W15 #1 HWB p.49 · HW WS Week 14-2 HWB p.124'],
[44,'1A Unit 4','Review W15 · SB 46-47 · Unit 4 Week 15 p.57-58 · Role Play Unit 4 #3 · Copy words X3 & sentence X1 · HW WS Week 15-1 HWB p.125'],
[45,'1A Unit 4','Review W15 · WB 46-47 · Unit 4 Week 15 p.59-60 · Role Play Unit 4 #3 · Study for spelling test · Spelling WS W15 #2 HWB p.50 · HW WS Week 15-2 HWB p.126'],
[46,'1A Unit 4','Review W15 · W15 Spelling Test · W16 · SB 48-49 · Unit 4 Week 16 p.61-62 · Role Play Unit 4 #4 · Spelling WS W16 #1 HWB p.51'],
[47,'1A Unit 4','Review W16 · WB 48-49 · Unit 4 Week 16 p.63-64 · Reader Theater II Part 1 HWB p.68 · Role Play Unit 4 #4 · Copy words X3 & sentence X1 · HW WS Week 16 HWB p.127'],
[48,'1A Unit 4','Review W16 · SB 50-51 · Reader Theater II Part 2 HWB p.68 · Role Play Unit 4 #5 · Study for spelling test · Spelling WS W16 #2 HWB p.52'],
[49,'1A Review','Review W16 · W16 Spelling Test · W17 · WB 50-51 · Writing Unit 4 HWB p.90-91 · First Draft HWB p.92-94 · Role Play Unit 4 #5 · Spelling WS W17 #1 HWB p.53'],
[50,'1A Review','Review W17 · SB 52 · WB 52 · Review for the test · Writing Final Copy HWB p.95 · Role Play Unit 4 #6 · Copy words X3 & sentence X1'],
[51,'1A Review','Review W17 · SB 119 · WB 53 · Review Worksheet · Reader 7: Animals and Their Babies HWB p.15-16 · Role Play Unit 4 #6 · Study for spelling test · Spelling WS W17 #2 HWB p.54 · Study for Unit Test'],
[52,'1A Review','Review W17 · W17 Spelling Test · W18 · Review / Unit 4 Test · Reader 8: Seasons HWB p.17-18 · Book Report HWB p.101 · Role Play Unit 4 #7 · Spelling WS W18 #1 HWB p.55'],
[53,'1A Review','Review W18 · Review Unit 1-2 p.26-27 · Unit 10 Week 37 p.145 · Extra Reader Theater #1 · Copy words X3 & sentence X1'],
[54,'1A Review','Review W18 · Review Unit 1-2 p.28-29 · Unit 10 Week 37 p.146 · Extra Reader Theater #1 · Spelling WS W18 #2 HWB p.56 · Study for spelling test'],
[55,'1A Review','Review W18 · W18 Spelling Test · W19 · Review Unit 3-4 p.54-55 · Unit 10 Week 37 p.147 · Finish Student Portfolio · Review and finish all incomplete pages · Spelling WS W19 #1-2 HWB p.57-58'],
[56,'1A Review','W20 · Spelling WS W20 #1-2 HWB p.59-60 · Review Unit 3-4 p.56-57 · Unit 10 Week 37 p.148 · Finish Student Portfolio · Review and finish all incomplete pages']
 ];
 const seed=()=>rows.map(([classNo,unit,content])=>({classNo,unit,title:`Class ${classNo} · ${unit}`,content}));
 window.Polly261A01Syllabus=seed;
 function install(){
   if(typeof window.confirmAIImport!=='function')return false;
   const base=window.confirmAIImport;
   if(base.__polly261A01Wrapped)return true;
   function wrapped(){
     try{
       if(window.pendingImport?.att){
         const code=String(pendingImport.att.code||'').toUpperCase().replace(/^(\d{2})-EL-/,'$1-');
         if(code==='26-1A-01'){
           const dates=new Map((pendingImport.att.dates||[]).map(x=>[Number(x.classNo),x.date]));
           pendingImport.lessons=seed().map(l=>({...l,date:dates.get(l.classNo)||''}));
           pendingImport.unmatched=[];
           pendingImport.syl=pendingImport.syl||{};
           pendingImport.syl.lessons=pendingImport.lessons;
         }
       }
     }catch(e){console.warn('261A01 seed fallback',e)}
     return base.apply(this,arguments);
   }
   wrapped.__polly261A01Wrapped=true;
   window.confirmAIImport=wrapped;
   return true;
 }
 if(!install()){let n=0;const t=setInterval(()=>{if(install()||++n>50)clearInterval(t)},200)}
})();