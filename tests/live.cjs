const assert=require('node:assert/strict');
const {openExtension}=require('./browser.cjs');
let app;
(async()=>{
 app=await openExtension();const {page,popup}=app;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(popup);const ready=()=>page.waitForFunction(()=>document.querySelector('#menu').getAttribute('aria-busy')==='false',null,{timeout:20000});await ready();await page.click('#tab-1');
 const ids=await page.locator('#restaurant option').evaluateAll(options=>options.map(o=>o.value));
 for(const lang of ['ko','en']){
  await page.click(`[data-language=${lang}]`);await ready();
  for(const id of ids){await page.selectOption('#restaurant',id);await ready();assert.equal(await page.locator('.retry-button').count(),0,`${lang}/${id}: `+await page.locator('#menu').innerText());assert((await page.locator('#menu').innerText()).trim());console.log('PASS live',lang,id);}
 }
 await page.selectOption('#restaurant','emp');await ready();await page.reload();await ready();assert.equal(await page.locator('html').getAttribute('lang'),'en');
 await page.click('#next');await ready();assert.equal(await page.locator('.retry-button').count(),0);await page.click('#today');await ready();
 await page.click('[data-language=ko]');await page.click('[data-language=en]');await page.click('[data-language=ko]');await ready();assert.equal(await page.locator('html').getAttribute('lang'),'ko');
 assert.deepEqual(errors,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=380));console.log('PASS persistence, date navigation, language race and layout');await app.close();
})().catch(async e=>{console.error(e);if(app)await app.close();process.exit(1)});
