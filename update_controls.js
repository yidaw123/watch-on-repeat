const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');

// Rename "PRO CONTROLS" to "GLOBAL LOOP CONTROLS"
html = html.replace(
  'PRO CONTROLS <span onclick="app.openProControlsModal()"',
  'GLOBAL LOOP CONTROLS <span onclick="app.openGlobalControlsModal()"'
);

// Rename "Advanced Loop Segments" to "Premium/Pro Loop Controls"
html = html.replace(
  '<i data-lucide="layers" style="width:14px; height:14px; display:inline-block; margin-right:4px;"></i> Advanced Loop Segments',
  '<i data-lucide="layers" style="width:14px; height:14px; display:inline-block; margin-right:4px;"></i> Premium/Pro Loop Controls'
);

// Rename Pro Controls Guide modal
html = html.replace('id="pro-controls-modal"', 'id="global-controls-modal"');
html = html.replace(/app\.closeProControlsModal\(\)/g, 'app.closeGlobalControlsModal()');
html = html.replace('Pro Controls Guide', 'Global Controls Guide');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Updated index.html');


// 2. Update js/loops.js
let loopsJs = fs.readFileSync('js/loops.js', 'utf8');

loopsJs = loopsJs.replace(
  '  fineTuneLoop(point, amount, segIndex = null) {\n    if (!this.enforcePremiumFeature()) return;',
  '  fineTuneLoop(point, amount, segIndex = null) {'
);

loopsJs = loopsJs.replace(
  '  shiftLoop(direction, segIndex = null) {\n    if (!this.enforcePremiumFeature()) return;',
  '  shiftLoop(direction, segIndex = null) {'
);

loopsJs = loopsJs.replace(
  '  scaleLoop(multiplier, segIndex = null) {\n    if (!this.enforcePremiumFeature()) return;',
  '  scaleLoop(multiplier, segIndex = null) {'
);

fs.writeFileSync('js/loops.js', loopsJs, 'utf8');
console.log('Updated loops.js');


// 3. Update app.js
let appJs = fs.readFileSync('app.js', 'utf8');

// Update modal functions
appJs = appJs.replace(
  '  openProControlsModal() {\n    const modal = document.getElementById(\'pro-controls-modal\');',
  '  openGlobalControlsModal() {\n    const modal = document.getElementById(\'global-controls-modal\');'
);

appJs = appJs.replace(
  '  closeProControlsModal() {\n    const modal = document.getElementById(\'pro-controls-modal\');',
  '  closeGlobalControlsModal() {\n    const modal = document.getElementById(\'global-controls-modal\');'
);

// Unlock hotkeys (shiftLeft, shiftRight, halfScale, doubleScale) in actions array
appJs = appJs.replace('{ id: \'shiftLeft\', name: \'Shift Loop Left\', premium: true }', '{ id: \'shiftLeft\', name: \'Shift Loop Left\', premium: false }');
appJs = appJs.replace('{ id: \'shiftRight\', name: \'Shift Loop Right\', premium: true }', '{ id: \'shiftRight\', name: \'Shift Loop Right\', premium: false }');
appJs = appJs.replace('{ id: \'halfScale\', name: \'Halve Duration (1/2x)\', premium: true }', '{ id: \'halfScale\', name: \'Halve Duration (1/2x)\', premium: false }');
appJs = appJs.replace('{ id: \'doubleScale\', name: \'Double Duration (2x)\', premium: true }', '{ id: \'doubleScale\', name: \'Double Duration (2x)\', premium: false }');

// Unlock hotkeys logic block
const oldHotkeyBlock = `      } else if (isPremium && key === s.shiftLeft) {
        e.preventDefault();
        this.shiftLoop(-1);
      } else if (isPremium && key === s.shiftRight) {
        e.preventDefault();
        this.shiftLoop(1);
      } else if (isPremium && key === s.halfScale) {
        e.preventDefault();
        this.scaleLoop(0.5);
      } else if (isPremium && key === s.doubleScale) {
        e.preventDefault();
        this.scaleLoop(2);
      }`;

const newHotkeyBlock = `      } else if (key === s.shiftLeft) {
        e.preventDefault();
        this.shiftLoop(-1);
      } else if (key === s.shiftRight) {
        e.preventDefault();
        this.shiftLoop(1);
      } else if (key === s.halfScale) {
        e.preventDefault();
        this.scaleLoop(0.5);
      } else if (key === s.doubleScale) {
        e.preventDefault();
        this.scaleLoop(2);
      }`;

appJs = appJs.replace(oldHotkeyBlock, newHotkeyBlock);

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('Updated app.js');
