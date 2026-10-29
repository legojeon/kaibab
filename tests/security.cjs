const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {openExtension} = require('./browser.cjs');
let app;
(async () => {
  const root=path.resolve(__dirname,'../extension');
  const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));
  assert.deepEqual(manifest.permissions,['storage']);
  assert.deepEqual(manifest.host_permissions,['https://www.kaist.ac.kr/*']);
  assert(!manifest.content_scripts && !manifest.background && !manifest.externally_connectable);
  assert(manifest.content_security_policy.extension_pages.includes("default-src 'none'"));
  for (const file of ['popup.js','data.js','network.js','locales.js']) {
    const source=await fs.readFile(path.join(root,file),'utf8');
    assert(!/innerHTML\s*=|outerHTML\s*=|insertAdjacentHTML|\beval\(|new Function\(/.test(source),file);
  }
  app=await openExtension();const {context,page,popup}=app;const errors=[];page.on('pageerror',e=>errors.push(e.message));
  function fixture(url) {
    const u=new URL(url);const en=u.pathname.includes('/en/');const date=u.searchParams.get('stt_dt');const day=new Date(date+'T12:00:00Z');const mm=day.getUTCMonth()+1;const dd=day.getUTCDate();const weekday=(en?['Sun','Mon','Tue','Wed','Thu','Fri','Sat']:[...'일월화수목금토'])[day.getUTCDay()];
    return `<html lang="${en?'en':'ko'}"><div id="txt"><div class="s0503"><ul class="col6"><li class="on"><a href="?dvs_cd=emp">Faculty</a></li></ul></div><div id="tab_item_1"><h3>${en?'': '메뉴 안내 - '}${mm}/${dd}(${weekday})</h3><p>Notice</p><table><thead><tr>${(en?['Breakfast','Lunch','Dinner']:['조식','중식','석식']).map(x=>'<th>'+x+' 11:00~13:00</th>').join('')}</tr></thead><tbody><tr><td></td><td>${en?'Test meal (₩5,500)':'검증 메뉴(5,500원)'}<br>&lt;img src=x onerror=alert(1)&gt;<script>window.__injected=true</script><img src="https://example.invalid/track" onerror="window.__injected=true"><iframe src="https://example.invalid/frame"></iframe><br>Rice</td><td>Dinner</td></tr></tbody></table></div></div></html>`;
  }
  const outbound=[];context.on('request',r=>{if(r.url().startsWith('http'))outbound.push(r.url());});
  await context.route('https://www.kaist.ac.kr/**',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:fixture(route.request().url())}));
  await page.goto(popup);const ready=()=>page.waitForFunction(()=>document.querySelector('#menu').getAttribute('aria-busy')==='false',null,{timeout:15000});await ready();await page.click('#tab-1');
  assert.equal(await page.locator('.price').first().innerText(),'5,500원');
  assert.equal(await page.evaluate(()=>window.__injected),undefined);
  assert.equal(await page.locator('#menu img,#menu iframe,#menu script').count(),0);
  assert((await page.locator('#menu').innerText()).includes('<img src=x onerror=alert(1)>'));
  assert(!outbound.some(url=>url.includes('example.invalid')));
  console.log('PASS remote scripts/HTML remain inert; no remote image/frame requests');
  const network=await page.evaluate(async()=>{
    const {fetchMenuPage,MAX_PAGE_BYTES}=await import('./network.js');const original=globalThis.fetch;const url='https://www.kaist.ac.kr/en/html/campus/053001.html';const checks={};
    const fail=async fn=>{try{await fn();return false}catch{return true}};
    checks.destination=await fail(()=>fetchMenuPage('https://example.invalid/','', 'en'));
    globalThis.fetch=async()=>new Response('plain',{headers:{'Content-Type':'text/plain'}});checks.type=await fail(()=>fetchMenuPage(url,undefined,'en'));
    globalThis.fetch=async()=>new Response('html',{headers:{'Content-Type':'text/html','Content-Length':String(MAX_PAGE_BYTES+1)}});checks.length=await fail(()=>fetchMenuPage(url,undefined,'en'));
    globalThis.fetch=async()=>new Response('x'.repeat(MAX_PAGE_BYTES+1),{headers:{'Content-Type':'text/html'}});checks.stream=await fail(()=>fetchMenuPage(url,undefined,'en'));
    globalThis.fetch=async(target,options)=>{checks.options=options.credentials==='omit'&&options.redirect==='error'&&options.referrerPolicy==='no-referrer';return new Response('safe',{headers:{'Content-Type':'text/html'}})};
    checks.normal=(await fetchMenuPage(url,undefined,'en'))==='safe';globalThis.fetch=original;return checks;
  });assert(Object.values(network).every(Boolean));console.log('PASS fixed origin/path, MIME check, body limits, cookie/referrer omission and redirect rejection');
  await page.evaluate(async()=>{const all=await chrome.storage.local.get(null);const k=Object.keys(all).find(k=>k.startsWith('menu-v2:'));await chrome.storage.local.set({[k]:{at:Date.now(),data:{type:'daily',notice:'',meals:[null,null,null]}}});});
  await page.reload();await ready();await page.click('#tab-1');assert.equal(await page.locator('.price').first().innerText(),'5,500원');console.log('PASS malformed cache is ignored');
  await page.click('[data-language=en]');await ready();assert.equal(await page.locator('.price').first().innerText(),'₩5,500');
  await context.unroute('https://www.kaist.ac.kr/**');
  await context.route('https://www.kaist.ac.kr/**',route=>route.fulfill({status:302,headers:{location:'https://example.invalid/stolen'}}));
  await page.click('#refresh');await ready();assert.match(await page.locator('#status').innerText(),/saved menu/);assert(!outbound.some(u=>u.includes('example.invalid')));
  console.log('PASS real redirect is not followed; cached data warning remains visible');
  await page.evaluate(async()=>{const at=Date.now();const data={};for(let i=0;i<70;i++)data['menu-v2:test:'+i]={at:at-i,data:{}};await chrome.storage.local.set(data);});
  await page.reload();await ready();await page.waitForFunction(async()=>Object.keys(await chrome.storage.local.get(null)).filter(k=>k.startsWith('menu-v2:')).length<=60);
  assert.deepEqual(errors,[]);console.log('PASS cache retention cap; no uncaught errors');
  await app.close();
})().catch(async e=>{console.error(e);if(app)await app.close();process.exit(1)});
