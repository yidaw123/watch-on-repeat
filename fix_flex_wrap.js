const fs = require('fs');
const path = require('path');
const blogDir = path.join(__dirname, 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add flex-wrap: wrap to .article-meta
  const oldCss = `.article-meta { color: var(--text-muted); font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 1rem; }`;
  const newCss = `.article-meta { color: var(--text-muted); font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap; }`;
  
  if (content.includes(oldCss)) {
    content = content.replace(oldCss, newCss);
    
    // Reduce padding on button slightly so it aligns perfectly with the text
    const oldPadding = `padding: 0.5rem 1.2rem;`;
    const newPadding = `padding: 0.35rem 1rem;`;
    content = content.replace(oldPadding, newPadding);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated CSS and button padding in ${file}`);
  }
}
