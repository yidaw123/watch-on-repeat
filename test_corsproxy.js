process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function testCorsProxy() {
  const getOg = async (url) => {
    try {
      const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(5000) });
      const html = await res.text();
      return html.substring(0, 500) + '...';
    } catch(e) {
      return e.message;
    }
  };
  
  console.log('Wistia:', await getOg('https://home.wistia.com/medias/j38ihh83m5'));
  console.log('SoundCloud:', await getOg('https://soundcloud.com/alanwalker/faded'));
  console.log('Facebook:', await getOg('https://www.facebook.com/facebook/videos/10153231379946729'));
  console.log('Twitch:', await getOg('https://twitch.tv/2821400022'));
}
testCorsProxy();
