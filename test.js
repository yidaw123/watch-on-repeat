const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

const match = content.match(/thumbUrl = .*video\.platform\.toUpperCase\(\).*;/g);
console.log(match);
