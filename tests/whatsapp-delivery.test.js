import test from 'node:test';
import assert from 'node:assert/strict';
import { replyWindow, withDelivery } from '../lib/whatsappDelivery.js';
import webhook from '../api/webhooks/whatsapp.js';
import send from '../api/whatsapp/send.js';
const res = () => ({ setHeader() {}, status(code) { this.code=code;return this; }, json(body) {this.body=body;} });
test('reply window excludes old, outgoing and other students messages',()=>{
 const now=Date.now();
 const incoming={direction:'incoming',leadPhone:'9876543210',timestamp:new Date(now-1000).toISOString()};
 assert.equal(replyWindow([incoming],'919876543210',now).open,true);
 for(const record of [{...incoming,direction:'outgoing'},{...incoming,leadPhone:'9876543211'},{...incoming,timestamp:new Date(now-86400000).toISOString()}]) assert.equal(replyWindow([record],'9876543210',now).open,false);
});
test('delivered and read are not downgraded by delayed receipts',()=>{
 assert.equal(withDelivery({status:'accepted'},{sent:{status:'sent'},read:{status:'read'},failed:{status:'failed'}}).status,'read');
 assert.equal(withDelivery({status:'accepted'},{failed:{status:'failed',errors:[{code:131047,message:'Window closed'}]}}).deliveryErrors[0].code,131047);
});
test('webhook persists all statuses and incoming messages across entries',async t=>{
 const writes=[];
 t.mock.method(globalThis,'fetch',async(url,options)=>{writes.push({url,data:JSON.parse(options.body)});return {ok:true};});
 const response=res();
 await webhook({method:'POST',body:{entry:[{changes:[{value:{statuses:[{id:'m1',status:'failed',timestamp:'1700000000',errors:[{code:131047,error_data:{details:'Window closed'}}]},{id:'m2',status:'delivered',timestamp:'1700000001'}]}}]},{changes:[{value:{messages:[{id:'m3',from:'919876543210',timestamp:'1700000002',text:{body:'Hello'}},{id:'m4',from:'919876543211',timestamp:'1700000003',text:{body:'Hi'}}]}}]}]}},response);
 assert.equal(response.code,200); assert.equal(writes.length,4);
 assert.equal(writes[0].data.errors[0].code,131047);
 assert.equal(writes[2].data.timestamp,new Date(1700000002000).toISOString());
});
test('failed persistence returns retryable response',async t=>{
 t.mock.method(globalThis,'fetch',async()=>({ok:false}));
 const response=res();
 await webhook({method:'POST',body:{entry:[{changes:[{value:{statuses:[{id:'m1',status:'sent'}]}}]}]}},response);
 assert.equal(response.code,503);
});
test('closed window is rejected before contacting Meta',async t=>{
 const calls=[];
 t.mock.method(globalThis,'fetch',async url=>{ calls.push(url); return {ok:true,json:async()=>url.endsWith('employees.json')?[{id:'e1',name:'Employee',password:'secret',role:'Employee'}]:url.endsWith('leads.json')?[{id:'l1',phone:'9876543210',counselor:'Employee'}]:{}}; });
 const response=res();
 await send({method:'POST',headers:{authorization:'Basic '+Buffer.from(JSON.stringify({id:'e1',password:'secret'})).toString('base64')},body:{phone:'9876543210',message:'Hi'}},response);
 assert.equal(response.code,409);
 assert.equal(calls.some(url=>url.includes('graph.facebook.com')),false);
});
