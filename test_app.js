const { chromium } = require('playwright');
const { exec } = require('child_process');

(async () => {
  const server = exec('python -m http.server 8000');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error));

  await new Promise(r => setTimeout(r, 1000));
  
  await page.goto('http://localhost:8000/index.html');
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Loading Dailymotion video...");
  await page.evaluate(() => {
    const card = document.querySelector('.video-card[data-id="x8q9q2o"]');
    if (card) card.click();
  });

  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
  server.kill();
})();
