const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  content = content.replace(/â€”/g, '&mdash;');
  content = content.replace(/â€™/g, '&rsquo;');
  content = content.replace(/â€œ/g, '&ldquo;');
  content = content.replace(/â€\?/g, '&rdquo;');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed encoding in ${file}`);
  }
});
