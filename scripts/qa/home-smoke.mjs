// Run after npm run build. All API responses are fixtures.
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {preview} from 'vite';
import {chromium} from 'playwright';
import {NAV_GROUPS} from '../../src/config/navigation.ts';
import {demoPlayer} from '../../src/data/demo.ts';
const origin='http://127.0.0.1:4173';
const server=await preview({preview:{host:'127.0.0.1',port:4173,strictPort:true}});
let browser;
const pass=name=>console.log('PASS '+name);
try{
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 const page=await context.newPage();
 page.setDefaultTimeout(12000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 let failMeta=true,metaCalls=0,failProfile=false,profileCalls=0;
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!==origin){await route.abort();return;}
  if(url.pathname.startsWith('/api/meta/')){
   metaCalls++;
   if(failMeta){await route.fulfill({status:503,json:{message:'QA fixture unavailable'}});return;}
   await route.fulfill({json:{rows:[],summary:{match_count:12,participant_count:96,player_count:12,latest_collected_at:null},minSampleSize:5,hasMore:false,page:0,assets:{}}});return;
  }
  if(url.pathname==='/api/tft/profile'){
   profileCalls++;
   if(failProfile){await route.fulfill({status:404,json:{message:'QA 테스트: 플레이어 없음'}});return;}
   const sample=demoPlayer();
   await route.fulfill({json:{...sample,demo:false,account:{...sample.account,gameName:url.searchParams.get('gameName'),tagLine:url.searchParams.get('tagLine')}}});return;
  }
  await route.continue();
 });
 const home=async()=>{await page.goto(origin+'/');await page.locator('.home-hub').waitFor({state:'visible'});};
 const focusIs=async selector=>{await page.waitForFunction(s=>document.querySelector(s)===document.activeElement,selector);};
 const overflow=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'horizontal overflow at '+page.viewportSize().width);
 const rootHtml=await readFile('dist/index.html','utf8');
 assert(rootHtml.includes('home-hub')&&rootHtml.includes('게임 중 바로 쓰는 계산기'),'homepage SSR');
 for(const item of NAV_GROUPS.flatMap(g=>g.items)){
  await access(item.href==='/'?'dist/index.html':'dist'+item.href+'/index.html');
  assert(rootHtml.includes('href="'+item.href+'"'),'SSR link '+item.href);
 }
 pass('static home and 19 menu destinations');
 await home();
 const trigger=page.locator('#global-nav-trigger-history');
 const menu=page.locator('#global-nav-panel-history');
 await trigger.click();await menu.waitFor({state:'visible'});
 await menu.locator('a').first().focus();await page.keyboard.press('Escape');
 await menu.waitFor({state:'hidden'});await focusIs('#global-nav-trigger-history');
 await trigger.click();await menu.locator('a').last().focus();await page.keyboard.press('Tab');await menu.waitFor({state:'hidden'});
 await trigger.click();await page.locator('.name-field input').click();await menu.waitFor({state:'hidden'});
 pass('desktop disclosure, ESC, Tab and outside close');
 for(const width of [320,375,768,900,901,1024,1280]){
  await page.setViewportSize({width,height:900});await home();await overflow();
  if(width<=900){
   await page.locator('.mobile-toggle').click();
   await page.locator('#global-navigation').waitFor({state:'visible'});
   await page.locator('#global-nav-trigger-lck').click();
   await page.locator('#global-nav-panel-lck').waitFor({state:'visible'});
   await overflow();
   await page.locator('.mobile-toggle').focus();await page.keyboard.press('Escape');
   await page.locator('#global-navigation').waitFor({state:'hidden'});await focusIs('.mobile-toggle');
  }else{
   for(const g of NAV_GROUPS){
    const btn=page.locator('#global-nav-trigger-'+g.id);await btn.click();
    const panel=page.locator('#global-nav-panel-'+g.id);await panel.waitFor({state:'visible'});
    const bounds=await panel.boundingBox();assert(bounds&&bounds.x>=-1&&bounds.x+bounds.width<=width+1,'desktop panel clipping '+g.id+' '+width);
    await btn.click();
   }
  }
 }
 pass('responsive 320, 375, 768, 900, 901, 1024, 1280');
 await page.setViewportSize({width:1280,height:900});await home();
 await page.getByRole('button',{name:'샘플 분석 보기 →'}).click();
 await page.locator('.notice.demo').waitFor({state:'visible'});await focusIs('.result-anchor');
 await page.locator('.home-hub').waitFor({state:'hidden'});
 await page.locator('.notice.demo button').click();await page.locator('.home-hub').waitFor({state:'visible'});
 await focusIs('.name-field input');
 pass('sample analysis open/close and focus restoration');
 failProfile=true;await page.locator('.name-field input').fill('QA Tester#TEST');
 await page.locator('.tag-field').waitFor({state:'hidden'});
 await page.locator('.search-form button.primary').click();
 await page.getByRole('alert').waitFor({state:'visible'});
 assert((await page.getByRole('alert').innerText()).includes('QA 테스트'));
 await page.locator('.home-hub').waitFor({state:'visible'});
 failProfile=false;await page.locator('.name-field input').fill('QA Tester#PASS');
 await page.locator('.search-form button.primary').click();
 await page.locator('.result-anchor').waitFor({state:'visible'});await focusIs('.result-anchor');
 const shared=new URL(page.url());assert.equal(shared.pathname,'/profile');assert.equal(shared.searchParams.get('tagLine'),'PASS');
 assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,follow');
 assert.equal(await page.locator('.home-hub').count(),0);
 await page.locator('.back-home').click();await page.locator('.home-hub').waitFor({state:'visible'});
 await page.goto(origin+'/profile?gameName=QA+Shared&tagLine=KR1&section=meta');
 await page.locator('.result-anchor').waitFor({state:'visible'});
 assert.equal(await page.locator('.home-hub').count(),0);assert(profileCalls>=3);
 pass('profile failure, success, shared URL and legacy query');
 await home();
 const before=metaCalls;
 await page.waitForTimeout(250);
 assert.equal(metaCalls,before,'meta must not start above fold');
 await page.locator('.meta-preview').scrollIntoViewIfNeeded();
 await page.locator('.meta-retry').waitFor({state:'visible'});
 failMeta=false;await page.locator('.meta-retry').click();
 await page.getByText('최소 표본을 충족한 항목이 아직 없습니다.').first().waitFor({state:'visible'});
 await page.locator('.meta-retry').waitFor({state:'hidden'});
 pass('deferred meta preview and retry');
 for(const [path,group,link] of [
  ['/tools/reroll-calculator','tools','/tools/reroll-calculator'],
  ['/set19/unlocks/tibbers','season','/set19/unlocks'],
  ['/esports/lck/2027/t1','lck','/esports/lck/2027/stove-league'],
  ['/esports/lck/history/players/faker','history','/esports/lck/history/players'],
  ['/esports/lck/history/results/2026-season','history','/esports/lck/history/results']
 ]){
  await page.goto(origin+path);
  await page.locator('#global-nav-trigger-'+group+'.is-active').waitFor({state:'visible'});
  await page.locator('#global-nav-trigger-'+group).click();
  assert.equal(await page.locator('#global-nav-panel-'+group+' a[aria-current]').getAttribute('href'),link);
 }
 pass('representative detail routes and active links');
 assert.deepEqual(errors,[],'uncaught browser errors');
 pass('no uncaught browser errors');
}finally{await browser?.close();await new Promise(resolve=>server.httpServer.close(resolve));}
