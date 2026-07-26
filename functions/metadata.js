export async function onRequest(context) {
  const request = context.request;
  const env = context.env;
  
  const url = new URL(request.url);
  const platform = url.searchParams.get('platform');
  const id = url.searchParams.get('id');
  
  if (!platform || !id) {
    return new Response(JSON.stringify({ error: "Missing platform or id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  let title = null;
  let thumbnail = null;
  
  const fetchOptions = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*'
    }
  };

  try {
    if (platform === 'twitch') {
      const clientId = env.TWITCH_CLIENT_ID;
      const clientSecret = env.TWITCH_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
         return new Response(JSON.stringify({ error: "Missing Twitch API Credentials in Environment Variables" }), {
           status: 500,
           headers: { "Content-Type": "application/json" }
         });
      }
      
      const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
        method: 'POST'
      });
      
      if (!tokenRes.ok) {
        throw new Error(`Twitch Auth Failed: ${tokenRes.status}`);
      }
      
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      
      const twitchHeaders = {
        'Client-Id': clientId,
        'Authorization': `Bearer ${accessToken}`
      };
      
      const parts = id.split('=');
      const type = parts.length > 1 ? parts[0] : 'video';
      const val = parts.length > 1 ? parts[1] : id;
      
      if (type === 'video') {
         const vidRes = await fetch(`https://api.twitch.tv/helix/videos?id=${val}`, { headers: twitchHeaders });
         if (vidRes.ok) {
            const vidData = await vidRes.json();
            if (vidData.data && vidData.data.length > 0) {
               title = vidData.data[0].title;
               thumbnail = vidData.data[0].thumbnail_url.replace('%{width}', '1280').replace('%{height}', '720');
            }
         }
      } else if (type === 'clip') {
         const clipRes = await fetch(`https://api.twitch.tv/helix/clips?id=${val}`, { headers: twitchHeaders });
         if (clipRes.ok) {
            const clipData = await clipRes.json();
            if (clipData.data && clipData.data.length > 0) {
               title = clipData.data[0].title;
               thumbnail = clipData.data[0].thumbnail_url;
            }
         }
      } else {
         title = "Twitch Stream: " + val;
      }
    } 
    else if (platform === 'facebook') {
      const fbToken = env.FACEBOOK_ACCESS_TOKEN;
      if (fbToken) {
        const videoUrl = `https://www.facebook.com/facebook/videos/${id}`;
        const graphUrl = `https://graph.facebook.com/v19.0/?id=${encodeURIComponent(videoUrl)}&fields=title,description,picture&access_token=${fbToken}`;
        const fbRes = await fetch(graphUrl);
        if (fbRes.ok) {
           const fbData = await fbRes.json();
           title = fbData.title || fbData.description || "Facebook Video";
           thumbnail = fbData.picture;
        }
      } else {
        const fbRes = await fetch(`https://www.facebook.com/facebook/videos/${id}`, fetchOptions);
        if (fbRes.ok) {
          const html = await fbRes.text();
          const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) title = titleMatch[1].replace(' | Facebook', '');
          const thumbMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
          if (thumbMatch && thumbMatch[1]) thumbnail = thumbMatch[1];
        }
      }
    }
    else if (platform === 'soundcloud') {
      const scUrl = `https://soundcloud.com/oembed?format=json&url=https://soundcloud.com/${id}`;
      const scRes = await fetch(scUrl, fetchOptions);
      if (scRes.ok) {
         const scData = await scRes.json();
         title = scData.title;
         thumbnail = scData.thumbnail_url;
      }
    }
    else if (platform === 'wistia') {
      const wistiaUrl = `https://fast.wistia.com/oembed?url=https://home.wistia.com/medias/${id}`;
      const wistiaRes = await fetch(wistiaUrl, fetchOptions);
      if (wistiaRes.ok) {
         const wistiaData = await wistiaRes.json();
         title = wistiaData.title;
         thumbnail = wistiaData.thumbnail_url;
      }
    }

    if (!title) {
      title = `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`;
    }

    return new Response(JSON.stringify({ title, thumbnail }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video` }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      }
    });
  }
}
