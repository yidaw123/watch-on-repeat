const fs = require('fs');

const files = ['music-practice.html', 'language-learning.html', 'youtube-study-tool.html'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Regex to remove the star rating block
  // The block starts with <div style="color: #fbbf24; font-size: 0.85rem; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 4px;">
  // and ends with </div> right after the <span>(4.8)</span>
  
  const regex = /<div style="color: #fbbf24; font-size: 0\.85rem; margin-bottom: 0\.25rem; display: flex; align-items: center; gap: 4px;">\s*<i data-lucide="star"[\s\S]*?<span[^>]*>\(4\.8\)<\/span>\s*<\/div>/g;
  
  content = content.replace(regex, '');
  
  fs.writeFileSync(file, content);
});

console.log("Removed star ratings successfully.");
