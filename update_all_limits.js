const fs = require('fs');

// 1. Update app.js (History and Favorites limits, plus updateNoteCharCount)
let appJs = fs.readFileSync('app.js', 'utf8');

// History Limit
const oldHistoryLimit = `    // Enforce History Limit for Free tier
    const tier = this.state.user.tier || 'free';
    if (tier === 'free') {
      const userHistory = history.filter(h => h.userId === this.state.user.id);
      if (userHistory.length > 50) {
        // Find the oldest record for this user and remove it
        const oldestUserRecord = userHistory[userHistory.length - 1];
        const deleteIdx = history.findIndex(h => h.videoId === oldestUserRecord.videoId && h.userId === oldestUserRecord.userId);
        if (deleteIdx !== -1) history.splice(deleteIdx, 1);
      }
    }`;

const newHistoryLimit = `    // Enforce History Limit based on tier
    const tier = this.state.user.tier || 'free';
    const limit = tier === 'pro' ? 500 : (tier === 'premium' ? 200 : 50);
    const userHistory = history.filter(h => h.userId === this.state.user.id);
    if (userHistory.length > limit) {
      const oldestUserRecord = userHistory[userHistory.length - 1];
      const deleteIdx = history.findIndex(h => h.videoId === oldestUserRecord.videoId && h.userId === oldestUserRecord.userId);
      if (deleteIdx !== -1) history.splice(deleteIdx, 1);
    }`;

appJs = appJs.replace(oldHistoryLimit, newHistoryLimit);

// Favorites Limit
const oldFavoritesAdd = `    } else {
      // Add to favorites`;

const newFavoritesAdd = `    } else {
      // Enforce Favorites Limit based on tier
      const tier = this.state.user ? (this.state.user.tier || 'free') : 'free';
      const limit = tier === 'pro' ? 1000 : (tier === 'premium' ? 500 : 100);
      const userFavorites = favorites.filter(f => f.userId === this.state.user.id);
      
      if (userFavorites.length >= limit) {
        if (tier !== 'pro') {
          const nextTier = tier === 'free' ? 'Premium' : 'Pro';
          const nextLimit = tier === 'free' ? 500 : 1000;
          this.openUpgradeModal(\`You've reached the limit of \${limit} favorites. Upgrade to \${nextTier} for \${nextLimit} favorites!\`);
        } else {
          this.showToast(\`You have reached the maximum limit of \${limit} favorites!\`, "alert-circle");
        }
        return;
      }
      
      // Add to favorites`;

appJs = appJs.replace(oldFavoritesAdd, newFavoritesAdd);

// Note character counter
if (!appJs.includes('updateNoteCharCount')) {
  const charCountFn = `
  updateNoteCharCount(el) {
    const counter = document.getElementById('note-char-count');
    if (counter && el) {
      const tier = this.state.user ? (this.state.user.tier || 'free') : 'free';
      const max = (tier === 'premium' || tier === 'pro') ? 1000 : 200;
      el.maxLength = max;
      counter.textContent = el.value.length + " / " + max;
    }
  }
`;
  appJs = appJs.replace('  // --- End of Init ---', charCountFn + '  // --- End of Init ---');
}

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('Updated app.js');

// 2. Update js/notes.js (Note limits per tier)
let notesJs = fs.readFileSync('js/notes.js', 'utf8');

const oldNotesLimit = `    // Enforce Notes Limit for Free tier
    const isPremium = this.state.user && (this.state.user.isPremium || (this.state.user.user_metadata && this.state.user.user_metadata.tier === 'premium'));
    if (!isPremium) {
      // 2. Max 5 videos with notes
      const uniqueVideos = Object.keys(notes).filter(k => k !== '__titles' && Array.isArray(notes[k]) && notes[k].length > 0);
      if (!uniqueVideos.includes(vId) && uniqueVideos.length >= 5) {
        this.openUpgradeModal("Free accounts can only add notes to 5 videos total. Upgrade to keep adding notes!");
        return;
      }
      // 3. Max 3 notes per video
      if (notes[vId] && notes[vId].length >= 3) {
        this.openUpgradeModal("Free accounts are limited to 3 notes per video. Upgrade for unlimited notes!");
        return;
      }
    }`;

