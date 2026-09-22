const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace video.platform.toUpperCase() with (video.platform || 'video').toUpperCase()
content = content.replace(/\$\{video\.platform\.toUpperCase\(\)\}/g, "${(video.platform || 'video').toUpperCase()}");

// Similarly in renderAnalyticsTab, there's seg.platform.toUpperCase()
content = content.replace(/\$\{seg\.platform\.toUpperCase\(\)\}/g, "${(seg.platform || 'video').toUpperCase()}");

fs.writeFileSync(filePath, content, 'utf8');
console.log("Hardened toUpperCase");
