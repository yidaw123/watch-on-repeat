process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const id = 'alanwalker/faded';
const videoUrl = `https://soundcloud.com/${id}`;
fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(videoUrl)}`)
  .then(res => res.text())
  .then(text => console.log(text))
  .catch(err => console.error(err));
