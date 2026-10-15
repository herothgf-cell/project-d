const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');
test('production build contains all code and no network runtime dependencies',()=>{
 const r=cp.spawnSync(process.execPath,['scripts/build.cjs'],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
 const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
 assert.ok(html.includes('BodyShareApp'));assert.ok(html.includes('BodyShareSession'));
 assert.ok(!html.includes('<script src='));assert.ok(!html.includes('rel="stylesheet"'));assert.ok(fs.existsSync(path.join(root,'dist/.nojekyll')));
});
