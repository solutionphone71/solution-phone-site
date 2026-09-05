// No network or real leads: exercise the exact homepage bridge and journey script.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const base=new URL('../',import.meta.url),html=fs.readFileSync(new URL('index.html',base),'utf8');
const start=html.indexOf('    window.SolutionPhoneQuote={'),end=html.indexOf('\n    };',start)+7;
assert.ok(start>0&&end>start);
const context={window:{},IPHONE_MODEL_KEYS:['13'],iphoneLabel:k=>'iPhone '+k,normalize:s=>s.trim().toLowerCase(),liveScreenModels:new Set(['13']),liveBatteryModels:new Set(['13']),screens:{13:[45,50,65,90,115]},batteries:{13:[45,60,115]},QUALITES:['hd','ltps','ltpsp','oled','relife'].map(id=>({id,name:id,desc:id})),QUALITES_BAT:['compat','ti','orig'].map(id=>({id,name:id,desc:id})),openMail:s=>context.mail=s,priceDataReady:Promise.resolve()};
vm.runInNewContext(html.slice(start,end),context);
const api=context.window.SolutionPhoneQuote;
assert.deepEqual(Array.from(api.prices('iPhone 13','screen'),x=>x.price),[45,65,90,115]);
assert.equal(api.prices('Samsung A54','screen').length,0);
assert.equal(api.prices('iPhone 13','water').length,0);
assert.equal(api.prices('iPhone 13 Pro','screen').length,0);
context.liveScreenModels.clear();assert.equal(api.prices('iPhone 13','screen').length,0);context.liveScreenModels.add('13');
class Node {
  constructor(){this.value='';this.children=[];this.events={};this.dataset={};this.hidden=false;this.attrs={};}
  addEventListener(k,fn){this.events[k]=fn;}
  appendChild(n){this.children.push(n);}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(){this.children=[];this.textContent='';}
  setAttribute(k,v){this.attrs[k]=v;}
  focus(){this.focused=true;}
}
const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
const buttons=['screen','battery','charge','camera','water','other'].map(k=>{const n=new Node();n.dataset.journeyIssue=k;return n;});
const root=new Node();root.querySelectorAll=()=>buttons;
const dock=new Node();dock.href='https://wa.me/33783921884';
context.document={querySelector:selector=>selector==='.quote-journey'?root:dock,getElementById:get,createElement:()=>new Node()};
vm.runInNewContext(fs.readFileSync(new URL('quote-journey.js',base),'utf8'),context);
await Promise.resolve();assert.equal(get('journey-result').hidden,true);
buttons[0].events.click();assert.equal(get('journey-model').focused,true);assert.equal(get('journey-result').hidden,true);
get('journey-model').value='iPhone 13';get('journey-model').events.input();
assert.equal(get('journey-result').hidden,false);assert.equal(get('journey-qualities').hidden,false);
assert.equal(get('journey-quality-list').children.length,4);
assert.equal(get('journey-price').children[0].textContent,'À partir de 45 €');
const message=()=>new URL(get('journey-whatsapp').href).searchParams.get('text');
assert.match(message(),/iPhone 13.*Écran cassé/);assert.match(message(),/45 €/);
assert.equal(dock.href,get('journey-whatsapp').href);
get('journey-email').events.click();assert.match(context.mail,/iPhone 13.*Écran cassé/);assert.equal(api.draft(),context.mail);
get('journey-model').value='Pixel <Pro> & 16';get('journey-model').events.input();
assert.equal(get('journey-qualities').hidden,true);assert.match(message(),/Pixel <Pro> & 16/);assert.ok(!message().includes('45 €'));
buttons[4].events.click();assert.equal(get('journey-safety').hidden,false);assert.equal(buttons[0].attrs['aria-pressed'],'false');
get('journey-model').value='';get('journey-model').events.input();assert.equal(get('journey-result').hidden,true);assert.equal(api.draft(),undefined);
get('journey-unknown').events.click();assert.equal(get('journey-result').hidden,false);assert.match(message(),/Modèle à identifier/);
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))if(!/src=|application\/ld\+json/.test(match[1]))new vm.Script(match[2]);
console.log('Quote journey: pricing, unavailable catalogue, unknown model, safe text, state changes, email prefill and inline syntax passed. No network requests.');
