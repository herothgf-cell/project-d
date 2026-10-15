'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const E=require('../src/core.js'),levels=require('../src/levels.js');
const reports=[];
for(const l of levels){
 assert.ok(E.validate(l,E.start(l)),`Invalid starting body: ${l.id}`);
 const r=E.solve(l,E.start(l),250000);
 assert.ok(!r.exhausted,`Search cap reached (not proof of no solution): ${l.id}`);
 assert.ok(r.path,`No solution: ${l.id}`);assert.equal(r.path.length,l.optimal);
 let s=E.start(l),choices=0;
 for(const a of l.solution){if(E.legalMoves(l,s).length>1)choices++;const m=E.move(l,s,a.actor,a.dir);assert.ok(m.ok);s=m.state;assert.ok(E.validate(l,s));}
 assert.ok(E.won(l,s));
 if(l.trap.length){s=E.start(l);for(const a of l.trap){assert.ok(!E.won(l,s));const m=E.move(l,s,a.actor,a.dir);assert.ok(m.ok);s=m.state;}assert.equal(E.classify(l,s),'blocked');}
 reports.push({id:l.id,title:l.title,difficulty:l.difficulty,optimal:r.path.length,visited:r.visited,choicePointsOnReferencePath:choices,verifiedBlockedExampleSteps:l.trap.length||null});
}
const dir=path.resolve(__dirname,'../test-results');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'levels.json'),JSON.stringify(reports,null,2));
console.table(reports);console.log('All 12 solutions verified. Difficulty labels still require human playtesting.');
