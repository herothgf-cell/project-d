/* Mobile-first view. Rules/session code is shared by touch, mouse and keyboard. */
(function(){
'use strict';
const E=window.BodyShare,S=window.BodyShareSession,levels=window.BodyShareLevels;
const $=id=>document.getElementById(id),canvas=$('board'),ctx=canvas.getContext('2d');
const colors=['#e57f65','#458f99'],dark=['#8c4f3e','#315c65'],names=['빨강','파랑'];
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let storage;
try{storage=window.localStorage;}catch{storage={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};}
const root=S.load(levels,storage);
let demo=null,pointer=null,preview=null,message='',animation=null,frame=0;
const level=()=>levels.find(l=>l.id===root.current);
const session=()=>root.sessions[root.current];
const view=()=>demo?demo.state:session().state;
const active=()=>demo?demo.actor:session().selected;
const on=(el,event,fn)=>el.addEventListener(event,fn);
function persist(){
 const ok=S.save(root,storage);
 $('saveLabel').textContent=ok?'이 기기에 자동 저장':'저장 안 됨 · 현재 화면에서 계속 가능';
 if(!ok){$('saveNotice').hidden=false;$('saveNotice').textContent='브라우저가 저장을 허용하지 않아요. 창을 닫으면 진행이 사라질 수 있어요.';}
}
function select(actor){if(demo)return;root.sessions[root.current]={...session(),selected:actor};message='';preview=null;persist();paint();}
function attempt(actor,dir){
 if(demo)return;
 const l=level(),r=S.step(l,session(),actor,dir);root.sessions[root.current]=r.session;
 const errors={'last-head':'상대에게 머리만 남았어요. 상대를 먼저 움직여주세요.',wall:'벽이 있는 칸이에요.',body:'몸이 있는 칸이에요. 먼저 꼬리를 비워주세요.',edge:'보드 밖으로는 갈 수 없어요.',input:'방향을 다시 골라주세요.',complete:'두 친구가 함께 도착했어요!'};
 message=r.ok?`${names[actor]} +1 · ${names[1-actor]} 꼬리 −1`:errors[r.reason];
 animation=r.ok&&!reduced.matches?{...r.event,start:performance.now()}:null;
 preview=null;persist();paint(r.ok?null:'error');
}
function undo(){if(demo)return;root.sessions[root.current]=S.undo(level(),session());message='한 걸음 되돌렸어요. 다른 순서를 시도해보세요.';animation=null;preview=null;persist();paint();}
function reset(){demo=null;root.sessions[root.current]=S.reset(level(),session());message='';animation=null;preview=null;persist();paint();}
function choose(id){
 if(!levels.some(l=>l.id===id))return;
 demo=null;pointer=null;preview=null;animation=null;message='';root.current=id;persist();paint();
}
function showDialog(id){pointer=null;preview=null;$(id).showModal();}
function hint(){
 if(demo)return;
 if(session().hint>=2){startDemo('solution');return;}
 root.sessions[root.current]={...session(),hint:session().hint+1};persist();paint();
}
function startDemo(type){
 const l=level(),actions=l[type];if(!actions.length)return;
 demo={type,actions,index:0,state:E.start(l),actor:actions[0].actor};
 pointer=null;preview=null;animation=null;paint();
}
function demoStep(delta){
 if(!demo)return;
 demo.index=Math.max(0,Math.min(demo.actions.length,demo.index+delta));
 demo.state=S.replay(level(),demo.actions.slice(0,demo.index));
 demo.actor=demo.actions[Math.max(0,demo.index-1)].actor;animation=null;paint();
}
function stageMarkup(full){
 return ['입문','기초','응용','도전'].map((group,i)=>{
  const list=levels.filter(l=>l.difficulty===group);
  const buttons=list.map(l=>{const done=root.sessions[l.id].complete,sel=l.id===root.current;
   return full?`<button class="stage-row ${sel?'active':''}" data-level="${l.id}"><span class="num">${String(l.id).padStart(2,'0')}</span><strong>${l.title}</strong><span class="done-mark">${done?'완료':'→'}</span></button>`:
   `<button class="stage-dot ${sel?'active':''} ${done?'done':''}" data-level="${l.id}" aria-label="${l.id}. ${l.title}${done?' 완료':''}" ${sel?'aria-current="step"':''}>${String(l.id).padStart(2,'0')}</button>`;
  }).join('');
  return full?`<section class="list-section"><h3>0${i+1} · ${group}</h3>${buttons}</section>`:`<section class="chapter"><div class="chapter-label"><b>${group}</b>0${i+1}</div><div class="stage-dots">${buttons}</div></section>`;
 }).join('');
}
function paint(errorKind){
 const l=level(),s=session(),state=view(),selected=active(),kind=E.classify(l,state);
 $('levelNumber').textContent=`${String(l.id).padStart(2,'0')} / 12`;
 $('difficulty').textContent=l.difficulty;$('levelTitle').textContent=l.title;
 $('moves').textContent=demo?demo.index:s.actions.length;
 $('progressLabel').textContent=`${levels.filter(x=>root.sessions[x.id].complete).length} / 12`;
 for(const [i,key]of ['red','blue'].entries()){
  const b=state.bodies[i],total=l.bodies.flat().length;
  $(key+'Length').textContent=b.length;$(key+'Home').textContent=b[0]===l.goals[i]?'집 도착':'';
  $(key+'Pips').innerHTML=Array.from({length:total-1},(_,j)=>`<i class="pip ${j<b.length?'on':''}"></i>`).join('');
  $(i?'chooseBlue':'chooseRed').setAttribute('aria-pressed',String(selected===i));
  $(i?'chooseBlue':'chooseRed').disabled=Boolean(demo);
 }
 let text=message||'얼굴을 끌거나, 친구를 고른 뒤 인접한 빈칸을 눌러보세요.';
 if(kind==='blocked')text='둘 다 움직일 수 없어요. 되돌려 다른 순서를 시도해보세요.';
 else if(kind==='won')text='두 얼굴이 자기 집에 함께 도착했어요.';
 else if(!message&&state.bodies[1-selected].length===1)text='상대에게 머리만 남았어요. 상대를 먼저 움직여주세요.';
 $('status').textContent=demo?'시범을 보고 있어요. 내 진행과 기록은 바뀌지 않아요.':text;
 $('status').dataset.kind=demo?'playing':kind==='playing'&&errorKind?errorKind:kind;
 $('undo').disabled=s.actions.length===0||Boolean(demo);$('reset').disabled=Boolean(demo);$('hint').disabled=Boolean(demo);
 document.querySelectorAll('[data-dir]').forEach(b=>b.disabled=Boolean(demo)||kind==='won');
 $('winPanel').hidden=Boolean(demo)||kind!=='won';
 $('winDetail').textContent=`${s.actions.length}걸음 · 내 최소 기록 ${s.best??s.actions.length}걸음`;
 $('next').textContent=l.id===12?'스테이지 보기':'다음 퍼즐 →';
 $('hintBox').hidden=Boolean(demo)||s.hint===0;
 $('hintStep').textContent=s.hint===1?'힌트 1 / 3 · 관찰하기':'힌트 2 / 3 · 생각의 방향';
 $('hintText').textContent=l.hints[Math.max(0,s.hint-1)];
 $('hintLabel').textContent=s.hint===0?'힌트':s.hint===1?'다음 힌트':'풀이 시범';
 $('demoPanel').hidden=!demo;$('demoBadge').hidden=!demo;$('controls').hidden=Boolean(demo);
 if(demo){
  $('demoBadge').textContent=demo.type==='solution'?'풀이 시범 · 내 진행은 그대로':'막힘 시범 · 내 진행은 그대로';
  const a=demo.actions[demo.index],verb={U:'위',R:'오른쪽',D:'아래',L:'왼쪽'};
  $('demoText').textContent=`${demo.index} / ${demo.actions.length}걸음 · `+(a?`다음은 ${names[a.actor]}을 ${verb[a.dir]}로 한 칸.`:demo.type==='solution'?'함께 도착했어요. 내 퍼즐에서 다시 생각해보세요.':'둘 다 막혔어요. 어떤 선택에서 길이 막혔는지 이전 걸음과 비교해보세요.');
  $('demoNext').disabled=demo.index>=demo.actions.length;$('demoPrev').disabled=demo.index===0;
 }
 $('desktopStages').innerHTML=stageMarkup(false);$('stageList').innerHTML=stageMarkup(true);
 $('debugStats').textContent=`스테이지 ${l.id} · ${l.tag}\n기준 최소 ${l.optimal}걸음 / 현재 ${s.actions.length}걸음\n가능한 이동 ${E.legalMoves(l,s.state).length}개\n무효 입력 ${s.stats.invalid} · 막힘 ${s.stats.blocks}\n되돌리기 ${s.stats.undos} · 초기화 ${s.stats.resets}`;
 $('trapDemo').disabled=!l.trap.length||Boolean(demo);
 canvas.setAttribute('aria-label',`${l.title}. ${names[selected]} 선택. 빨강 ${state.bodies[0].length}칸, 파랑 ${state.bodies[1].length}칸. ${kind==='blocked'?'둘 다 막혔어요. 되돌리기를 눌러주세요.':'방향 버튼으로 이동할 수 있어요.'}`);
 draw();
}
function geometry(){
 const l=level(),rect=canvas.getBoundingClientRect(),side=Math.max(l.width-2,l.height-2),cell=(rect.width-24)/side;
 return {rect,cell,ox:12+(side-l.width+2)*cell/2,oy:12+(side-l.height+2)*cell/2,size:rect.width};
}
function center(id,g=geometry()){
 const l=level();return {x:g.ox+(id%l.width-0.5)*g.cell,y:g.oy+(Math.floor(id/l.width)-0.5)*g.cell};
}
function cellAt(x,y){
 const g=geometry(),l=level(),cx=Math.floor((x-g.rect.left-g.ox)/g.cell)+1,cy=Math.floor((y-g.rect.top-g.oy)/g.cell)+1;
 return cx>=1&&cx<l.width-1&&cy>=1&&cy<l.height-1?cy*l.width+cx:-1;
}
function round(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
function mark(x,y,actor,r,fill){ctx.fillStyle=fill;ctx.beginPath();if(actor){ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();}else ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function draw(){
 cancelAnimationFrame(frame);frame=0;
 const l=level(),g=geometry(),state=view(),selected=active(),c=g.cell,ratio=Math.min(window.devicePixelRatio||1,3);
 if(!g.size)return;
 if(canvas.width!==Math.round(g.size*ratio)){canvas.width=Math.round(g.size*ratio);canvas.height=canvas.width;}
 ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,g.size,g.size);ctx.lineWidth=1;
 for(let y=1;y<l.height-1;y++)for(let x=1;x<l.width-1;x++){
  const id=y*l.width+x,p=center(id,g),wall=l.walls.includes(id);
  if(wall){round(p.x-c*.45,p.y-c*.42,c*.9,c*.86,c*.15,'#d1dbca');round(p.x-c*.42,p.y-c*.42,c*.84,c*.70,c*.13,'#dce4d5');}
  else round(p.x-c*.47,p.y-c*.47,c*.94,c*.94,c*.15,'#f9faf3','#e2e8dc');
 }
 // Homes remain visible below transparent body outlines and in the character labels.
 l.goals.forEach((id,i)=>{const p=center(id,g),s=c*.27;ctx.save();ctx.strokeStyle=colors[i];ctx.lineWidth=2;ctx.globalAlpha=.75;ctx.beginPath();ctx.moveTo(p.x-s,p.y);ctx.lineTo(p.x,p.y-s*.9);ctx.lineTo(p.x+s,p.y);ctx.moveTo(p.x-s*.7,p.y-s*.2);ctx.lineTo(p.x-s*.7,p.y+s*.75);ctx.lineTo(p.x+s*.7,p.y+s*.75);ctx.lineTo(p.x+s*.7,p.y-s*.2);ctx.stroke();mark(p.x,p.y+s*.16,i,c*.047,colors[i]);ctx.restore();});
 if(!demo&&E.classify(l,state)==='playing'){
  for(const a of E.legalMoves(l,state).filter(m=>m.actor===selected)){
   const p=center(a.event.to,g);ctx.save();ctx.globalAlpha=.30;mark(p.x,p.y,selected,c*.055,colors[selected]);ctx.restore();
  }
 }
 state.bodies.forEach((b,i)=>{
  if(b.length>1){ctx.beginPath();b.forEach((id,j)=>{const p=center(id,g);j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.lineWidth=c*.58;ctx.strokeStyle=colors[i];ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}
  for(let j=b.length-1;j>=0;j--){const p=center(b[j],g),head=j===0,s=c*(head?.73:.59);
   if(head&&i===selected){ctx.lineWidth=2;round(p.x-s/2-4,p.y-s/2-4,s+8,s+8,c*.22,null,'#fffefa');}
   ctx.lineWidth=1;round(p.x-s/2,p.y-s/2,s,s,c*.21,colors[i]);
   if(head){
    const look=b.length>1?{x:(b[0]%l.width-b[1]%l.width)*c*.025,y:(Math.floor(b[0]/l.width)-Math.floor(b[1]/l.width))*c*.025}:{x:0,y:0};
    ctx.fillStyle='#fffdf7';ctx.beginPath();ctx.ellipse(p.x-c*.12+look.x,p.y-c*.03+look.y,c*.055,c*.068,0,0,Math.PI*2);ctx.ellipse(p.x+c*.12+look.x,p.y-c*.03+look.y,c*.055,c*.068,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=dark[i];ctx.beginPath();ctx.arc(p.x-c*.12+look.x*2,p.y-c*.015+look.y*2,c*.022,0,Math.PI*2);ctx.arc(p.x+c*.12+look.x*2,p.y-c*.015+look.y*2,c*.022,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.strokeStyle=dark[i];ctx.lineWidth=c*.02;ctx.arc(p.x,p.y+c*.08,c*.067,.15,Math.PI-.15);ctx.stroke();
    mark(p.x,p.y-c*.23,i,c*.034,'#fffefa');
   }else{ctx.save();ctx.globalAlpha=.18;mark(p.x,p.y,i,c*.036,'#fffefa');ctx.restore();}
  }
 });
 // Keep every home identifiable even when another head or body occupies it.
 l.goals.forEach((id,i)=>{
  if(!state.bodies.some(b=>b.includes(id)))return;
  const p=center(id,g),x=p.x+c*.29,y=p.y+c*.29,r=c*.18;
  ctx.lineWidth=1;round(x-r,y-r,r*2,r*2,c*.06,'#fffefa',colors[i]);
  ctx.strokeStyle=colors[i];ctx.lineWidth=Math.max(1,c*.018);ctx.beginPath();
  ctx.moveTo(x-r*.65,y);ctx.lineTo(x,y-r*.58);ctx.lineTo(x+r*.65,y);
  ctx.moveTo(x-r*.43,y-r*.08);ctx.lineTo(x-r*.43,y+r*.50);ctx.lineTo(x+r*.43,y+r*.50);ctx.lineTo(x+r*.43,y-r*.08);ctx.stroke();
 });
 // A dashed ring is a direct consequence preview, not a hint toward the solution.
 const donor=state.bodies[1-selected];
 if(donor.length>1&&E.classify(l,state)==='playing'){
  const p=center(donor[donor.length-1],g),s=c*.72;ctx.save();ctx.lineWidth=1.7;ctx.setLineDash([3,3]);round(p.x-s/2,p.y-s/2,s,s,c*.22,null,dark[1-selected]);ctx.restore();
  const badge=c*.19;round(p.x+c*.12,p.y-c*.48,badge*1.8,badge*1.25,4,'#fffefa');ctx.fillStyle=dark[1-selected];ctx.font=`600 ${c*.12}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('−1',p.x+c*.29,p.y-c*.355);
 }
 if(preview&&!demo){const p=center(preview,g);ctx.save();ctx.globalAlpha=.45;ctx.lineWidth=2;ctx.setLineDash([4,3]);round(p.x-c*.35,p.y-c*.35,c*.7,c*.7,c*.2,null,colors[selected]);ctx.restore();}
 if(animation){const t=Math.min(1,(performance.now()-animation.start)/200),from=center(animation.from,g),to=center(animation.to,g),v=1-Math.pow(1-t,2);ctx.save();ctx.globalAlpha=(1-t)*.85;mark(from.x+(to.x-from.x)*v,from.y+(to.y-from.y)*v-Math.sin(Math.PI*t)*c*.35,animation.actor,c*.14,colors[animation.actor]);ctx.restore();if(t<1)frame=requestAnimationFrame(draw);else animation=null;}
}
function direction(dx,dy){return Math.abs(dx)>Math.abs(dy)?dx>0?'R':'L':dy>0?'D':'U';}
on(canvas,'pointerdown',e=>{
 if(demo)return;
 if(e.isPrimary===false||pointer){pointer=null;preview=null;draw();return;}
 if(e.button!==0)return;
 const cell=cellAt(e.clientX,e.clientY),actor=session().state.bodies.findIndex(b=>b[0]===cell);
 if(actor>=0)select(actor);
 pointer={id:e.pointerId,x:e.clientX,y:e.clientY,cell,fromHead:actor>=0,actor:session().selected};
 try{canvas.setPointerCapture(e.pointerId);}catch{/* Synthetic test input may have no active capture. */}
 e.preventDefault();
});
on(canvas,'pointermove',e=>{
 if(!pointer||pointer.id!==e.pointerId||!pointer.fromHead)return;
 const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
 if(Math.hypot(dx,dy)<10)return;
 const r=E.move(level(),session().state,pointer.actor,direction(dx,dy));preview=r.ok?r.event.to:null;draw();
});
on(canvas,'pointerup',e=>{
 if(!pointer||pointer.id!==e.pointerId)return;
 const p=pointer;pointer=null;preview=null;
 const dx=e.clientX-p.x,dy=e.clientY-p.y,threshold=Math.max(12,geometry().cell*.22);
 if(p.fromHead&&Math.hypot(dx,dy)>=threshold){attempt(p.actor,direction(dx,dy));return;}
 if(!p.fromHead&&Math.hypot(dx,dy)<threshold){
  const cell=cellAt(e.clientX,e.clientY),l=level(),head=session().state.bodies[p.actor][0];
  if(cell>=0&&cell===p.cell){const x=cell%l.width-head%l.width,y=Math.floor(cell/l.width)-Math.floor(head/l.width);if(Math.abs(x)+Math.abs(y)===1){attempt(p.actor,direction(x,y));return;}}
 }
 draw();
});
for(const name of ['pointercancel','lostpointercapture'])on(canvas,name,()=>{pointer=null;preview=null;draw();});
on(canvas,'contextmenu',e=>e.preventDefault());
for(const button of document.querySelectorAll('[data-dir]'))on(button,'click',()=>attempt(session().selected,button.dataset.dir));
for(const button of document.querySelectorAll('[data-actor]'))on(button,'click',()=>select(Number(button.dataset.actor)));
for(const nav of [$('desktopStages'),$('stageList')])on(nav,'click',e=>{const b=e.target.closest('[data-level]');if(!b)return;if($('stageDialog').open)$('stageDialog').close();choose(Number(b.dataset.level));});
on($('stageButton'),'click',()=>showDialog('stageDialog'));on($('rulesButton'),'click',()=>showDialog('rulesDialog'));
for(const b of document.querySelectorAll('[data-close]'))on(b,'click',()=>$(b.dataset.close).close());
on($('undo'),'click',undo);on($('reset'),'click',()=>showDialog('resetDialog'));on($('confirmReset'),'click',()=>{$('resetDialog').close();reset();});
on($('hint'),'click',hint);on($('next'),'click',()=>root.current===12?showDialog('stageDialog'):choose(root.current+1));
on($('demoNext'),'click',()=>demoStep(1));on($('demoPrev'),'click',()=>demoStep(-1));on($('demoExit'),'click',()=>{demo=null;message='시범을 마쳤어요. 원래 배치에서 계속 풀어보세요.';paint();});
on($('trapDemo'),'click',()=>startDemo('trap'));
on($('phonePreview'),'change',e=>{document.body.classList.toggle('phone',e.target.checked);requestAnimationFrame(draw);});
on($('exportReport'),'click',()=>{
 const report={version:'0.2.0',level:root.current,viewport:[innerWidth,innerHeight],levels:levels.map(l=>({id:l.id,title:l.title,...S.pack(l,root.sessions[l.id])}))};
 const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='body-share-test-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
on(window,'keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented||document.querySelector('dialog[open]')||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
 if(demo){if(e.key==='Escape'){demo=null;paint();}return;}
 const k=e.key.toLowerCase(),dirs={arrowup:'U',arrowright:'R',arrowdown:'D',arrowleft:'L',w:'U',d:'R',s:'D',a:'L'};
 if(dirs[k]){e.preventDefault();attempt(session().selected,dirs[k]);}
 else if(k==='1'||k==='2'){e.preventDefault();select(Number(k)-1);}
 else if(k==='z'){e.preventDefault();undo();}
 else if(k==='r'){e.preventDefault();showDialog('resetDialog');}
 else if(k==='h'){e.preventDefault();hint();}
});
on(window,'blur',()=>{pointer=null;preview=null;});on(window,'pagehide',persist);
on(document,'visibilitychange',()=>{pointer=null;preview=null;if(document.hidden)persist();});
new ResizeObserver(draw).observe(canvas);
if(root.notice){$('saveNotice').hidden=false;$('saveNotice').textContent=root.notice;}
persist();paint();
// Read-only diagnostics used by automated UI checks and manual PC testing.
window.BodyShareApp=Object.freeze({
 inspect:()=>JSON.parse(JSON.stringify({level:root.current,moves:session().actions.length,bodies:session().state.bodies,selected:session().selected,complete:session().complete,status:E.classify(level(),session().state),demo:Boolean(demo),stats:session().stats})),
 cellPoint:id=>{const g=geometry(),p=center(id,g);return {x:g.rect.left+p.x,y:g.rect.top+p.y,cell:g.cell};}
});
})();
