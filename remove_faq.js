const fs = require('fs');

let content = fs.readFileSync('faq.html', 'utf8');

const regex = /\s*<h3 style="color: #fff; margin-bottom: 8px;">Does Premium remove all ads\?<\/h3>\s*<p style="color: var\(--text-muted\); line-height: 1\.5; margin-bottom: 24px;">\s*Upgrading to Premium removes all WatchOnRepeat banner and site ads, creating a beautiful distraction-free interface\. You also unlock exclusive functions like multiple segment loops, advanced loop control, customizable hotkeys, and more\. \(Please note that we cannot block YouTube's embedded pre-roll video ads\)\.\s*<\/p>/;

content = content.replace(regex, '');

fs.writeFileSync('faq.html', content);

console.log("Removed FAQ successfully.");
