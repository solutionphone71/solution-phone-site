import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const { chromium }=require('/Users/sebastiencannard/Documents/Codex/2026-11-11/retire-v1-v2-stock/node_modules/playwright-core');
const origin='https://solution-phone.fr';
const legacy='https://kdvxcnjfrmvlnrymfyug.supabase.co/functions/v1/public-catalog?resource=prices';
const names=['17 pro max','17 pro','17 air','17','16 pro max','16 pro','16 plus','16e','16','15 pro max','15 pro','15 plus','15','14 pro max','14 pro','14 plus','14','13 pro max','13 pro','13 mini','13','12 pro max','12 pro','12 mini','12'];
const approved=names.map(modele=>({modele,prix:[null,80,null,modele==='15'?90:120,null]}));
const legacyData={prices:{screens:[{modele:'15',prix:[null,80,null,105,null]}],batteries:[{modele:'15',prix:[65,null,null]}]}};
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args:['--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run']});
async function scenario({asset=true,oldAvailable=true}={}){
  const context=await browser.newContext({serviceWorkers:'block'});
  let oldReads=0,assetReads=0,posts=0;
  try{
    await context.route('**/*',async route=>{
      const request=route.request();const url=request.url();
      if(request.method()!=='GET'){posts++;return route.abort();}
      if(url===origin+'/')return route.fulfill({status:200,contentType:'text/html',body:await readFile(join(root,'index.html'))});
      if(url===origin+'/apple-screens-20261112-v2.js'){
        assetReads++;
        const body=asset==='real'?await readFile(join(root,'apple-screens-20261112-v2.js'))
          :'window.SolutionPhoneApprovedIphoneScreens='+JSON.stringify(approved);
        return route.fulfill(asset?{status:200,contentType:'text/javascript',body}:{status:404,body:''});
      }
      if(url===legacy){oldReads++;return route.fulfill({status:oldAvailable?200:503,contentType:'application/json',
        headers:{'access-control-allow-origin':origin},body:JSON.stringify(oldAvailable?legacyData:{error:'unavailable'})});}
      if(url.startsWith(origin+'/')){
        const relative=url.slice(origin.length+1).split('?')[0];
        if(!/^[a-z0-9/_.-]+$/i.test(relative)||relative.includes('..'))return route.abort();
        try{return route.fulfill({status:200,body:await readFile(join(root,relative)),contentType:relative.endsWith('.js')?'text/javascript':'text/plain'});}
        catch{return route.abort();}
      }
      return route.abort();
    });
    const page=await context.newPage();
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.SolutionPhoneQuote?.ready);
    await page.evaluate(()=>window.SolutionPhoneQuote.ready);
    const result=await page.evaluate(()=>({
      sourceRows:{screen:window.SolutionPhoneQuote.catalogRows?.screen?.length,
        battery:window.SolutionPhoneQuote.catalogRows?.battery?.length,
        screen15:window.SolutionPhoneQuote.catalogRows?.screen?.find(x=>x.modele==='15')?.prix?.[3],
        battery15:window.SolutionPhoneQuote.catalogRows?.battery?.find(x=>x.modele==='15')?.prix?.[0]},
      screen:window.SolutionPhoneQuote.prices('iPhone 15','screen').map(x=>x.price),
      battery:window.SolutionPhoneQuote.prices('iPhone 15','battery').map(x=>x.price),
      screen17:window.SolutionPhoneQuote.prices('iPhone 17','screen').map(x=>x.price),
      battery17:window.SolutionPhoneQuote.prices('iPhone 17','battery').map(x=>x.price),
    }));
    return {result,oldReads,assetReads,posts};
  } finally{await context.close();}
}
try{
  const normal=await scenario();
  assert.deepEqual(normal.result.sourceRows,{screen:25,battery:1,screen15:90,battery15:65});
  assert(normal.result.screen.includes(90));assert(!normal.result.screen.includes(105));
  assert(normal.result.battery.includes(65));assert(normal.result.screen17.includes(120));
  assert.deepEqual(normal.result.battery17,[]);
  assert.deepEqual([normal.assetReads,normal.oldReads,normal.posts],[1,2,0]);
  const actual=await scenario({asset:'real'});
  assert(actual.result.screen.includes(90)&&actual.result.screen17.length>0);
  assert(actual.result.battery.includes(65));
  const oldDown=await scenario({oldAvailable:false});
  assert(oldDown.result.screen.includes(90)&&!oldDown.result.screen.includes(105));
  assert.equal(oldDown.result.sourceRows.screen,25);
  assert.deepEqual(oldDown.result.battery,[]); // The existing public quote path has no battery fallback.
  const noAsset=await scenario({asset:false});
  assert.deepEqual(noAsset.result.screen,[]);assert(noAsset.result.battery.includes(65));
  assert.deepEqual(noAsset.result.sourceRows,{screen:0,battery:1,screen15:undefined,battery15:65});
  console.log(JSON.stringify({status:'PASS_LOCAL_ONLY',approvedScreensOverrideOldCatalog:true,
    batteriesStillUseOldCatalog:true,noAssetFailsScreenClosed:true,posts:0,productionWrites:0}));
}finally{await browser.close();}
