const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'blog', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

const newHtml = `<div class="blog-controls" style="max-width: 1000px; margin: 0 auto 3rem auto; padding: 0 1.5rem; display: flex; justify-content: center;">
        <div class="search-box" style="position: relative; width: 100%; max-width: 500px;">
          <i data-lucide="search" style="position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.6); width: 20px; height: 20px;"></i>
          <input type="text" id="blog-search" class="blog-search-input" placeholder="Search articles...">
        </div>
      </div>`;

content = content.replace(/<div class="blog-controls"[\s\S]*?<\/div>\s*<\/div>/, newHtml);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Done");
