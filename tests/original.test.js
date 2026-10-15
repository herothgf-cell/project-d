'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/core.js');
const L={width:5,height:4,walls:[4,9],bodies:[[6,5],[13,14]],goals:[1,18]};
const S=()=>E.start(L);
test('growth at the active head removes exactly one cell from the other tail',()=>{
 const s=S(),r=E.move(L,s,0,'U');
 assert.equal(r.ok,true); assert.deepEqual(r.state.bodies,[[1,6,5],[13]]);
 assert.equal(r.event.donor,1);assert.equal(r.event.from,14);assert.equal(r.event.to,1);
 assert.deepEqual(s.bodies,[[6,5],[13,14]],'must not mutate history');
});
test('the rule is symmetric',()=>{const r=E.move(L,S(),1,'D');assert.equal(r.ok,true);assert.deepEqual(r.state.bodies,[[6],[18,13,14]]);});
test('cannot borrow a final head',()=>{const s={bodies:[[1,6,5],[13]]};const r=E.move(L,s,0,'R');assert.equal(r.ok,false);assert.equal(r.reason,'last-head');assert.deepEqual(r.state,s);});
test('blocked by your own body',()=>{assert.equal(E.move(L,S(),0,'L').reason,'body');});
test('blocked by the donor tail even though it would otherwise disappear',()=>{const s={bodies:[[6,5],[12,7]]};assert.equal(E.move(L,s,0,'R').reason,'body');});
test('blocked by a wall',()=>{const s={bodies:[[8,7],[16,15]]};assert.equal(E.move(L,s,0,'R').reason,'wall');});
test('out of bounds is not row wrapping',()=>{const s={bodies:[[5,6],[13,14]]};assert.equal(E.move(L,s,0,'L').reason,'edge');});
test('invalid controls do not change the state',()=>{assert.equal(E.move(L,S(),7,'U').ok,false);assert.equal(E.move(L,S(),0,'Q').ok,false);});
test('both heads, not their bodies, must occupy matching homes',()=>{
 assert.equal(E.won(L,{bodies:[[1,6],[18,13]]}),true);
 assert.equal(E.won(L,{bodies:[[6,1],[18,13]]}),false);
 assert.equal(E.won(L,{bodies:[[18,13],[1,6]]}),false);
});
test('a head on its home can still move and exchange body length',()=>{const s={bodies:[[1,6],[13,14]]};assert.equal(E.move(L,s,0,'R').ok,true);});
test('BFS returns a shortest reproducible solution',()=>{
 const r=E.solve(L,S(),5000);assert.ok(Array.isArray(r.path));assert.equal(r.path.length,2);
 let s=S();for(const a of r.path){let n=E.move(L,s,a.actor,a.dir);assert.equal(n.ok,true);s=n.state;}assert.equal(E.won(L,s),true);
});
test('bounded search reports budget exhaustion separately from no solution',()=>{
 const r=E.solve(L,S(),1);assert.equal(r.path,null);assert.equal(r.exhausted,true);
});
test('validates total length, connected ordered bodies, and no overlap',()=>{
 assert.equal(E.validate(L,S()),true);
 assert.equal(E.validate(L,{bodies:[[6,7],[7,12]]}),false);
 assert.equal(E.validate(L,{bodies:[[6,16],[13,14]]}),false);
 assert.equal(E.validate(L,{bodies:[[6],[13,14]]}),false);
});
const levels=require('../src/levels.js');
for(const level of levels){
 test(`level ${level.id}: shortest solution, state invariants, and restart`,()=>{
   let s=E.start(level);const original=JSON.stringify(s);
   assert.equal(E.validate(level,s),true);assert.equal(E.won(level,s),false);
   const r=E.solve(level,s,250000);assert.equal(r.exhausted,false);
   assert.equal(r.path.length,level.optimal);
   for(const a of level.solution){
     const before=s, snapshot=JSON.stringify(before),next=E.move(level,s,a.actor,a.dir);
     assert.equal(next.ok,true);s=next.state;assert.equal(E.validate(level,s),true);
     assert.equal(JSON.stringify(before),snapshot);
   }
   assert.equal(E.won(level,s),true);assert.equal(JSON.stringify(E.start(level)),original);
 });
}
test('1000 deterministic random legal moves preserve lengths, adjacency, and collision safety',()=>{
 let seed=11235;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const l of levels){let s=E.start(l);for(let i=0;i<200;i++){
   const possible=E.legalMoves(l,s);if(possible.length===0){s=E.start(l);continue;}
   s=possible[Math.floor(random()*possible.length)].state;assert.equal(E.validate(l,s),true);
 }}
});
