process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function test() {
  // Wistia
  try {
    const res = await fetch('https://noembed.com/embed?url=https://home.wistia.com/medias/j38ihh83m5');
    console.log('Wistia noembed:', await res.json());
  } catch(e) { console.error('Wistia error:', e.message); }

  // Soundcloud
  try {
    const res = await fetch('https://noembed.com/embed?url=https://soundcloud.com/alanwalkermusic/faded');
    console.log('Soundcloud noembed:', await res.json());
  } catch(e) { console.error('Soundcloud error:', e.message); }

  // Facebook
  try {
    const res = await fetch('https://noembed.com/embed?url=https://www.facebook.com/facebook/videos/10153231379946729');
    console.log('Facebook noembed:', await res.json());
  } catch(e) { console.error('Facebook error:', e.message); }
  
  // Twitch
  try {
    const res = await fetch('https://noembed.com/embed?url=https://twitch.tv/2821400022');
    console.log('Twitch noembed:', await res.json());
  } catch(e) { console.error('Twitch error:', e.message); }
}

test();
