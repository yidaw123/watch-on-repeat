const { chromium } = require('playwright');
const { exec } = require('child_process');
const path = require('path');

(async () => {
  console.log("Starting server...");
  const server = exec('python -m http.server 8080');
  
  await new Promise(r => setTimeout(r, 2000));
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error));

  console.log("Navigating to page...");
  try {
    await page.goto('http://localhost:8080/index.html');
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Clicking Dailymotion video...");
    await page.evaluate(() => {
      // Find a dailymotion video card and click it
      const cards = document.querySelectorAll('.video-card');
      for (const card of cards) {
         if (card.querySelector('.platform-indicator.dailymotion')) {
            card.click();
            return;
         }
      }
    });

    await new Promise(r => setTimeout(r, 5000));

    // Check if iframe exists inside playerContainer
    const debugInfo = await page.evaluate(() => {
       const container = document.getElementById('player-iframe-container');
       return {
          innerHTML: container.innerHTML,
          currentPlatform: window.app.state.currentPlatform,
          currentVideo: window.app.state.currentVideo,
          isPlaying: window.app.state.isPlaying
       };
    });
    console.log("Debug Info:", debugInfo);

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
    server.kill();
    console.log("Done.");
  }
})();
