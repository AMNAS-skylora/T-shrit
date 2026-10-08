const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, dependencies) {
  const code = ts.transpileModule(fs.readFileSync(path,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
  const result={exports:{}};
  new Function('require','module','exports',code)((name)=>name in dependencies?dependencies[name]:require(name),result,result.exports);
  return result.exports;
}
function setup() {
  const env={email:'admin@example.test',password:'initial-password-test',sessionSecret:'test-secret-with-more-than-32-characters'};
  let row=null;
  let outage=false;
  const collection={
    findOne:async()=>{if(outage)throw new Error('Database unavailable');return row&&{...row};},
    insertOne:async(doc)=>{if(row)throw new Error('duplicate key');row={...doc};},
    updateOne:async(filter,update)=>{if(!row||row.version!==filter.version)return {matchedCount:0};row={...row,...update.$set};return {matchedCount:1};},
  };
  const serverEnv={getAdminEnvironment:()=>env,getMongoEnvironment:()=>({})};
  const account=load('src/lib/admin-account.ts',{'server-only':{},'@/lib/mongodb':{getDb:async()=>({collection:()=>collection})},'@/lib/server-env':serverEnv});
  const auth=load('src/lib/admin-auth.ts',{'server-only':{},'@/lib/admin-account':account,'@/lib/server-env':serverEnv,'next/headers':{},'next/navigation':{}});
  return {env,account,auth,getRow:()=>row,setOutage:()=>{outage=true;}};
}
test('bootstrap login migrates to hashed credentials and rejects old environment credentials',async()=>{
  const {env,account,auth,getRow}=setup();
  assert.ok(await auth.verifyAdminCredentials(env.email,env.password));
  const oldToken=auth.createAdminSessionToken(env.email);
  assert.equal(await auth.verifyAdminSessionToken(oldToken),true);
  const saved=await account.changeAdminAccount({email:' NEW@example.test ',currentPassword:env.password,newPassword:'new-strong-password-test'});
  assert.equal(saved.email,'new@example.test');
  assert.match(getRow().passwordHash,/^scrypt\$/);
  assert.equal(JSON.stringify(getRow()).includes('new-strong-password-test'),false);
  assert.equal(await auth.verifyAdminCredentials(env.email,env.password),null);
  assert.ok(await auth.verifyAdminCredentials(saved.email,'new-strong-password-test'));
  assert.equal(await auth.verifyAdminSessionToken(oldToken),false);
  assert.equal(await auth.verifyAdminSessionToken(auth.createAdminSessionToken(saved.email,saved.version)),true);
});
test('password changes invalidate existing sessions even when email is unchanged',async()=>{
  const {env,account,auth}=setup();
  const first=await account.changeAdminAccount({email:env.email,currentPassword:env.password,newPassword:'first-password-test'});
  const old=auth.createAdminSessionToken(first.email,first.version);
  const second=await account.changeAdminAccount({email:env.email,currentPassword:'first-password-test',newPassword:'second-password-test'});
  assert.equal(await auth.verifyAdminSessionToken(old),false);
  assert.equal(await auth.verifyAdminCredentials(env.email,'first-password-test'),null);
  assert.ok(await auth.verifyAdminCredentials(env.email,'second-password-test'));
  assert.equal(await auth.verifyAdminSessionToken(auth.createAdminSessionToken(second.email,second.version)),true);
});
test('email-only changes preserve the password and invalid changes leave account untouched',async()=>{
  const {env,account,auth,getRow}=setup();
  await assert.rejects(account.changeAdminAccount({email:'invalid',currentPassword:env.password,newPassword:'short'}));
  await assert.rejects(account.changeAdminAccount({email:env.email,currentPassword:'wrong',newPassword:'new-password-test'}));
  assert.equal(getRow(),null);
  await account.changeAdminAccount({email:'other@example.test',currentPassword:env.password,newPassword:''});
  assert.ok(await auth.verifyAdminCredentials('other@example.test',env.password));
});
test('authentication rejects tampered sessions, non-string credentials and database outages',async()=>{
  const {env,auth,setOutage}=setup();
  const token=auth.createAdminSessionToken(env.email);
  assert.equal(await auth.verifyAdminSessionToken(token+'tampered'),false);
  assert.equal(await auth.verifyAdminCredentials(123,{}),null);
  setOutage();
  assert.equal(await auth.verifyAdminSessionToken(token),false);
  await assert.rejects(auth.verifyAdminCredentials(env.email,env.password));
});
