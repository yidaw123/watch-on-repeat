const fs = require('fs');
const html = fs.readFileSync('c:/Users/devil/Documents/video loop site project/index.html', 'utf8');
const lines = html.split('\n');
let divBalance = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div/g) || []).length;
    divBalance += (opens - closes);
    if (line.includes('id="tab-')) {
        console.log(Line :  (Balance: ));
    }
}
console.log(Final balance: );
