const https = require('https');
https.get('https://soundcloud.com/oembed?format=json&url=https%3A%2F%2Fsoundcloud.com%2Fskrillex%2Fscary-monsters-and-nice-sprites', {
  rejectUnauthorized: false
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(res.statusCode, data));
});
