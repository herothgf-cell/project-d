/* Body Share Lab: deterministic, DOM-free rules. Bodies are ordered head -> tail.
   Cell ids are row-major. A move checks occupancy BEFORE exchanging a cell. */
(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory();
  else root.BodyShare=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DIRS=Object.freeze({U:[0,-1],R:[1,0],D:[0,1],L:[-1,0]});
function start(level){return {bodies:level.bodies.map(b=>b.slice())};}
function key(state){return state.bodies.map(b=>b.join(',')).join('|');}
function move(level,state,actor,dir){
  const fail=reason=>({ok:false,reason,state});
  if((actor!==0&&actor!==1)||!Object.hasOwn(DIRS,dir)) return fail('input');
  const donor=1-actor,other=state.bodies[donor],body=state.bodies[actor];
  if(other.length<=1) return fail('last-head');
  const [dx,dy]=DIRS[dir],head=body[0];
  const x=head%level.width+dx,y=Math.floor(head/level.width)+dy;
  if(x<0||x>=level.width||y<0||y>=level.height) return fail('edge');
  const to=y*level.width+x;
  if(level.walls.includes(to)) return fail('wall');
  if(state.bodies.some(b=>b.includes(to))) return fail('body');
  const bodies=state.bodies.map(b=>b.slice()),from=other[other.length-1];
  bodies[actor].unshift(to);bodies[donor].pop();
  return {ok:true,state:{bodies},event:{actor,donor,from,to}};
}
function won(level,state){return state.bodies.every((b,i)=>b[0]===level.goals[i]);}
function legalMoves(level,state){
 const out=[];
 for(let actor=0;actor<2;actor++)for(const dir of Object.keys(DIRS)){
   const result=move(level,state,actor,dir);
   if(result.ok)out.push({actor,dir,...result});
 }
 return out;
}
function solve(level,initial=start(level),maxNodes=200000){
  if(won(level,initial)) return {path:[],visited:1,exhausted:false};
  const nodes=[{state:initial,parent:-1,action:null}],seen=new Set([key(initial)]);
  for(let cursor=0;cursor<nodes.length;cursor++){
    for(const next of legalMoves(level,nodes[cursor].state)){
      const k=key(next.state);if(seen.has(k))continue;
      if(nodes.length>=maxNodes)return {path:null,visited:nodes.length,exhausted:true};
      const index=nodes.length;
      nodes.push({state:next.state,parent:cursor,action:{actor:next.actor,dir:next.dir}});seen.add(k);
      if(won(level,next.state)){
        const path=[];for(let i=index;nodes[i].parent!==-1;i=nodes[i].parent)path.push(nodes[i].action);
        return {path:path.reverse(),visited:nodes.length,exhausted:false};
      }
    }
  }
  return {path:null,visited:nodes.length,exhausted:false};
}
function validate(level,state){
 if(!state||!Array.isArray(state.bodies)||state.bodies.length!==2) return false;
 if(!state.bodies.every(Array.isArray)) return false;
  const flat=state.bodies.flat(),total=level.bodies.flat().length;
 if(flat.length!==total||new Set(flat).size!==flat.length) return false;
 return state.bodies.every(b=>b.length>0&&b.every((cell,i)=>{
   if(!Number.isInteger(cell)||cell<0||cell>=level.width*level.height||level.walls.includes(cell))return false;
   if(i===0)return true;
   const prev=b[i-1];return Math.abs(cell%level.width-prev%level.width)+Math.abs(Math.floor(cell/level.width)-Math.floor(prev/level.width))===1;
 }));
}
function classify(level,state){return won(level,state)?'won':legalMoves(level,state).length?'playing':'blocked';}
return Object.freeze({DIRS,start,key,move,won,legalMoves,solve,validate,classify});
});
