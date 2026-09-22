const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert Share button in meta
  if (!content.includes('shareArticle()')) {
    const shareHtml = '\n          <div style="margin-top: 1.5rem; display: flex; justify-content: center;">\n            <button onclick="shareArticle()" class="share-btn" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; padding: 0.5rem 1.2rem; border-radius: 9999px; transition: background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.05)\'"><i data-lucide="share-2" style="width: 16px; height: 16px;"></i> Share Article</button>\n          </div>';
    
    // Replace the exact tag </header> that comes before <div class="article-content">
    content = content.replace(/<\/header>\s*<div class="article-content">/, '</header>' + shareHtml + '\n        \n        <div class="article-content">');
  }

  // Insert script before closing body
  if (!content.includes('function shareArticle')) {
    const scriptStr = `
  <script>
    function shareArticle() {
      const url = window.location.href;
      const title = document.title;
      if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(console.error);
      } else {
        navigator.clipboard.writeText(url).then(() => alert("Link copied to clipboard!"));
      }
    }
  </script>
`;
    content = content.replace(/<\/body>\s*<\/html>/, scriptStr + '</body>\n</html>');
  }

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log("Updated blog files with Share button using regex space matching!");
