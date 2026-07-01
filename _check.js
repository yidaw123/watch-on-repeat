const fs = require('fs');
const code = fs.readFileSync('js/playlists.js', 'utf8');
try {
  new Function(code);
  console.log('SYNTAX OK');
} catch(e) {
  console.log('SYNTAX ERROR:', e.message);
}
