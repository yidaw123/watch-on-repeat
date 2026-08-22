const fs = require('fs');
let code = fs.readFileSync('js/loops.js', 'utf8');
code = code.replace(/this\.seekToTime\(([^)]+)\);\s*const newSegSpeed = ([^;]+);\s*if \(this\.state\.playbackRate !== newSegSpeed\) \{\s*this\.setPlaybackSpeed\(newSegSpeed, true\);\s*\}/g, 'const newSegSpeed = $2;\n      if (this.state.playbackRate !== newSegSpeed) {\n        this.setPlaybackSpeed(newSegSpeed, true);\n      }\n      this.seekToTime($1);');
fs.writeFileSync('js/loops.js', code);
