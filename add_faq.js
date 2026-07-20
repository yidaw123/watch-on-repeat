const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('/faq.html') && content.includes('About Us')) {
    content = content.replace(/<a href="\/?about\.html"/g, '<a href="/faq.html" style="color: #94a3b8; text-decoration: none; font-weight: bold;">FAQ</a>\n      <a href="/about.html"');
    fs.writeFileSync(f, content);
    console.log('Updated', f);
  }
});
