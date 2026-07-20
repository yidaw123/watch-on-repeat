const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error));

  const filePath = `file://${path.resolve(__dirname, 'dm_test.html')}`;
  await page.goto(filePath);
  
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
})();
