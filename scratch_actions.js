const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

const regex = /const actions = \[\s*\{\s*id:\s*'setStart'[\s\S]*?\];/;
const replacement = `const actions = [
      { id: 'prevLoop', name: 'Previous Loop Segment', premium: true },
      { id: 'nextLoop', name: 'Next Loop Segment', premium: true },
      { id: 'openNotes', name: 'Open Notes Tab' },
      { id: 'shiftLeft', name: 'Shift Loop Left', premium: true },
      { id: 'shiftRight', name: 'Shift Loop Right', premium: true },
      { id: 'halfScale', name: 'Halve Duration (1/2x)', premium: true },
      { id: 'doubleScale', name: 'Double Duration (2x)', premium: true },
      { id: 'increaseSpeed', name: 'Increase Playback Speed', premium: false },
      { id: 'decreaseSpeed', name: 'Decrease Playback Speed', premium: false }
    ];`;

content = content.replace(regex, replacement);
fs.writeFileSync('app.js', content, 'utf8');
console.log("Replaced successfully");
