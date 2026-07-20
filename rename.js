const fs = require('fs');
let text;

text = fs.readFileSync('music-practice.html', 'utf8');
text = text.replace('<h2>Frequently Asked Questions</h2>', '<h2>Musician\'s Guide</h2>');
fs.writeFileSync('music-practice.html', text);

text = fs.readFileSync('language-learning.html', 'utf8');
text = text.replace('<h2>Frequently Asked Questions</h2>', '<h2>Language Learning Guide</h2>');
fs.writeFileSync('language-learning.html', text);

text = fs.readFileSync('youtube-study-tool.html', 'utf8');
text = text.replace('<h2>Frequently Asked Questions</h2>', '<h2>Study Guide</h2>');
fs.writeFileSync('youtube-study-tool.html', text);
console.log('Renamed headers!');
