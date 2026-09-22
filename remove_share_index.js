const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'blog', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /\/\/\s*Inject Share buttons to cards[\s\S]*?\}\);/g;

content = content.replace(regex, `// Ensure Read Article links stay at bottom
      cards.forEach(card => {
        const readMoreLink = card.querySelector('.read-more');
        if (readMoreLink) {
          readMoreLink.style.marginTop = 'auto';
        }
      });`);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Removed share buttons from blog index.");
