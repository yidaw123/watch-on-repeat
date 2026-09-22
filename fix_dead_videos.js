const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /if \(img\.naturalWidth === 120\) \{\s*card\.style\.display = 'none';\s*\}/g;

const replacement = `if (img.naturalWidth === 120) {
            card.style.display = 'none';
            // If this card is in a list and all cards are hidden, show empty state
            const parent = card.parentElement;
            if (parent) {
              const visibleCards = Array.from(parent.querySelectorAll('.video-card')).filter(c => c.style.display !== 'none');
              if (visibleCards.length === 0) {
                if (!parent.querySelector('.empty-msg')) {
                  const msg = document.createElement('div');
                  msg.className = 'empty-msg';
                  msg.style.cssText = 'padding: 24px; text-align: center; color: var(--text-muted); font-size: 14px;';
                  msg.textContent = 'No popular loops available right now.';
                  parent.appendChild(msg);
                }
              }
            }
          }`;

content = content.replace(regex, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Fixed dead videos hidden cards issue.");
