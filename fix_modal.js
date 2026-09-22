const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));

const oldCopyBtnRegex = /<button onclick="copyShareLink\(\)" style="background: linear-gradient\(135deg, #a855f7, #ec4899\); border: none; border-radius: 8px; padding: 0 1\.2rem; color: #fff; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0\.4rem; transition: opacity 0\.2s;"><i data-lucide="copy" style="width:16px;height:16px;"><\/i> Copy<\/button>/g;
const newCopyBtn = `<button onclick="copyShareLink()" style="background: linear-gradient(135deg, #a855f7, #ec4899); border: none; border-radius: 8px; padding: 0 1.2rem; color: #fff; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: opacity 0.2s; min-width: 100px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy</button>`;

const oldXBtn = `<button onclick="shareSocial('x')" class="social-circle">`;
const newXBtn = `<button onclick="shareSocial('x')" class="social-circle" style="color: #ffffff;">`;

const oldFbBtn = `<button onclick="shareSocial('facebook')" class="social-circle">`;
const newFbBtn = `<button onclick="shareSocial('facebook')" class="social-circle" style="color: #1877F2;">`;

const oldInBtn = `<button onclick="shareSocial('linkedin')" class="social-circle">`;
const newInBtn = `<button onclick="shareSocial('linkedin')" class="social-circle" style="color: #0A66C2;">`;

const oldWaBtn = `<button onclick="shareSocial('whatsapp')" class="social-circle">`;
const newWaBtn = `<button onclick="shareSocial('whatsapp')" class="social-circle" style="color: #25D366;">`;

for (const file of files) {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(oldCopyBtnRegex, newCopyBtn);
  content = content.replace(oldXBtn, newXBtn);
  content = content.replace(oldFbBtn, newFbBtn);
  content = content.replace(oldInBtn, newInBtn);
  content = content.replace(oldWaBtn, newWaBtn);

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log("Fixed modal colors and copy button!");