const newNotesLimit = `    // Enforce Notes Limit based on tier
    const tier = this.state.user ? (this.state.user.tier || 'free') : 'free';
    
    let maxVideos = 3;
    let maxNotesPerVideo = 3;
    let charLimit = 200;
    
    if (tier === 'pro') {
      maxVideos = 20;
      maxNotesPerVideo = 10;
      charLimit = 1000;
    } else if (tier === 'premium') {
      maxVideos = 10;
      maxNotesPerVideo = 5;
      charLimit = 1000;
    }
    
    // Enforce Character Limit
    if (text.length > charLimit) {
      this.showToast(\`Notes are limited to \${charLimit} characters on your current tier.\`, "alert-circle");
      return;
    }
    
    // Check video limit
    const uniqueVideos = Object.keys(notes).filter(k => k !== '__titles' && Array.isArray(notes[k]) && notes[k].length > 0);
    if (!uniqueVideos.includes(vId) && uniqueVideos.length >= maxVideos) {
      if (tier === 'pro') {
        this.showToast(\`You have reached the maximum limit of \${maxVideos} videos with notes!\`, "alert-circle");
      } else {
        const nextTier = tier === 'free' ? 'Premium' : 'Pro';
        this.openUpgradeModal(\`You can only add notes to \${maxVideos} videos on your current tier. Upgrade to \${nextTier} to keep adding notes!\`);
      }
      return;
    }
    
    // Check notes per video limit
    if (notes[vId] && notes[vId].length >= maxNotesPerVideo) {
      if (tier === 'pro') {
        this.showToast(\`You have reached the maximum limit of \${maxNotesPerVideo} notes for this video!\`, "alert-circle");
      } else {
        const nextTier = tier === 'free' ? 'Premium' : 'Pro';
        this.openUpgradeModal(\`You are limited to \${maxNotesPerVideo} notes per video. Upgrade to \${nextTier} for more!\`);
      }
      return;
    }`;

notesJs = notesJs.replace(oldNotesLimit, newNotesLimit);

if (notesJs.includes("this.elements.noteInput.value = '';")) {
  notesJs = notesJs.replace("this.elements.noteInput.value = '';", "this.elements.noteInput.value = '';\n    if (typeof this.updateNoteCharCount === 'function') this.updateNoteCharCount(this.elements.noteInput);");
}

fs.writeFileSync('js/notes.js', notesJs, 'utf8');
console.log('Updated notes.js');

// 3. Update index.html (Textarea and counter)
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(
  '<textarea id="note-input" placeholder="Type a note here..."></textarea>',
  '<div style="position: relative; flex: 1;">\\n                      <textarea id="note-input" placeholder="Type a note here..." oninput="app.updateNoteCharCount(this)" style="min-height: 80px; width: 100%; padding-bottom: 24px;"></textarea>\\n                      <div id="note-char-count" style="position: absolute; bottom: 8px; right: 12px; font-size: 10px; color: var(--text-muted); pointer-events: none;">0 / 200</div>\\n                    </div>'
);
fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log('Updated index.html');

// 4. Update listenonrepeat-alternative.html (Table)
let altHtml = fs.readFileSync('listenonrepeat-alternative.html', 'utf8');

// Notes row
altHtml = altHtml.replace(
  '<td style="padding: 12px; text-align: center; font-size: 0.9em; color: #aaa;">Up to 5 Vids (3/vid)</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: var(--premium-color, #fbbf24);">Unlimited</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: var(--pro-color, #8b5cf6);">Unlimited</td>',
  '<td style="padding: 12px; text-align: center; font-size: 0.9em; color: #aaa;">Max 3 Vids (3/vid, 200 chars)</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: var(--premium-color, #fbbf24);">Max 10 Vids (5/vid, 1000 chars)</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: var(--pro-color, #8b5cf6);">Max 20 Vids (10/vid, 1000 chars)</td>'
);

// YouTube row
altHtml = altHtml.replace(
  '<td style="padding: 12px;">YouTube, Twitch, SoundCloud, Dailymotion, Vimeo, Wistia</td>',
  '<td style="padding: 12px;">Supports YouTube, Twitch, SoundCloud, Dailymotion, Vimeo, Wistia</td>'
);

// Saved Playlists row
altHtml = altHtml.replace(
  '<td style="padding: 12px;">Cloud Sync &amp; Saved Playlists</td>',
  '<td style="padding: 12px;">Saved Playlists</td>'
);

// precise replace for History
altHtml = altHtml.replace(
  '<td style="padding: 12px;">Saved History</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: #aaa;">50 Videos</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: var(--premium-color, #fbbf24);">Unlimited</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: var(--pro-color, #8b5cf6);">Unlimited</td>',
  '<td style="padding: 12px;">Cloud Sync History</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: #aaa;">50 Videos</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: var(--premium-color, #fbbf24);">200 Videos</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: var(--pro-color, #8b5cf6);">500 Videos</td>'
);

// Precise replace for Favorites
altHtml = altHtml.replace(
  '<td style="padding: 12px;">Saved Favorites</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: #aaa;">Unlimited</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: var(--premium-color, #fbbf24);">Unlimited</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: var(--pro-color, #8b5cf6);">Unlimited</td>',
  '<td style="padding: 12px;">Cloud Sync Favorites</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: #aaa;">100 Videos</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: var(--premium-color, #fbbf24);">500 Videos</td>\\n                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: var(--pro-color, #8b5cf6);">1000 Videos</td>'
);

fs.writeFileSync('listenonrepeat-alternative.html', altHtml, 'utf8');
console.log('Updated listenonrepeat-alternative.html');
