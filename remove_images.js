const fs = require('fs');

const files = ['music-practice.html', 'language-learning.html', 'youtube-study-tool.html'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find the block:
  // <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
  //   <img ...>
  //   <div>
  //     <h3 style="...">TITLE</h3>
  //   </div>
  // </div>
  // And replace it with just:
  // <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem; font-weight: 600;">TITLE</h3>
  
  const regex = /<div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">\s*<img[^>]*>\s*<div>\s*<h3[^>]*>(.*?)<\/h3>\s*<\/div>\s*<\/div>/g;
  
  content = content.replace(regex, '<h3 style="font-size: 1.1rem; margin-bottom: 0.5rem; font-weight: 600;">$1</h3>');
  
  fs.writeFileSync(file, content);
});

console.log("Removed broken images and fixed layout successfully.");
