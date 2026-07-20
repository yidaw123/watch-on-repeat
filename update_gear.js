const fs = require('fs');

// 1. Update style.css
let css = fs.readFileSync('style.css', 'utf8');
if (!css.includes('.gear-grid')) {
  css += `\n/* Gear Grid Responsive Layout */\n.gear-grid {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 1.5rem;\n}\n@media (max-width: 650px) {\n  .gear-grid {\n    grid-template-columns: 1fr;\n  }\n}\n`;
  fs.writeFileSync('style.css', css);
}

// 2. Process HTML files
const files = ['music-practice.html', 'language-learning.html', 'youtube-study-tool.html'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace inline grid with class
  content = content.replace(
    /<div style="display: grid; grid-template-columns: repeat\(auto-fit, minmax\(200px, 1fr\)\); gap: 1\.5rem;">/g,
    '<div class="gear-grid">'
  );
  
  // Update each gear item
  // Regex to match the gear items:
  // <a href="https://www.amazon.ca/dp/(.*?)/\?tag=.*?<h3.*?>(.*?)</h3>\s*<p.*?>(.*?)</p>\s*<span.*?>.*?</span>\s*</a>
  const regex = /<a href="https:\/\/www\.amazon\.ca\/dp\/([A-Z0-9]+)\/\?tag=watchonrepeat-20"([^>]*)>[\s\S]*?<h3[^>]*>(.*?)<\/h3>[\s\S]*?<p[^>]*>(.*?)<\/p>[\s\S]*?<span[^>]*>.*?<\/span>[\s\S]*?<\/a>/g;
  
  content = content.replace(regex, (match, asin, aAttrs, title, desc) => {
    return `<a href="https://www.amazon.ca/dp/${asin}/?tag=watchonrepeat-20"${aAttrs}>
              <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
                <img src="https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${asin}&Format=_SL250_&ID=AsinImage&MarketPlace=CA&ServiceVersion=20070822&WS=1&tag=watchonrepeat-20&language=en_CA" alt="${title}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 8px; background: #fff; padding: 5px;">
                <div>
                  <h3 style="font-size: 1.1rem; margin-bottom: 0.25rem; font-weight: 600;">${title}</h3>
                  <div style="color: #fbbf24; font-size: 0.85rem; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 4px;">
                    <i data-lucide="star" style="width: 14px; height: 14px; fill: #fbbf24; color: #fbbf24;"></i>
                    <i data-lucide="star" style="width: 14px; height: 14px; fill: #fbbf24; color: #fbbf24;"></i>
                    <i data-lucide="star" style="width: 14px; height: 14px; fill: #fbbf24; color: #fbbf24;"></i>
                    <i data-lucide="star" style="width: 14px; height: 14px; fill: #fbbf24; color: #fbbf24;"></i>
                    <i data-lucide="star-half" style="width: 14px; height: 14px; fill: #fbbf24; color: #fbbf24;"></i>
                    <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 2px;">(4.8)</span>
                  </div>
                </div>
              </div>
              <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4;">${desc}</p>
              <span style="display: inline-block; margin-top: 1rem; color: var(--color-blue); font-size: 0.85rem; font-weight: 500;">View on Amazon &rarr;</span>
            </a>`;
  });
  
  fs.writeFileSync(file, content);
});

console.log("Updated gear grids successfully.");
