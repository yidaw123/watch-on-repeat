const fs = require('fs');

const filesToUpdate = [
  'faq.html',
  'listenonrepeat-alternative.html',
  'music-practice.html',
  'youtube-study-tool.html'
];

filesToUpdate.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  // faq.html
  if (content.includes('Watch On Repeat Premium allows you to save')) {
    content = content.replace('Watch On Repeat Premium allows you to save', 'Watch On Repeat Premium and Pro allow you to save');
    changed = true;
  }

  // listenonrepeat-alternative.html
  if (content.includes('Upgrade to Premium')) {
    content = content.replace(/Upgrade to Premium/g, 'Upgrade to Premium/Pro');
    changed = true;
  }
  if (content.includes('Does Premium remove all ads?')) {
    content = content.replace('Does Premium remove all ads?', 'Do Premium and Pro remove all ads?');
    changed = true;
  }
  if (content.includes('Upgrading to Premium removes')) {
    content = content.replace('Upgrading to Premium removes', 'Upgrading to Premium or Pro removes');
    changed = true;
  }
  if (content.includes("Premium payments coming soon!")) {
    content = content.replace(/Premium payments coming soon!/g, "Premium/Pro payments coming soon!");
    changed = true;
  }

  // music-practice.html and youtube-study-tool.html
  if (content.includes('Is there a Premium tier')) {
    content = content.replace(/Is there a Premium tier/g, 'Is there a Premium or Pro tier');
    changed = true;
  }
  if (content.includes('Upgrading to Premium gives you')) {
    content = content.replace(/Upgrading to Premium gives you/g, 'Upgrading to Premium or Pro gives you');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Updated', f);
  }
});
