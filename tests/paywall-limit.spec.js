const { test, expect } = require('@playwright/test');

test('Free user hits playlist limit', async ({ page }) => {
  await page.goto('https://watchonrepeat.com');
  
  // Inject mock free user with 5 playlists
  await page.evaluate(() => {
    window.app.state.user = { 
      id: 'test-user', 
      tier: 'free', 
      isPremium: false, 
      email: 'test@test.com', 
      name: 'Test' 
    };
    
    const playlists = [];
    for (let i = 0; i < 5; i++) {
      playlists.push({ 
        id: `pl_${i}`, 
        userId: 'test-user', 
        name: `Playlist ${i}`, 
        videos: [] 
      });
    }
    window.app.saveDb('playlists', playlists);
    window.app.updateUserUI();
    window.app.renderPlaylistsTab();
  });

  // Try to create 6th playlist
  await page.locator('#tab-playlists-btn').click();
  
  await page.evaluate(() => {
    document.getElementById('new-playlist-input').value = 'Too Many';
    window.app.createPlaylist();
  });

  // Expect upgrade modal
  const modal = page.locator('#premium-unlock-modal');
  await expect(modal).toBeVisible({ timeout: 5000 });
});