const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
class El{
 constructor(doc){this.doc=doc;this.children=[];this.events={};this.value='';this.textContent='';this.open=false;this.checked=false;this.disabled=false;}
 append(...children){for(const c of children){this.children.push(c);if(c.id)this.doc.ids[c.id]=c;}}
 insertBefore(c){this.children.unshift(c);if(c.id)this.doc.ids[c.id]=c;}
 set innerHTML(s){this.html=s;for(const m of s.matchAll(/id="([^"]+)"/g))this.doc.ids[m[1]]=new El(this.doc);}
 setAttribute(){}
 addEventListener(name,fn){this.events[name]=fn;}
 showModal(){this.open=true;}close(){this.open=false;}focus(){}select(){}
 click(){this.doc.downloads.push({href:this.href,name:this.download});}remove(){}
}
function setup(rows=[],failure=false){
 const d={ids:{},hidden:false,events:{},downloads:[],getElementById(id){return this.ids[id]||null;},createElement(){return new El(this);},querySelector(){return this.body;},addEventListener(n,f){this.events[n]=f;}};
 d.body=new El(d);d.head=new El(d);d.ids.inicio=new El(d);
 const storage={},calls=[],copied=[],shared=[],timers=[];
 class FakeDate extends Date{constructor(...args){super(...(args.length?args:['2026-10-24T10:00:00Z']));}static now(){return new FakeDate().getTime();}}
 const c={document:d,localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},navigator:{canShare:()=>true,share:async s=>shared.push(s)},events:{},addEventListener(n,f){this.events[n]=f;},setInterval:f=>timers.push(f),setTimeout:()=>{},File,Blob,Date:FakeDate,Intl,URL,AbortSignal,console,fetch:async(url)=>{calls.push(url);if(failure)throw Error('Sem rede');return{ok:true,json:async()=>rows,headers:{get:()=>`0-${rows.length}/${rows.length}`}};}};
 c.window=c;vm.createContext(c);vm.runInContext("const API='https://example.test/rest/v1/ocorrencias';const HEADERS={};",c);vm.runInContext(fs.readFileSync('daily-summary.js','utf8'),c);
 return{c,d,storage,calls,copied,shared,timers};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 let t=setup([{id:1,created_at:'2026-10-23T12:00:00Z',linha:'VL01',equipamento:'Robô',status:'Pendente',falha:'<img src=x>'}]);await settle();
 assert.equal(t.calls.length,1);assert.match(t.d.ids.lmDailyStatus.textContent,/pronto/);
 await t.d.ids.lmDailyOpen.events.click();assert.equal(t.d.ids.lmDailySummaryDialog.open,true);
 assert.match(t.d.ids.lmDailyReportPreview.srcdoc,/&lt;img src=x&gt;/);
 await t.d.ids.lmDailySave.events.click();assert.equal(t.d.downloads.length,1);assert.equal(t.d.downloads[0].name,'Relatorio_Diario_Ocorrencias_2026-10-23.html');
 await t.d.ids.lmDailyShare.events.click();assert.equal(t.shared.length,1);assert.match(t.d.ids.lmDailyShareStatus.textContent,/conferida no WhatsApp/);
 assert.equal(t.shared[0].files[0].type,'text/html');assert.match(await t.shared[0].files[0].text(),/<!doctype html>/);
 t.c.navigator.canShare=()=>false;await t.d.ids.lmDailyShare.events.click();assert.equal(t.shared.length,1);assert.match(t.d.ids.lmDailyShareStatus.textContent,/Salvar HTML/);t.c.navigator.canShare=()=>true;
 t.c.navigator.share=async()=>{const e=new Error();e.name='AbortError';throw e;};await t.d.ids.lmDailyShare.events.click();assert.match(t.d.ids.lmDailyShareStatus.textContent,/cancelado/);
 assert.equal(t.d.ids.lmDailySummaryDialog.open,true);
 await t.timers[0]();await settle();assert.equal(t.calls.length,1);
 assert.ok(!Object.values(t.storage).join('').includes('Robô'));
 t=setup([]);await settle();assert.match(t.d.ids.lmDailyStatus.textContent,/ignorado/);assert.equal(t.d.ids.lmDailySummaryDialog.open,false);assert.equal(JSON.parse(Object.values(t.storage)[0]).empty,true);
 t=setup([],true);await settle();assert.match(t.d.ids.lmDailyStatus.textContent,/Sem rede/);assert.equal(Object.keys(t.storage).length,0);
 console.log('PASS: preparação HTML, prévia segura, download, compartilhar arquivo, alternativa para navegador incompatível, cancelamento, dia vazio e falha sem marcar vazio.');
})().catch(e=>{console.error(e);process.exit(1)});
