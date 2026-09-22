const fs = require('fs');
const path = require('path');
const blogDir = path.join(__dirname, 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // We want to capture the button, remove its wrapper div, and place it inside the article-meta div.
  const regex = /<\/div>\s*<\/header>\s*<div style="margin-top: 1\.5rem; display: flex; justify-content: center;">\s*(<button onclick="shareArticle\(\)" class="share-btn"[\s\S]*?<\/button>)\s*<\/div>/;
  
  if (regex.test(content)) {
    const buttonHtml = content.match(regex)[1];
    
    // Replace the old button block entirely with just the closing tags
    content = content.replace(regex, `  ${buttonHtml}\n          </div>\n        </header>`);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Moved button in ${file}`);
  } else {
    console.log(`Could not find button pattern in ${file}`);
  }
}
