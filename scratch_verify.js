const fs = require('fs');

const onclicks = [
  'triggerLocalVideo', 'openLoginModal', 'toggleUserMenu', 'showTab', 'openSettingsModal', 
  'openShortcutsModal', 'handleLogout', 'simulateBuyPremium', 'toggleTheaterMode', 'toggleFavorite', 
  'openPlaylistModal', 'shareVideo', 'openGlobalControlsModal', 'fineTuneLoop', 'shiftLoop', 
  'scaleLoop', 'showInfoModal', 'openUpgradeModal', 'toggleRecording', 'toggleRecordingPlayback', 
  'deleteCurrentRecording', 'addLoopSegment', 'deleteAllSegments', 'saveInstance', 'saveSharedSegments', 
  'generateShareableClip', 'closeUpgradeModal', 'showWaitlistInput', 'joinWaitlist', 
  'closePlaylistModal', 'createNewPlaylistFromModal', 'closeSettingsModal', 'cancelSubscription', 
  'updateAccountEmail', 'updateAccountPassword', 'closeShortcutsModal', 'cancelShortcutRecord', 
  'deleteSelectedSavedLoops', 'addNote', 'deleteAllNotes', 'createPlaylist', 'clearHistory', 
  'closeLoginModal', 'switchAuthView', 'handleSocialLogin', 'togglePasswordVisibility', 
  'closeToast', 'closeInfoModal', 'closeShareModal', 'copyShareLink', 'shareToSocial', 
  'closeGlobalControlsModal', 'loadHome', 'switchTab'
];

const jsFiles = ['app.js', 'js/notes.js', 'js/playlists.js', 'js/loops.js', 'js/audioRecorder.js', 'js/auth.js', 'js/database.js'];

let allCode = '';
jsFiles.forEach(f => {
  if(fs.existsSync(f)) {
    allCode += fs.readFileSync(f, 'utf8') + '\n';
  }
});

// A simple check: does the string "functionName(" or "functionName (" or "functionName=" exist in the JS code?
const missing = [];
onclicks.forEach(fn => {
  // Methods in class are like "async functionName(" or "functionName("
  // or "app.functionName =" 
  const regex = new RegExp(`\\b${fn}\\s*(?:=\\s*(?:async)?\\s*function|\\(|:\\s*(?:async)?\\s*function|:\\s*\\()`, 'g');
  if (!regex.test(allCode)) {
    missing.push(fn);
  }
});

console.log("Missing functions:");
console.log(missing.join('\n'));
