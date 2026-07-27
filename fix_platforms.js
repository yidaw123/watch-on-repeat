const fs = require('fs');
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));

const replacements = [
  {
    regex: /YouTube, Dailymotion, and Vimeo/g,
    replacement: 'YouTube, Twitch, Facebook, Dailymotion, Vimeo, Mixcloud, Loom, and Wistia'
  },
  {
    regex: /YouTube, Dailymotion, Vimeo, adult sites, etc\./g,
    replacement: 'YouTube, Twitch, Facebook, Dailymotion, Vimeo, Mixcloud, Loom, Wistia, adult sites, etc.'
  },
  {
    regex: /YouTube, Dailymotion, Vimeo, and many other/g,
    replacement: 'YouTube, Twitch, Facebook, Dailymotion, Vimeo, Mixcloud, Loom, Wistia, and many other'
  },
  {
    regex: /YouTube, Twitch, Dailymotion, Vimeo, Wistia, SoundCloud/g,
    replacement: 'YouTube, Twitch, Facebook, Dailymotion, Vimeo, Mixcloud, Loom, Wistia, SoundCloud'
  },
  {
    regex: /YouTube, Dailymotion, Vimeo, or other/g,
    replacement: 'YouTube, Twitch, Facebook, Dailymotion, Vimeo, Mixcloud, Loom, Wistia, or other'
  },
  {
    regex: /YouTube, Dailymotion, Vimeo, etc\./g,
    replacement: 'YouTube, Twitch, Facebook, Dailymotion, Vimeo, Mixcloud, Loom, Wistia, etc.'
  },
  {
    regex: /YouTube, Dailymotion, Vimeo, Google/g,
    replacement: 'YouTube, Twitch, Facebook, Dailymotion, Vimeo, Mixcloud, Loom, Wistia, Google'
  },
  {
    regex: /YouTube, Dailymotion, Vimeo, and other/g,
    replacement: 'YouTube, Twitch, Facebook, Dailymotion, Vimeo, Mixcloud, Loom, Wistia, and other'
  },
  {
    regex: /YouTube, Twitch, Facebook, Dailymotion, Vimeo, Wistia, SoundCloud, or other/g,
    replacement: 'YouTube, Twitch, Facebook, Dailymotion, Vimeo, Mixcloud, Loom, Wistia, SoundCloud, or other'
  }
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(r => {
    content = content.replace(r.regex, r.replacement);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated platforms list in ${file}`);
  }
});
