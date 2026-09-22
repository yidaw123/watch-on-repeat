const fs = require('fs');
const path = require('path');
const blogDir = path.join(__dirname, 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add flex-wrap: wrap to .article-meta dynamically
  const cssRegex = /\.article-meta\s*\{[^}]*display:\s*flex;[^}]*\}/;
  const match = content.match(cssRegex);
  
  if (match) {
    let cssBlock = match[0];
    if (!cssBlock.includes('flex-wrap')) {
      cssBlock = cssBlock.replace('display: flex;', 'display: flex; flex-wrap: wrap;');
      content = content.replace(cssRegex, cssBlock);
    }
    
    // Reduce padding on button slightly so it aligns perfectly with the text
    const buttonPaddingRegex = /padding:\s*0\.5rem\s+1\.2rem;/g;
    content = content.replace(buttonPaddingRegex, 'padding: 0.35rem 1rem;');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated CSS and button padding in ${file}`);
  }
}
