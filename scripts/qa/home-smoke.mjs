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
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 await context.grantPermissions(['clipboard-read','clipboard-write']);
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
   const gameName=url.searchParams.get('gameName');
   if(gameName==='QA Empty'){
    sample.games=[];
    sample.rank=null;
   }
   if(gameName==='QA Missing Icons'){
    sample.assets={DEMO_Unit0:{name:'아이콘 누락 챔피언',image:origin+'/broken-qa-icon.png'}};
   }
   await route.fulfill({json:{...sample,demo:false,account:{...sample.account,gameName:url.searchParams.get('gameName'),tagLine:url.searchParams.get('tagLine')}}});return;
  }
  if(url.pathname==='/broken-qa-icon.png'){await route.fulfill({status:404});return;}
  await route.continue();
 });
 const home=async()=>{await page.goto(origin+'/');await page.locator('.home-hub').waitFor({state:'visible'});};
 const focusIs=async selector=>{await page.waitForFunction(s=>document.querySelector(s)===document.activeElement,selector);};
 const overflow=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'horizontal overflow at '+page.viewportSize().width);
 const dashboard=async()=>{
  await page.locator('.player-summary h1').waitFor({state:'visible'});
  assert.equal(await page.locator('.stats-grid .stat').count(),5);
  assert.equal(await page.locator('.search-area h1, .profile-collection, .share-panel, .rank-emblem').count(),0);
  await page.getByRole('heading',{name:'플레이 스타일과 PLAY DNA'}).waitFor({state:'visible'});
 };
 const rootHtml=await readFile('dist/index.html','utf8');
 assert(rootHtml.includes('home-hub')&&rootHtml.includes('게임 중 바로 쓰는 계산기'),'homepage SSR');
 for(const item of NAV_GROUPS.flatMap(g=>g.items)){
  await access(item.href==='/'?'dist/index.html':'dist'+item.href+'/index.html');
  assert(rootHtml.includes('href="'+item.href+'"'),'SSR link '+item.href);
 }
 pass('static home and 20 menu destinations');
 const firstPaint=await context.newPage();
 try{
  await firstPaint.route('**/*',route=>
   ['stylesheet','script'].includes(route.request().resourceType()) ? route.abort() : route.continue());
  for(const path of ['/','/esports/lck/history/international']){
   await firstPaint.goto(origin+path);
   const header=firstPaint.locator('.site-header');
   assert.equal(await header.count(),1,'header exists in prerendered HTML');
   assert.equal(await header.evaluate(el=>getComputedStyle(el).display),'none','unstyled header must not paint');
  }
 }finally{await firstPaint.close();}
 pass('no unstyled menu text before page assets load');
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
 await dashboard();
 assert.equal(await page.locator('.dna-bars progress').count(),8);
 await page.getByRole('button',{name:'전적 공유 링크 복사'}).click();
 assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'https://tft-profile.pages.dev/?demo=1');
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
 await dashboard();
 await page.getByRole('button',{name:'전적 공유 링크 복사'}).click();
 const copied=new URL(await page.evaluate(()=>navigator.clipboard.readText()));
 assert.equal(copied.pathname,'/profile');assert.equal(copied.searchParams.get('gameName'),'QA Tester');
 await page.getByRole('button',{name:'QA Tester #PASS'}).waitFor({state:'visible'});
 const shared=new URL(page.url());assert.equal(shared.pathname,'/profile');assert.equal(shared.searchParams.get('tagLine'),'PASS');
 assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,follow');
 assert.equal(await page.locator('.home-hub').count(),0);
 await page.locator('.back-home').click();await page.locator('.home-hub').waitFor({state:'visible'});
 await page.goto(origin+'/profile?gameName=QA+Shared&tagLine=KR1&section=meta');
 await page.locator('.result-anchor').waitFor({state:'visible'});
 assert.equal(await page.locator('.home-hub').count(),0);assert(profileCalls>=3);
 pass('profile failure, success, shared URL and legacy query');
 await page.goto(origin+copied.pathname+copied.search);
 await dashboard();
 assert.match(await page.locator('.player-summary h1').innerText(),/QA Tester #PASS/);
 await page.locator('#matches details summary').first().click();
 await page.locator('#matches details[open] .match-detail').waitFor({state:'visible'});
 for(const width of [1280,768,375,320]){
  await page.setViewportSize({width,height:900});await overflow();
  const columns=await page.locator('.stats-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  assert.equal(columns,width<=760?2:5);
 }
 await page.goto(origin+'/profile?gameName=QA+Empty&tagLine=KR1');await dashboard();
 await page.getByText('분석할 경기 없음',{exact:true}).waitFor({state:'visible'});
 await page.getByText('언랭크',{exact:true}).waitFor({state:'visible'});
 assert.equal(await page.locator('.stat strong').first().innerText(),'—');
 assert.equal(await page.locator('.dna-bars progress, .form-panel svg').count(),0);
 await overflow();
 await page.locator('.name-field input').fill('QA Missing Icons#KR1');
 await page.locator('.search-form button.primary').click();await dashboard();
 const champion=page.locator('#matches .asset').filter({hasText:'아이콘 누락 챔피언'}).first();
 await champion.scrollIntoViewIfNeeded();await champion.locator('.asset-letter').waitFor({state:'visible'});
 assert.match(await champion.innerText(),/아이콘 누락 챔피언/);
 await overflow();
 pass('dashboard metrics, clipboard, empty data, failed icons and mobile match details');
 await page.setViewportSize({width:1280,height:900});
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
 await page.goto(origin+'/esports/lck/2027/stove-league');
 await page.locator('.lck-section-nav .section-categories').waitFor({state:'visible'});
 assert.equal(await page.locator('.section-categories a').count(),3);
 assert.equal(await page.locator('.section-children a').count(),3);
 const picker=page.locator('.team-picker-row .route-picker');
 await picker.locator('summary').click();
 assert.equal(await picker.locator('nav a').count(),11);
 await picker.locator('a[href="/esports/lck/2027/t1"]').click();
 await page.waitForURL('**/esports/lck/2027/t1');
 assert((await page.locator('.team-picker-row summary strong').innerText()).startsWith('T1 ·'));
 await page.locator('.section-categories a[href="/esports/lck/2027/free-agents"]').click();
 await page.waitForURL('**/esports/lck/2027/free-agents');
 assert.equal(await page.locator('.section-children a').count(),2);
 await page.locator('.section-children a[href="/esports/lck/2027/contracts"]').click();
 await page.waitForURL('**/esports/lck/2027/contracts');
 await page.goto(origin+'/esports/lck/history');
 await page.locator('.archive-pickers .route-picker').first().locator('summary').click();
 assert(await page.locator('.archive-pickers .route-picker').first().locator('nav a').count()>10);
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:375,height:900});await page.goto(origin+'/esports/lck/2027/stove-league');
 await page.locator('.mobile-toggle').click();
 const mega=page.locator('#global-nav-panel-lck');
 await mega.waitFor({state:'visible'});
 assert.equal(await mega.locator('.mega-links:visible').count(),1);
 await mega.locator('.mobile-sub-trigger',{hasText:'FA·계약 정보'}).click();
 await mega.locator('#global-sub-contracts').waitFor({state:'visible'});
 assert.equal(await mega.locator('.mega-links:visible').count(),1);
 await mega.locator('a[href="/esports/lck/2027/contracts"]').click();
 await page.waitForURL('**/esports/lck/2027/contracts');
 assert.equal(await page.locator('.section-categories .category-active').innerText(),'FA·계약');
 pass('hierarchical LCK menus, team/year pickers and mobile nested disclosure');
 const internationalPath='/esports/lck/history/international';
 const internationalHtml=await readFile('dist'+internationalPath+'/index.html','utf8');
 assert(internationalHtml.includes('LCK 국제대회 명예의 전당')&&internationalHtml.includes('2026-worlds-geng'),'international SSR');
 for(const width of [1280,320]){
  await page.setViewportSize({width,height:900});
  await page.goto(origin+internationalPath);
  const records=page.locator('.records tbody tr');
  await records.first().waitFor();
  assert.equal(await records.count(),26);
  await overflow();
  await page.getByRole('button',{name:'First Stand',exact:true}).click();
  assert.equal(await records.count(),1);
  await page.getByRole('link',{name:'Hanwha Life Esports 2025 시즌 로스터'}).click();
  await page.waitForURL('**/history/teams/hle#roster-2025');
  await page.locator('#roster-2025').waitFor();
  await page.getByRole('button',{name:'MSI',exact:true}).click();
  await page.locator('a[href$="#2026-msi-hle"]').waitFor();
  assert.equal(await page.locator('a[href$="#2025-first-stand-hle"]').count(),0);
  await page.locator('a[href$="#2026-msi-hle"]').click();
  await page.waitForURL('**/history/international#2026-msi-hle');
  await page.locator('[id="2026-msi-hle"]').waitFor();
 }
 pass('international results, filters and season roster links on desktop and mobile');
 await page.goto(origin+'/esports/lck/dream-team');
 const save=page.getByRole('button',{name:'PNG 카드 저장'});
 assert(await save.isDisabled());
 await page.getByRole('button',{name:'랜덤 팀 구성'}).click();
 const downloadPromise=page.waitForEvent('download');
 await save.click();
 const download=await downloadPromise;
 assert.equal(download.suggestedFilename(),'lck-dream-team.png');
 const png=await readFile(await download.path());
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 pass('LCK Dream Team PNG download');
 assert.deepEqual(errors,[],'uncaught browser errors');
 pass('no uncaught browser errors');
}finally{await browser?.close();await new Promise(resolve=>server.httpServer.close(resolve));}
