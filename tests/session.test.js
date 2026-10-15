'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const E=require('../src/core.js'), S=require('../src/session.js');
const L={id:1,width:5,height:4,walls:[4,9],bodies:[[6,5],[13,14]],goals:[1,18]};
const data=()=>S.fresh(L);
test('classify prioritizes success even if no moves are legal',()=>{
 const l={width:4,height:1,walls:[],bodies:[[0,1],[3,2]],goals:[0,3]};
 assert.equal(E.classify(l,E.start(l)),'won'); l.goals=[1,2]; assert.equal(E.classify(l,E.start(l)),'blocked');
});
test('one immobile player is not a global failure',()=>assert.equal(E.classify(L,{bodies:[[1,6,5],[13]]}),'playing'));
test('validation rejects malformed bodies without throwing',()=>{for(const v of [null,{}, {bodies:[null,[]]},{bodies:['x',[]]}])assert.equal(E.validate(L,v),false);});
test('session step does not mutate previous state',()=>{const s=data(),before=JSON.stringify(s);const r=S.step(L,s,0,'U');assert.equal(r.ok,true);assert.equal(r.session.actions.length,1);assert.equal(JSON.stringify(s),before);});
test('invalid input never adds a move or creates a failure',()=>{const s=data(),r=S.step(L,s,0,'L');assert.equal(r.ok,false);assert.equal(r.session.actions.length,0);assert.equal(r.session.stats.invalid,1);assert.equal(r.session.stats.blocks,0);});
test('undo restores full state and active player',()=>{const s=data(),r=S.step(L,s,0,'U').session,u=S.undo(L,r);assert.deepEqual(u.state,s.state);assert.equal(u.actions.length,0);assert.equal(u.selected,0);assert.equal(u.stats.undos,1);});
test('reaching homes marks completion, then undo remains possible',()=>{let s=S.step(L,data(),0,'U').session;s=S.step(L,s,1,'D').session;assert.equal(s.complete,true);assert.equal(s.best,2);assert.equal(E.classify(L,s.state),'won');const u=S.undo(L,s);assert.equal(E.won(L,u.state),false);assert.equal(u.complete,true);assert.equal(u.best,2);});
test('reset preserves completion and records but clears path',()=>{let s=S.step(L,data(),0,'U').session;s=S.step(L,s,1,'D').session;const r=S.reset(L,s);assert.equal(r.actions.length,0);assert.deepEqual(r.state,E.start(L));assert.equal(r.complete,true);assert.equal(r.stats.resets,1);});
test('save and reload reconstruct history so undo works after reload',()=>{let s=S.step(L,data(),0,'U').session;s.selected=1;s.hint=2;const r=S.restore(L,S.pack(L,s));assert.deepEqual(r.state,s.state);assert.equal(r.selected,1);assert.equal(r.hint,2);assert.deepEqual(S.undo(L,r).state,E.start(L));});
test('changed level geometry invalidates only its saved board',()=>{const s=S.step(L,data(),0,'U').session;const r=S.restore({...L,goals:[2,18]},S.pack(L,s));assert.equal(r,null);});
test('illegal and post-win actions in saves are rejected',()=>{const raw=S.pack(L,data());raw.actions=[{actor:0,dir:'L'}];assert.equal(S.restore(L,raw),null);raw.actions=[{actor:0,dir:'U'},{actor:1,dir:'D'},{actor:0,dir:'R'}];assert.equal(S.restore(L,raw),null);});
test('invalid save metadata is sanitized',()=>{const raw=S.pack(L,data());raw.selected=9;raw.hint=-5;raw.stats={invalid:-20};raw.best=-2;const s=S.restore(L,raw);assert.equal(s.selected,0);assert.equal(s.hint,0);assert.equal(s.stats.invalid,0);assert.equal(s.best,null);});
test('corrupt or forbidden storage does not stop play',()=>{
 const bad={getItem(){throw Error('denied')},setItem(){throw Error('quota')}};
 const r=S.load([L],bad);assert.equal(r.current,1);assert.equal(r.sessions[1].actions.length,0);assert.ok(r.notice);assert.equal(S.save(r,bad),false);
 const malformed=S.load([L],{getItem:()=>'{bad'});assert.ok(malformed.notice);
});
test('root version and level index are validated',()=>{for(const v of [{version:900},{version:2,current:999,entries:null}]){const r=S.load([L],{getItem:()=>JSON.stringify(v)});assert.equal(r.current,1);assert.equal(r.sessions[1].actions.length,0);}});
test('all stage progress persists independently',()=>{const l2={...L,id:2};let value=null;const store={getItem:()=>value,setItem:(k,v)=>value=v};const root=S.load([L,l2],store);root.sessions[1]=S.step(L,root.sessions[1],0,'U').session;root.current=2;assert.equal(S.save(root,store),true);const out=S.load([L,l2],store);assert.equal(out.current,2);assert.equal(out.sessions[1].actions.length,1);assert.equal(out.sessions[2].actions.length,0);});
