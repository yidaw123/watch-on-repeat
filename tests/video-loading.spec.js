const { test, expect } = require('@playwright/test');

test('User can load a YouTube video', async ({ page }) => {
  await page.goto('https://watchonrepeat.com');
  
  // Enter URL and click load
  const urlInput = page.locator('#video-url-input');
  await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  
  const loadBtn = page.locator('.search-btn');
  await loadBtn.click();
  
  // Wait for player to load (look for iframe)
  const iframe = page.locator('#player-iframe-container iframe');
  await expect(iframe).toBeVisible({ timeout: 15000 });
  
  // Check video title updated
  const title = page.locator('#video-title');
  await expect(title).not.toHaveText('Ready to Loop', { timeout: 10000 });
});