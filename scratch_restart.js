const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

// 1. Add restartLoop to defaultShortcuts
const defaultShortcutsRegex = /('decreaseSpeed': 'arrowdown'\s*)\}/;
content = content.replace(defaultShortcutsRegex, `$1,\n      'restartLoop': 'r'\n    }`);

// 2. Add restartLoop to actions array
const actionsRegex = /(\{ id: 'decreaseSpeed', name: 'Decrease Playback Speed', premium: false \}\s*)\];/;
content = content.replace(actionsRegex, `$1,\n      { id: 'restartLoop', name: 'Restart Current Loop', premium: false }\n    ];`);

// 3. Add handler
const handlerRegex = /(\} else if \(key === s\.decreaseSpeed\) \{\s*e\.preventDefault\(\);\s*this\.changePlaybackSpeed\(-0\.05\);\s*\})/;
const handlerReplacement = `$1 else if (key === s.restartLoop) {
        e.preventDefault();
        if (this.state.isMultiSegment) {
          const idx = this.state.abLoop.currentSegmentIndex || 0;
          if (this.state.abLoop.multiSegments && this.state.abLoop.multiSegments[idx] && this.state.abLoop.multiSegments[idx].start !== null) {
            this.seekToTime(this.state.abLoop.multiSegments[idx].start);
          }
        } else if (this.state.abLoop.start !== null) {
          this.seekToTime(this.state.abLoop.start);
        } else {
          this.seekToTime(0);
        }
      }`;
content = content.replace(handlerRegex, handlerReplacement);

fs.writeFileSync('app.js', content, 'utf8');
console.log("Added restartLoop");
