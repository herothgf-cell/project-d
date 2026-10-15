'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../src/core.js'),levels=require('../src/levels.js');
test('12 unique stages cover four difficulty groups without new mechanics',()=>{
 assert.equal(levels.length,12);assert.equal(new Set(levels.map(l=>l.id)).size,12);
 for(const d of ['입문','기초','응용','도전'])assert.equal(levels.filter(l=>l.difficulty===d).length,3);
 for(const l of levels){assert.equal(l.hints.length,2);assert.equal(l.bodies.length,2);assert.ok(l.width<=7&&l.height<=7);assert.equal(l.goals.length,2);assert.notEqual(l.goals[0],l.goals[1]);for(const g of l.goals)assert.ok(!l.walls.includes(g));}
});
for(const l of levels.filter(l=>l.trap.length))test(`level ${l.id}: documented failure is legal, not a success, and undo can recover`,()=>{
 let s=E.start(l),previous;
 for(const a of l.trap){assert.equal(E.won(l,s),false);previous=s;const r=E.move(l,s,a.actor,a.dir);assert.ok(r.ok);s=r.state;}
 assert.equal(E.classify(l,s),'blocked');assert.notEqual(E.classify(l,previous),'blocked');
});
test('tutorial 2 is intentionally forced; later stages contain meaningful choice points',()=>{
 for(const l of levels){let s=E.start(l),choices=0;for(const a of l.solution){if(E.legalMoves(l,s).length>1)choices++;s=E.move(l,s,a.actor,a.dir).state;}
  if(l.id===2)assert.equal(choices,0);else if(l.id>=4)assert.ok(choices>=2);}
});
