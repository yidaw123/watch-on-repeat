const { test, expect } = require('@playwright/test');

test('Homepage loads and URL input works', async ({ page }) => {
  await page.goto('https://watchonrepeat.com');
  
  // Check if page loaded
  await expect(page.locator('body')).toBeVisible();
  
  // Find and test the URL input
  const urlInput = page.locator('#video-url-input');
  await expect(urlInput).toBeVisible();
  
  // Type a test URL
  await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await expect(urlInput).toHaveValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});