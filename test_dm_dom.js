const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));

  const filePath = `file://${path.resolve(__dirname, 'dm_test.html')}`;
  await page.goto(filePath);
  
  await new Promise(r => setTimeout(r, 4000));
  
  const innerHTML = await page.evaluate(() => {
     return document.getElementById('dm-player-target').innerHTML;
  });
  console.log("DM Player Target InnerHTML:", innerHTML);

  await browser.close();
})();
