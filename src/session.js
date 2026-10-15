/* Replay-validated sessions. No DOM, network, timers, or implicit storage access. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));
 else root.BodyShareSession=factory(root.BodyShare);
})(typeof globalThis!=='undefined'?globalThis:this,function(E){
'use strict';
const KEY='body-share:v02',VERSION=2;
const counters=()=>({invalid:0,undos:0,resets:0,blocks:0});
const natural=n=>Number.isSafeInteger(n)&&n>=0?n:0;
function fingerprint(l){return JSON.stringify([l.width,l.height,l.walls,l.bodies,l.goals]);}
function fresh(l){return {state:E.start(l),actions:[],selected:0,hint:0,stats:counters(),complete:false,best:null};}
function step(l,s,actor,dir){
 if(E.won(l,s.state))return {ok:false,reason:'complete',session:s};
 const r=E.move(l,s.state,actor,dir);
 if(!r.ok)return {...r,session:{...s,stats:{...s.stats,invalid:s.stats.invalid+1}}};
 const actions=[...s.actions,{actor,dir}],done=E.won(l,r.state);
 const stats={...s.stats,blocks:s.stats.blocks+(E.classify(l,r.state)==='blocked'?1:0)};
 return {...r,session:{...s,state:r.state,actions,selected:actor,stats,complete:s.complete||done,
  best:done?Math.min(s.best??Infinity,actions.length):s.best}};
}
function replay(l,actions){
 let state=E.start(l);
 for(const a of actions){
  if(!a||E.won(l,state))return null;
  const r=E.move(l,state,a.actor,a.dir);if(!r.ok)return null;state=r.state;
 }
 return state;
}
function undo(l,s){
 if(!s.actions.length)return s;
 const last=s.actions[s.actions.length-1],actions=s.actions.slice(0,-1);
 return {...s,state:replay(l,actions),actions,selected:last.actor,stats:{...s.stats,undos:s.stats.undos+1}};
}
function reset(l,s){return {...fresh(l),complete:s.complete,best:s.best,stats:{...s.stats,resets:s.stats.resets+1}};}
function pack(l,s){return {fingerprint:fingerprint(l),actions:s.actions,selected:s.selected,hint:s.hint,stats:s.stats,complete:s.complete,best:s.best};}
function restore(l,raw){
 if(!raw||raw.fingerprint!==fingerprint(l)||!Array.isArray(raw.actions)||raw.actions.length>100000)return null;
 const state=replay(l,raw.actions);if(!state)return null;
 const s=fresh(l);s.state=state;s.actions=raw.actions.map(a=>({actor:a.actor,dir:a.dir}));
 s.selected=raw.selected===1?1:0;s.hint=Math.min(2,natural(raw.hint));
 for(const k of Object.keys(s.stats))s.stats[k]=natural(raw.stats?.[k]);
 s.complete=raw.complete===true||E.won(l,state);
 s.best=Number.isSafeInteger(raw.best)&&raw.best>=0&&s.complete?raw.best:null;
 return s;
}
function load(levels,storage){
 const root={levels,current:levels[0].id,sessions:Object.fromEntries(levels.map(l=>[l.id,fresh(l)])),notice:''};
 try{
  const text=storage.getItem(KEY);if(!text)return root;
  if(text.length>1000000)throw Error('oversized');
  const raw=JSON.parse(text);
  if(!raw||raw.version!==VERSION){root.notice='이전 버전의 저장은 새 규칙에 맞춰 초기화했어요.';return root;}
  if(levels.some(l=>l.id===raw.current))root.current=raw.current;
  for(const l of levels){
   if(!raw.entries?.[l.id])continue;
   const s=restore(l,raw.entries[l.id]);
   if(s)root.sessions[l.id]=s;else root.notice='배치가 바뀌었거나 손상된 스테이지의 진행을 초기화했어요.';
  }
 }catch{root.notice='저장을 읽을 수 없어요. 이 화면에서는 계속 플레이할 수 있어요.';}
 return root;
}
function save(root,storage){
 try{
  const entries=Object.fromEntries(root.levels.map(l=>[l.id,pack(l,root.sessions[l.id])]));
  const text=JSON.stringify({version:VERSION,current:root.current,entries});
  if(text.length>1000000)return false;
  storage.setItem(KEY,text);return true;
 }catch{return false;}
}
return Object.freeze({KEY,VERSION,fresh,step,undo,reset,pack,restore,load,save,fingerprint,replay});
});
