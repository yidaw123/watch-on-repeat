const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find the footer block. Can handle attributes like <footer class="site-footer" style="...">
  const footerRegex = /(<footer class="site-footer"[^>]*>)([\s\S]*?)<\/footer>/;
  const match = content.match(footerRegex);
  
  if (match) {
    let footerOpen = match[1];
    let footerInner = match[2];
    
    const linksRegex = /<div class="footer-links"[\s\S]*?<\/div>/;
    const seoRegex = /<div class="footer-seo-links"[\s\S]*?<\/div>/;
    
    const linksMatch = footerInner.match(linksRegex);
    const seoMatch = footerInner.match(seoRegex);
    
    if (linksMatch && seoMatch) {
      // Find what's left after removing links and seo (this will be the copyright)
      let copyrightPart = footerInner.replace(linksRegex, '').replace(seoRegex, '').trim();
      
      let newSeo = seoMatch[0]
        .replace(/margin-top:\s*15px;?/, '')
        .replace(/margin-top:\s*1rem;?/, '') // just in case
        .replace(/font-size:\s*0\.9em;?/, 'font-size: 0.9em;') // keep it 0.9em
        .replace(/opacity:\s*0\.7;?/, '')
        .replace(/style="\s*"/, '')
        .replace(/style=""/, '');
        
      let newLinks = linksMatch[0];
      
      // We want to force style on footer-links
      if (newLinks.includes('style="')) {
         newLinks = newLinks.replace(/style="/, 'style="font-size: 0.8em; opacity: 0.7; margin-top: 15px; ');
      } else {
         newLinks = newLinks.replace(/class="footer-links"/, 'class="footer-links" style="font-size: 0.8em; opacity: 0.7; margin-top: 15px;"');
      }
      
      let newFooterInner = `\n    ${newSeo}\n    ${newLinks}\n    ${copyrightPart}\n  `;
      content = content.replace(footerRegex, `${footerOpen}${newFooterInner}</footer>`);
      
      fs.writeFileSync(file, content, 'utf8');
      count++;
    }
  }
});
console.log(`Updated ${count} files.`);
