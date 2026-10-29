const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const {openExtension}=require('../tests/browser.cjs');
const root=path.resolve(__dirname,'..');
let browser,app;
(async()=>{
 const out=path.join(root,'store/assets');await fs.mkdir(out,{recursive:true});
 const original=await fs.readFile(path.join(root,'extension/icons/icon.svg'),'utf8');
 const artwork=original.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
 browser=await chromium.launch({channel:'chromium',headless:true});const canvas=await browser.newPage();
 await canvas.setViewportSize({width:128,height:128});await canvas.setContent(`<style>body{margin:0;background:transparent}svg{display:block}</style><svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><g transform="translate(16 16) scale(.75)">${artwork}</g></svg>`);
 await canvas.screenshot({path:path.join(root,'extension/icons/icon128.png'),omitBackground:true});await fs.copyFile(path.join(root,'extension/icons/icon128.png'),path.join(out,'icon128.png'));
 app=await openExtension();const {page,popup}=app;await page.goto(popup);const ready=()=>page.waitForFunction(()=>document.querySelector('#menu').getAttribute('aria-busy')==='false',null,{timeout:20000});await ready();await page.click('#tab-1');
 for(const lang of ['ko','en']){
  await page.click(`[data-language=${lang}]`);await ready();if(await page.locator('.retry-button').count())throw new Error('Live menu unavailable; do not generate misleading screenshots');
  const screenshot=await page.screenshot({path:path.join(out,`popup-${lang}.png`)});
  const encoded=screenshot.toString('base64');
  const title=lang==='ko'?'오늘의 식단,\n한 번에.':'Your next meal,\none click away.';
  const points=lang==='ko'?['식당 12곳의 식단과 운영 안내','한국어와 영어를 자유롭게','필요한 정보만 담은 작은 팝업']:['Menus & guides for 12 dining locations','Switch between Korean & English','A compact popup with just the essentials'];
  await canvas.setViewportSize({width:1280,height:800});
  await canvas.setContent(`<style>*{box-sizing:border-box}body{margin:0;background:#edf3fa;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;color:#173758}.layout{height:800px;width:1280px;display:flex;align-items:center;justify-content:space-between;padding:72px 130px 72px 94px;background:radial-gradient(circle at 90% 20%,#d8e8fa,transparent 50%),#f1f5fa}.brand{color:#004c98;font-size:27px;font-weight:750;letter-spacing:-.8px;margin-bottom:30px}h1{font-size:48px;line-height:1.24;letter-spacing:-1.8px;white-space:pre-line;margin:0 0 30px}p{font-size:19px;color:#546b84;line-height:1.9;margin:0}.note{font-size:13px;color:#74869a;margin-top:44px}.preview{width:380px;height:520px;border-radius:18px;overflow:hidden;box-shadow:0 22px 60px #163f7426;border:1px solid #d3dfed}img{width:380px;height:520px;display:block}</style><div class="layout"><div><div class="brand">KaiBab</div><h1>${title}</h1><p>${points.join('<br>')}</p><div class="note">${lang==='ko'?'KAIST 식단 · 비공식 확장 프로그램':'KAIST cafeteria menus · Unofficial extension'}</div></div><div class="preview"><img src="data:image/png;base64,${encoded}"></div></div>`);
  await canvas.screenshot({path:path.join(out,`screenshot-${lang}-1280x800.png`)});
 }
 await app.close();app=null;
 await canvas.setViewportSize({width:440,height:280});
 await canvas.setContent(`<style>body{margin:0}svg{display:block}</style><svg width="440" height="280" viewBox="0 0 440 280" xmlns="http://www.w3.org/2000/svg"><rect width="440" height="280" fill="#004c98"/><circle cx="360" cy="40" r="150" fill="#1263af"/><circle cx="0" cy="290" r="180" fill="#064386"/><g transform="translate(138 58) scale(1.28)">${artwork}</g><g stroke="#82b5e7" stroke-width="5" stroke-linecap="round"><path d="M56 118h39m-39 22h29m-29 22h39M345 118h39m-39 22h29m-29 22h39"/></g></svg>`);
 await canvas.screenshot({path:path.join(out,'promo-440x280.png')});
 await browser.close();browser=null;console.log('Generated 128px padded icon, real popup captures, two 1280x800 store screenshots and 440x280 promo.');
})().catch(async e=>{console.error(e);if(app)await app.close();if(browser)await browser.close();process.exit(1)});
