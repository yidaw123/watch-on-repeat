const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const regex = /onclick=["']([^"']+)["']/g;
const calls = new Set();
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    calls.add(match[1]);
  }
});
console.log(Array.from(calls).join('\n'));
