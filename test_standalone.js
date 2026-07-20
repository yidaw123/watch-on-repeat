const { chromium } = require('playwright');
const { exec } = require('child_process');

(async () => {
  const server = exec('python -m http.server 8080');
  await new Promise(r => setTimeout(r, 2000));
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));

  await page.goto('http://localhost:8080/standalone_dm.html');
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
  server.kill();
})();
