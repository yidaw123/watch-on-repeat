const fs = require('fs');

const files = [
  'music-practice.html',
  'language-learning.html',
  'youtube-study-tool.html'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix music-practice.html duplication
  if (file === 'music-practice.html') {
    const startIdx = content.indexOf('<div class="faq-section">');
    const endText = '<p><em>Not a musician? Discover how students use our <a href="youtube-study-tool.html">Video Study Tool</a>.</em></p>';
    const endIdx = content.indexOf(endText, startIdx);
    if (startIdx !== -1 && endIdx !== -1) {
      const blockToRemove = content.substring(startIdx, endIdx + endText.length);
      if (blockToRemove.includes('<!DOCTYPE html>')) {
         content = content.replace(blockToRemove, '');
         console.log('Removed corrupted block from ' + file);
      }
    }
  }

  // Swap faq-section and recommended-gear
  const faqStart = content.indexOf('<div class="faq-section">');
  const gearStart = content.indexOf('<!-- Recommended Gear Section -->');
  const ctaStart = content.indexOf('<div style="text-align: center; margin-top: 3rem;">', gearStart);
  
  if (faqStart !== -1 && gearStart !== -1 && ctaStart !== -1) {
    const faqBlock = content.substring(faqStart, gearStart).trim();
    const gearBlock = content.substring(gearStart, ctaStart).trim();
    
    const newContent = content.substring(0, faqStart) + 
                       gearBlock + '\n\n        ' + 
                       faqBlock + '\n\n        ' + 
                       content.substring(ctaStart);
                       
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Swapped sections in ' + file);
  } else {
    console.log('Could not find sections in ' + file);
  }
}
