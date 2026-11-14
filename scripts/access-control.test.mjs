import {selectAccessMode} from '../lib/accessMode.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {resolveCommandAccess} from '../lib/commandAccess.js';
import {ownerIdentity} from '../lib/ownerIdentity.js';
const source=fs.readFileSync(new URL('../index.js',import.meta.url),'utf8');
let owner=false,sudo=false,restricted=false,assignments=0;
const sandbox={ownerIdentity,process:{env:{}},BOT_MODE:'silent',_cache_bot_mode:{mode:'silent'},
    getSudoMode:()=>restricted,getPhoneFromLid:()=>null,lidPhoneCache:new Map(),
    AUTO_LINK_ENABLED:true,AUTO_CONNECT_ON_LINK:false,
    jidManager:{isOwner:()=>owner,isSudo:()=>sudo,setNewOwner:()=>{assignments++;return {success:true};}},
};
sandbox.getEffectiveAccessMode=()=>selectAccessMode(sandbox._cache_bot_mode,null,sandbox.BOT_MODE);
vm.createContext(sandbox);
const start=source.indexOf('function checkBotMode(');
vm.runInContext(source.slice(start,source.indexOf('function isPresenceEnabled()',start)),sandbox);
const group={key:{remoteJid:'123@g.us',participant:'254700000002@s.whatsapp.net'}};
const dm={key:{remoteJid:'254700000002@s.whatsapp.net'}};
assert.equal(sandbox.checkBotMode(group,'ping'),false);
assert.equal(sandbox.checkBotMode(dm,'ping'),false);
sudo=true; assert.equal(sandbox.checkBotMode(group,'ping'),true); sudo=false;
owner=true; assert.equal(sandbox.checkBotMode(group,'ping'),true); owner=false;
sandbox._cache_bot_mode.mode='public';assert.equal(sandbox.checkBotMode(group,'ping'),true);
restricted=true;assert.equal(sandbox.checkBotMode(group,'ping'),false);restricted=false;
sandbox._cache_bot_mode.mode='invalid';assert.equal(sandbox.checkBotMode(group,'ping'),false);
sandbox.jidManager.isOwner=()=>{throw new Error('identity unavailable');};
assert.equal(sandbox.checkBotMode(group,'ping'),false);
sandbox.jidManager.isOwner=()=>false;
const classStart=source.indexOf('class AutoLinkSystem {');
vm.runInContext(source.slice(classStart,source.indexOf('const autoLinkSystem =',classStart))+';globalThis.linker=new AutoLinkSystem();',sandbox);
const sock={user:{id:'254700000001@s.whatsapp.net',lid:'188000000000001@lid'}};
assert.equal(await sandbox.linker.shouldAutoLink(sock,group),false);
assert.equal(assignments,0,'Unknown owner phone must not allow ownership takeover');
assert.equal(await sandbox.linker.shouldAutoLink(sock,{key:{remoteJid:'2547999000001@s.whatsapp.net'}}),false);
assert.equal(assignments,0,'Similar phone suffix must not grant ownership');
assert.equal(await sandbox.linker.shouldAutoLink(sock,{key:{remoteJid:'188000000000001@lid'}}),true);
assert.equal(assignments,1);
assert.equal(sandbox.linker.isSimilarNumber('254700123456','999123456'),false);
assert(source.includes("_cbActive && checkBotMode(msg, 'chatbot', verifiedAccess.sudo, verifiedAccess.owner)"));
console.log('Silent/public/sudo-only modes, error denial, chatbot gating and owner-takeover regressions passed.');

const liveSock={user:{id:'254700000001:7@s.whatsapp.net',lid:'188000000000001@lid'},signalRepository:{lidMapping:{getPNForLID:async id=>id==='188000000000002@lid'?'254700000002@s.whatsapp.net':null}}};
const msg=id=>({key:{remoteJid:id}});
assert.deepEqual(await resolveCommandAccess(liveSock,msg('254700000003@s.whatsapp.net'),['254700000002']),{owner:false,sudo:false});
assert.equal((await resolveCommandAccess(liveSock,msg('188000000000002@lid'),['254700000002'])).sudo,true);
assert.equal((await resolveCommandAccess(liveSock,msg('188000000000001:4@lid'),[])).owner,true);
assert.equal((await resolveCommandAccess(liveSock,msg('188000000000003@lid'),['254700000002'])).sudo,false);
sandbox._cache_bot_mode.mode='silent';
sandbox.jidManager.isOwner=()=>true;
sandbox.jidManager.isSudo=()=>true;
assert.equal(sandbox.checkBotMode(group,'ping',false,false),false,'Cached owner/sudo roles must not override verified denial');
assert.equal(sandbox.checkBotMode(group,'ping',true,false),true);
assert(source.indexOf('const verifiedAccess =')<source.indexOf('await command.execute('));
console.log('Connected-account authorization and stale-role bypass regression checks passed.');

assert.equal(selectAccessMode({mode:'public'}, {mode:'silent',setAt:'2026-10-29T10:00:00Z'}),'silent');
assert.equal(selectAccessMode({mode:'public',setAt:'2026-10-29T11:00:00Z'}, {mode:'silent',setAt:'2026-10-29T10:00:00Z'}),'public');
assert.equal(selectAccessMode({mode:'public'}, {mode:'silent'}),'silent');
assert.equal(selectAccessMode(null,null,'invalid'),'silent');
console.log('Saved/runtime mode reconciliation checks passed.');
