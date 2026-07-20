const fs = require('fs');

function addMeta(file, desc) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('<meta name="description"')) {
    const metaStr = `  <meta name="description" content="${desc}">\n  <meta property="og:description" content="${desc}">\n  <meta name="twitter:description" content="${desc}">\n`;
    content = content.replace('</title>', '</title>\n' + metaStr);
    fs.writeFileSync(file, content);
    console.log('Added meta to', file);
  }
}

addMeta('contact.html', "Contact the Watch On Repeat team. Have questions about our video looper or want to submit feedback? We'd love to hear from you.");
addMeta('faq.html', 'Frequently asked questions about Watch On Repeat. Learn how to loop YouTube, Twitch, and Vimeo videos infinitely and fix common playback issues.');
addMeta('privacy.html', 'Privacy Policy for Watch On Repeat. Read how we protect your data, local storage preferences, and handle third-party integrations like YouTube.');
addMeta('terms.html', 'Terms of Service for Watch On Repeat. Read the rules and guidelines for using our A/B video looping and practice tools.');
