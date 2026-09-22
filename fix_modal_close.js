const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));

const oldModalDiv = `<div id="blog-share-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">`;
const newModalDiv = `<div id="blog-share-modal" onclick="if(event.target === this) closeShareModal()" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">`;

const oldCopyBtnStart = `<button onclick="copyShareLink()"`;
const newCopyBtnStart = `<button onclick="copyShareLink(this)"`;

const oldCopyFuncRegex = /function copyShareLink\(\) \{[\s\S]*?alert\('Link copied to clipboard!'\);\s*\}/g;
const newCopyFunc = `function copyShareLink(btn) {
    const input = document.getElementById('share-link-input');
    input.select();
    document.execCommand('copy');
    if(btn) {
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
      setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
    }
  }`;

for (const file of files) {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(oldModalDiv, newModalDiv);
  content = content.replace(oldCopyBtnStart, newCopyBtnStart);
  content = content.replace(oldCopyFuncRegex, newCopyFunc);

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log("Fixed modal background click and removed alert!");
