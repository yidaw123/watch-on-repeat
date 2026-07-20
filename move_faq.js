const fs = require('fs');

// 1. Process listenonrepeat-alternative.html
let altContent = fs.readFileSync('listenonrepeat-alternative.html', 'utf8');

// Remove JSON-LD FAQ schema
const schemaRegex = /<script type="application\/ld\+json">\s*\{\s*"@context":\s*"https:\/\/schema\.org",\s*"@type":\s*"FAQPage"[\s\S]*?<\/script>/;
altContent = altContent.replace(schemaRegex, '');

// Remove FAQ HTML section
const faqSectionRegex = /<div class="faq-section">\s*<h2>Frequently Asked Questions<\/h2>[\s\S]*?<\/div>\s*<\/div>/;
// Wait, the div might close twice. Let's look at the structure:
// <div class="faq-section"> ... </div> (the faq-section div closes once)
altContent = altContent.replace(/<div class="faq-section">\s*<h2>Frequently Asked Questions<\/h2>[\s\S]*?<\/div>/, '');

fs.writeFileSync('listenonrepeat-alternative.html', altContent);

// 2. Process faq.html
let faqContent = fs.readFileSync('faq.html', 'utf8');
const newFaqs = `
        <h3 style="color: #fff; margin-bottom: 8px;">Is WatchOnRepeat free to use?</h3>
        <p style="color: var(--text-muted); line-height: 1.5; margin-bottom: 24px;">
          Yes, our core looping and note-taking features are 100% free to use forever.
        </p>

        <h3 style="color: #fff; margin-bottom: 8px;">Does Premium remove all ads?</h3>
        <p style="color: var(--text-muted); line-height: 1.5; margin-bottom: 24px;">
          Upgrading to Premium removes all WatchOnRepeat banner and site ads, creating a beautiful distraction-free interface. You also unlock exclusive functions like multiple segment loops, advanced loop control, customizable hotkeys, and more. (Please note that we cannot block YouTube's embedded pre-roll video ads).
        </p>
      </div>`;

faqContent = faqContent.replace('      </div>\n    </div>\n  </div>\n  <script>\n    lucide.createIcons();', newFaqs + '\n    </div>\n  </div>\n  <script>\n    lucide.createIcons();');

fs.writeFileSync('faq.html', faqContent);

console.log("Moved FAQ successfully.");
