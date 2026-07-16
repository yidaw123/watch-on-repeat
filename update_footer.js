const fs = require('fs');
const glob = require('glob');

const newFooterLinks = `<div class="footer-links" style="font-size: 0.85em; opacity: 0.9; margin-top: 20px; display: flex; justify-content: center; align-items: center; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
      <a href="listenonrepeat-alternative.html" style="background: var(--gradient-primary, linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)); color: white; padding: 5px 14px; border-radius: 9999px; text-decoration: none; font-weight: bold; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); transition: transform 0.2s;"><i data-lucide="crown" style="width: 14px; height: 14px;"></i> Upgrade</a>
      <a href="https://buymeacoffee.com/watchonrepeat" target="_blank" style="background: rgba(255,255,255,0.05); color: #e2e8f0; padding: 5px 14px; border-radius: 9999px; text-decoration: none; font-weight: 500; display: flex; align-items: center; gap: 6px; border: 1px solid rgba(255,255,255,0.1); transition: background 0.2s;"><i data-lucide="heart" style="width: 14px; height: 14px; color: #fb7185;"></i> Donate</a>
      <span style="opacity: 0.3; margin: 0 -0.5rem;">|</span>
      <a href="about.html" style="color: #94a3b8; text-decoration: none;">About Us</a>
      <a href="privacy.html" target="_blank" style="color: #94a3b8; text-decoration: none;">Privacy</a>
      <a href="terms.html" target="_blank" style="color: #94a3b8; text-decoration: none;">Terms</a>
      <a href="contact.html" style="color: #94a3b8; text-decoration: none;">Contact Us</a>
      <a href="mailto:ads@watchonrepeat.com" style="color: #60a5fa; text-decoration: none; font-weight: 500;">Advertise with Us</a>
    </div>`;

glob('*.html', (err, files) => {
  if (err) throw err;
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    const regex = /<div class="footer-links"[^>]*>[\s\S]*?<\/div>/g;
    
    if (content.match(regex)) {
      content = content.replace(regex, newFooterLinks);
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated footer in ' + file);
    }
  });
});
