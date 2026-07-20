const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

// 1. Update defaultShortcuts
content = content.replace(
  /this\.defaultShortcuts = \{[^}]+\};/g,
  `this.defaultShortcuts = {
      'prevLoop': 'a',
      'nextLoop': 'o',
      'openNotes': 'n',
      'shiftLeft': 'arrowleft',
      'shiftRight': 'arrowright',
      'halfScale': '[',
      'doubleScale': ']',
      'increaseSpeed': 'arrowup',
      'decreaseSpeed': 'arrowdown'
    };`
);

// 2. Update actions array
content = content.replace(
  /const actions = \[\s*\{\s*id:\s*'prevLoop'[^\}]+(?:\s*\{\s*id:[^\}]+\},?)*\s*\];/g,
  `const actions = [
      { id: 'prevLoop', name: 'Previous Loop Segment PRO', premium: true },
      { id: 'nextLoop', name: 'Next Loop Segment PRO', premium: true },
      { id: 'openNotes', name: 'Open Notes Tab' },
      { id: 'shiftLeft', name: 'Shift Loop Left PRO', premium: true },
      { id: 'shiftRight', name: 'Shift Loop Right PRO', premium: true },
      { id: 'halfScale', name: 'Halve Duration (1/2x) PRO', premium: true },
      { id: 'doubleScale', name: 'Double Duration (2x) PRO', premium: true },
      { id: 'increaseSpeed', name: 'Increase Playback Speed', premium: false },
      { id: 'decreaseSpeed', name: 'Decrease Playback Speed', premium: false }
    ];`
);

// 3. Update keydown handler block
// Find the exact block we want to replace.
// We'll replace everything from 'if (key === s.prevLoop) {' up to '} else if (key === s.toggleLoop) {' (or whatever was there before)
// Actually in the checked-out app.js, it's 'if (isPremium && key === s.prevLoop)' up to '} else if (key === s.toggleLoop) {'
const blockRegex = /if\s*\(isPremium\s*&&\s*key\s*===\s*s\.prevLoop\)\s*\{[\s\S]*?\}\s*else\s*if\s*\(key\s*===\s*s\.toggleLoop\)\s*\{[\s\S]*?\/\/ Removed explicit toggle\s*\n\s*\}/;

const replacementBlock = `if (isPremium && key === s.prevLoop) {
        e.preventDefault();
        if (typeof this.jumpToLoopSegment === 'function') this.jumpToLoopSegment(-1);
      } else if (isPremium && key === s.nextLoop) {
        e.preventDefault();
        if (typeof this.jumpToLoopSegment === 'function') this.jumpToLoopSegment(1);
      } else if (key === s.increaseSpeed) {
        e.preventDefault();
        this.changePlaybackSpeed(0.05);
      } else if (key === s.decreaseSpeed) {
        e.preventDefault();
        this.changePlaybackSpeed(-0.05);
      }`;

content = content.replace(blockRegex, replacementBlock);

fs.writeFileSync('app.js', content, 'utf8');
console.log("Replaced successfully");
