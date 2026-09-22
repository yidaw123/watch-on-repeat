import os, re
slug = 'dance-choreography-slow-motion-ab-looping'
title = 'Dance & Choreography: Reverse-Engineering Complex Routines with Slow-Motion Looping'
desc = 'Learn how professional dancers and choreographers use A/B looping and slow-motion playback to master complex routines and sync their motor cortex.'
tag = 'Dance & Arts'
date_str = 'September 21, 2026'
date_iso = '2026-09-21'

with open('blog/sports-coaching-film-room-tape-breakdown.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = re.sub(r'<title>.*?</title>', f'<title>{title} | WatchOnRepeat Blog</title>', html)
html = re.sub(r'<meta name=\"description\" content=\".*?\">', f'<meta name=\"description\" content=\"{desc}\">', html)
html = re.sub(r'<link rel=\"canonical\" href=\"https://watchonrepeat.com/blog/.*?\">', f'<link rel=\"canonical\" href=\"https://watchonrepeat.com/blog/{slug}\">', html)
html = re.sub(r'<meta property=\"og:title\" content=\".*?\">', f'<meta property=\"og:title\" content=\"{title}\">', html)
html = re.sub(r'<meta property=\"og:description\" content=\".*?\">', f'<meta property=\"og:description\" content=\"{desc}\">', html)
html = re.sub(r'<meta property=\"og:url\" content=\"https://watchonrepeat.com/blog/.*?\">', f'<meta property=\"og:url\" content=\"https://watchonrepeat.com/blog/{slug}\">', html)
html = re.sub(r'<meta name=\"twitter:title\" content=\".*?\">', f'<meta name=\"twitter:title\" content=\"{title}\">', html)
html = re.sub(r'<meta name=\"twitter:description\" content=\".*?\">', f'<meta name=\"twitter:description\" content=\"{desc}\">', html)
html = re.sub(r'\"headline\": \".*?\"', f'\"headline\": \"{title}\"', html)
html = re.sub(r'\"description\": \".*?\"', f'\"description\": \"{desc}\"', html)
html = re.sub(r'\"datePublished\": \".*?\"', f'\"datePublished\": \"{date_iso}\"', html)
html = re.sub(r'\"dateModified\": \".*?\"', f'\"dateModified\": \"{date_iso}\"', html)
html = re.sub(r'\"url\": \"https://watchonrepeat.com/blog/.*?\"', f'\"url\": \"https://watchonrepeat.com/blog/{slug}\"', html)

html = re.sub(r'<div class=\"blog-tag\">.*?</div>', f'<div class=\"blog-tag\">{tag}</div>', html, count=1)
html = re.sub(r'<h1>.*?</h1>', f'<h1>{title}</h1>', html, count=1)
html = re.sub(r'<span>September.*?2026</span>', f'<span>{date_str}</span>', html, count=1)

content = '''
    <p>In the world of dance and choreography, a routine is only as strong as its weakest transition. While watching a breathtaking performance on YouTube is endlessly inspiring, actually trying to learn the sequence is a completely different story. Trying to pause, rewind, and replay an intricate 8-count while balancing on one foot usually ends in frustration.</p>
    
    <p>This is where <strong>slow-motion A/B looping</strong> completely changes the game. By isolating specific segments of a routine and slowing them down, dancers can reverse-engineer the most complex footwork, isolations, and weight transfers with mathematical precision.</p>

    <h2>Syncing the Motor Cortex</h2>
    <p>When you watch a fast-paced routine, your brain's visual cortex can process the shapes, but your motor cortex struggles to map those shapes onto your own body in real-time. This cognitive bottleneck is why you might "understand" a move visually, but completely fail to execute it physically.</p>
    
    <p>By defining a tight A/B loop over a difficult 2-second segment, you remove the mental burden of tracking the timeline. Your brain no longer has to anticipate what comes next or worry about falling behind. Instead, it enters a state of <em>motor cortex synchronization</em>. You watch the loop five times just to absorb it, then you mark it physically, and finally, you match the dancer on screen perfectly.</p>

    <h2>Practicing Slow Without Pitch Dropping</h2>
    <p>One of the biggest hurdles for dancers trying to learn from video is that slowing down the playback usually destroys the music. The audio becomes distorted, the pitch drops an octave, and the all-important beat vanishes into a muddy rumble.</p>
    
    <p>Modern looping tools like WatchOnRepeat solve this by utilizing advanced audio time-stretching. You can drop the video speed down to <strong>0.5x</strong> or even <strong>0.25x</strong> to catch every micro-movement, and the music's pitch stays exactly the same. The beat remains crisp and recognizable, allowing you to stay perfectly "in the pocket" of the rhythm even while moving at a glacial pace.</p>

    <h2>The Micro-Drilling Method</h2>
    <p>Professional choreographers don't learn 3-minute routines all at once. They build them block by block. Here is the optimal workflow for learning any dance video:</p>
    <ul>
      <li><strong>Watch the Whole Routine:</strong> Get a feel for the energy, musicality, and spatial awareness.</li>
      <li><strong>Isolate an 8-Count:</strong> Set your A and B markers around just one phrase. Do not move on until this phrase is flawless.</li>
      <li><strong>Drop the Speed to 0.5x:</strong> Drill the mechanics. Where is the weight shifted? Which muscle is isolating?</li>
      <li><strong>Ramp Up to 0.75x:</strong> Start adding the energy and flow back into the movement.</li>
      <li><strong>Perform at 1.0x:</strong> Execute the loop at full speed until your muscle memory takes over.</li>
    </ul>

    <p>Next time you find a routine you want to learn, don't just hit play. Set an A/B loop, slow it down, and let your body absorb the choreography one beat at a time.</p>
'''

html = re.sub(r'<div class=\"article-content\">[\s\S]*?</div>\s*<div class=\"article-footer\">', f'<div class=\"article-content\">\\n{content}\\n  </div>\\n  <div class=\"article-footer\">', html)

with open(f'blog/{slug}.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('blog/index.html', 'r', encoding='utf-8') as f:
    idx = f.read()

new_card = f'''        <div class="blog-card">
          <div class="blog-tag" style="margin-bottom: 0.5rem;">{tag}</div>
          <div class="blog-date" style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">{date_str}</div>
          <h2><a href="../blog/{slug}">{title}</a></h2>
          <p>{desc}</p>
          <a href="../blog/{slug}" class="read-more">Read Article <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i></a>
        </div>
'''
idx = idx.replace('<div class=\"blog-grid\">', f'<div class=\"blog-grid\">\\n{new_card}')
with open('blog/index.html', 'w', encoding='utf-8') as f:
    f.write(idx)

with open('sitemap.xml', 'r', encoding='utf-8') as f:
    sm = f.read()

new_sm = f'''  <url>
    <loc>https://watchonrepeat.com/blog/{slug}</loc>
    <lastmod>{date_iso}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>'''
sm = sm.replace('</urlset>', f'{new_sm}\\n</urlset>')
with open('sitemap.xml', 'w', encoding='utf-8') as f:
    f.write(sm)

print('done')
