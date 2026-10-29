const {chromium} = require('playwright');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
exports.openExtension = async () => {
  const extension = path.resolve(__dirname, '../extension');
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'kaibab-test-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true, reducedMotion: 'reduce', viewport: {width: 380, height: 520},
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  const page = await context.newPage();
  await page.goto('chrome://extensions');
  const installed = await page.evaluate(() => new Promise(resolve => chrome.developerPrivate.getExtensionsInfo({includeDisabled:true}, resolve)));
  const item = installed.find(item => item.name.startsWith('KaiBab'));
  if (!item || item.state !== 'ENABLED') throw new Error('KaiBab failed to load');
  return {context, page, popup: `chrome-extension://${item.id}/popup.html`, close: async () => {await context.close(); await fs.rm(profile, {recursive:true, force:true});}};
};
