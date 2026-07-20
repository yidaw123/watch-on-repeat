const { test, expect } = require('@playwright/test');

test('A/B Loop inputs update timeline', async ({ page }) => {
  await page.goto('https://watchonrepeat.com');
  
  // Load a video
  const urlInput = page.locator('#video-url-input');
  await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await page.locator('.search-btn').click();
  
  // Wait for player
  await page.locator('#player-iframe-container iframe').waitFor({ 
    state: 'visible', 
    timeout: 15000 
  });
  
  // Wait for duration to load
  await page.waitForTimeout(3000);
  
  // Set start time via JS
  await page.evaluate(() => {
    const startEl = document.getElementById('ab-start');
    if (startEl._cascadingTime) {
      startEl._cascadingTime.setValue(10.5);
      startEl.dispatchEvent(new Event('blur'));
    }
  });
  
  // Check timeline handle moved
  const handle = page.locator('.timeline-handle.handle-start');
  const leftPos = await handle.evaluate(el => el.style.left);
  expect(leftPos).not.toBe('0%');
});