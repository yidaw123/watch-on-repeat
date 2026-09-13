const fs = require('fs');
const js = fs.readFileSync('app.js', 'utf8');

const lines = js.split('\n');
let inside = false;
let funcBody = '';
let braces = 0;

for (const line of lines) {
  if (line.includes('parseVideoUrl(url) {')) {
    inside = true;
  }
  if (inside) {
    funcBody += line + '\n';
    if (line.includes('{')) braces += (line.match(/\{/g) || []).length;
    if (line.includes('}')) braces -= (line.match(/\}/g) || []).length;
    if (braces === 0) {
      break;
    }
  }
}

funcBody = 'function ' + funcBody.replace('parseVideoUrl(url)', 'parseVideoUrl(url)');
eval(funcBody);

const urls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://vimeo.com/148751763',
    'https://www.dailymotion.com/video/x7tgad0',
    'https://www.facebook.com/facebook/videos/10153231379946729/',
    'https://soundcloud.com/post-malone/sunflower-spider-man-into-the',
    'https://www.mixcloud.com/spartacus/party-time/',
    'https://www.twitch.tv/videos/123456789',
    'https://fast.wistia.com/embed/medias/j38ihh83m5',
    'https://www.loom.com/share/5243eb077bd04856aee06e40b3c66f6e'
];
urls.forEach(u => console.log(u, '=>', parseVideoUrl(u)));
