const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');

const modalHtml = `
<style>
  .social-circle {
    width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.05);
    border: 1px solid #374151; display: flex; align-items: center; justify-content: center;
    color: #d1d5db; cursor: pointer; transition: all 0.2s;
  }
  .social-circle:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: #a855f7; }
</style>

<div id="blog-share-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
  <div style="background: var(--bg-card, #111827); border: 1px solid var(--border-color, #374151); border-radius: 16px; padding: 1.5rem; width: 90%; max-width: 450px; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
    <button onclick="closeShareModal()" style="position: absolute; right: 1rem; top: 1rem; background: none; border: none; color: #9ca3af; cursor: pointer;"><i data-lucide="x"></i></button>
    <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.4rem; color: #fff; margin-bottom: 0.5rem; margin-top: 0;">Share Article</h2>
    <p style="color: #9ca3af; font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.4;">Share this article with your network or copy the link directly.</p>
    
    <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
      <input type="text" id="share-link-input" readonly value="" style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid #374151; border-radius: 8px; padding: 0.75rem 1rem; color: #fff; outline: none; font-size: 0.9rem;">
      <button onclick="copyShareLink()" style="background: linear-gradient(135deg, #a855f7, #ec4899); border: none; border-radius: 8px; padding: 0 1.2rem; color: #fff; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: opacity 0.2s;"><i data-lucide="copy" style="width:16px;height:16px;"></i> Copy</button>
    </div>
    
    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
      <button onclick="shareSocial('x')" class="social-circle"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></button>
      <button onclick="shareSocial('facebook')" class="social-circle"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></button>
      <button onclick="shareSocial('linkedin')" class="social-circle"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></button>
      <button onclick="shareSocial('whatsapp')" class="social-circle"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></button>
    </div>
  </div>
</div>

<script>
  function shareArticle() {
    const modal = document.getElementById('blog-share-modal');
    const input = document.getElementById('share-link-input');
    input.value = window.location.href;
    modal.style.display = 'flex';
  }
  function closeShareModal() {
    document.getElementById('blog-share-modal').style.display = 'none';
  }
  function copyShareLink() {
    const input = document.getElementById('share-link-input');
    input.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
  }
  function shareSocial(network) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    let shareUrl = '';
    if(network === 'x') shareUrl = 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title;
    if(network === 'facebook') shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + url;
    if(network === 'linkedin') shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + url;
    if(network === 'whatsapp') shareUrl = 'https://api.whatsapp.com/send?text=' + title + ' ' + url;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
</script>
`;

const regex = /<script>\s*function shareArticle\(\) \{[\s\S]*?<\/script>/;

for (const file of files) {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (regex.test(content)) {
    content = content.replace(regex, modalHtml);
    fs.writeFileSync(filePath, content, 'utf8');
  }
}
console.log("Updated 10 blog posts with custom modal.");
