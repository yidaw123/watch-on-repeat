import os
import re

# We will rewrite articles 1 and 2, and delete 3.

# Read template from youtube-looper.html
with open('youtube-looper.html', 'r', encoding='utf-8') as f:
    template = f.read()

head_split = template.find('</head>')
main_split = template.find('<main class="main-content" style="padding-top: 2rem;">')
footer_split = template.find('<footer class="site-footer"')

head_top = template[:head_split]
head_bottom = template[head_split:main_split]
footer_bottom = template[footer_split:]

articles = [
    {
        "slug": "how-to-loop-youtube-videos-infinitely",
        "title": "How to Loop YouTube Videos Infinitely (2026 Guide) - WatchOnRepeat",
        "desc": "A straightforward guide on looping YouTube videos on desktop and mobile without ads breaking your flow.",
        "content": """
      <div class="article-container">
        <div class="breadcrumb">
          <a href="/">Home</a> &gt; <a href="/blog/">Blog</a> &gt; How to Loop YouTube Videos Infinitely
        </div>
        
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">How to Loop YouTube Videos Infinitely on Any Device</h1>
        <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 2rem;">Last Updated: August 2026</p>

        <section class="prose">
          <p>We've all been there: you find a perfect lo-fi mix for studying, ambient rain sounds to help you sleep, or a backing track for guitar practice, and you just want it to keep playing. You don't want to switch tabs every 10 minutes to hit replay.</p>
          <p>Looping a YouTube video seems like it should be the easiest thing in the world. And while YouTube does have a built-in loop feature now, anyone who uses it regularly knows it has some frustrating quirks—especially when ads ruin the loop.</p>
          <p>Here is a no-nonsense look at how to actually put videos on repeat, depending on what device you're using and what you're trying to do.</p>
          
          <h2>The Default Way: YouTube's Native Loop</h2>
          <p>If you're on a computer, the fastest way to repeat a video is using YouTube's own player.</p>
          <ol>
            <li>Open a video in your browser.</li>
            <li>Right-click on the video player itself.</li>
            <li>Click <strong>"Loop"</strong> from the menu.</li>
          </ol>
          <p>It works, but there's a catch. If you don't have YouTube Premium, an ad will often interrupt the video right as it restarts. Nothing ruins a deep focus session quite like a loud car commercial suddenly blasting in your ears.</p>
          <p>On mobile phones, it's a bit more hidden. You have to tap the gear icon in the top right corner of the video, open the extra settings menu, and toggle "Loop video" on. Again, it works in a pinch, but the ad problem remains.</p>

          <h2>The Better Way: Using a Dedicated Looper</h2>
          <p>If you loop videos often, using a dedicated site like WatchOnRepeat just makes more sense. We built it because we were tired of the native player's limitations.</p>
          <p>It's incredibly simple to use. When you're watching a video on YouTube, just click your address bar, change "youtube.com" to "watchonrepeat.com", and hit enter. The video will load up in our player and automatically start looping forever.</p>
          
          <h3>Why use a separate site?</h3>
          <p>Aside from stripping away the comments and sidebar distractions, the main reason people use a dedicated tool is for <strong>A/B looping</strong>.</p>
          <p>Say you're trying to learn a guitar riff, or maybe you're trying to nail the pronunciation of a phrase in a foreign language. You don't need the whole 15-minute video to repeat. You just need a specific 4-second chunk to play over and over again until you get it right.</p>
          <p>With a tool like ours, you just click "Set A" where you want it to start, and "Set B" where you want it to end. The player will continuously bounce between those two timestamps.</p>

          <h2>What About Browser Extensions?</h2>
          <p>You can find dozens of Chrome extensions that loop videos. Some of them are great, but there are a few reasons we generally avoid them.</p>
          <p>First, YouTube updates its site code constantly. When they do, these extensions usually break and you have to wait for the developer to patch them. Second, most browser extensions require permission to "read and change all your data on the websites you visit." That's a massive privacy risk just to repeat a video.</p>

          <h2>Final Thoughts</h2>
          <p>If you just need a video repeated once in a blue moon, right-clicking the YouTube player is fine. But if you rely on background tracks for focus, or if you're a musician trying to learn parts by ear, skip the hassle and use a dedicated looping site. It will save you a lot of clicking around.</p>
        </section>
      </div>
"""
    },
    {
        "slug": "best-listenonrepeat-alternatives-2026",
        "title": "The Best ListenOnRepeat Alternatives in 2026 - WatchOnRepeat",
        "desc": "A breakdown of what happened to ListenOnRepeat and the best free alternatives available today.",
        "content": """
      <div class="article-container">
        <div class="breadcrumb">
          <a href="/">Home</a> &gt; <a href="/blog/">Blog</a> &gt; Best ListenOnRepeat Alternatives
        </div>
        
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">The Best ListenOnRepeat Alternatives Right Now</h1>
        <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 2rem;">Last Updated: August 2026</p>

        <section class="prose">
          <p>For a really long time, if you wanted to put a YouTube song on a loop, you just typed "repeat" into the URL. ListenOnRepeat was an internet staple. It was simple, it was free, and it just worked.</p>
          <p>But if you've tried using it recently, you probably noticed things have changed drastically. The site shifted focus, heavily monetized its core features, and locked basic tools behind premium subscriptions. It left a lot of long-time users looking for a replacement that captures the simplicity of the original site.</p>

          <h2>What Changed?</h2>
          <p>The beauty of a video looper is that it's a utility. You want to open it, play your video, and leave it running in the background. You don't really want a social network.</p>
          <p>Over the years, the original site added a lot of bloat—chat rooms, music discovery feeds, and heavy ads. Eventually, they put features like A/B looping (repeating a specific section of a video) behind a paywall. For musicians who relied on that feature to practice, it was the final straw.</p>

          <h2>The Best True Alternative: WatchOnRepeat</h2>
          <p>We built WatchOnRepeat to be exactly what the old site used to be: fast, lightweight, and completely free to use. There are no paywalls for core features.</p>
          
          <p>Here is what makes it a solid replacement:</p>
          <ul>
            <li><strong>The URL Trick Still Works:</strong> Instead of adding "repeat", you just replace "youtube.com" with "watchonrepeat.com" in the address bar. It immediately loads the looper.</li>
            <li><strong>A/B Looping is Free:</strong> You can set start and end points to loop specific parts of a video without hitting a paywall limit.</li>
            <li><strong>Speed Controls:</strong> You can slow down playback (without changing the pitch) to learn fast musical parts easily.</li>
            <li><strong>No Tracking:</strong> If you use the notes or audio recording features, everything saves locally to your own browser. We don't store your personal practice sessions on our servers.</li>
          </ul>

          <h2>Other Options Out There</h2>
          <p>There are a few other looping sites out there like YouTubeLoop or Loop2Learn. They function perfectly fine if you just need a basic loop.</p>
          <p>The main drawback with these older alternatives is that their interfaces haven't been updated in years. They can be clunky on mobile devices and often lack quality-of-life features like keyboard shortcuts or dark mode.</p>

          <h2>Wrapping Up</h2>
          <p>It's always a bummer when a classic internet tool gets bogged down with paywalls and bloat. Fortunately, the void has been filled. If you're looking for that old-school, distraction-free looping experience, give WatchOnRepeat a try.</p>
        </section>
      </div>
"""
    }
]

# Generate index.html for /blog/
blog_index = f"""
      <div class="article-container">
        <div class="breadcrumb">
          <a href="/">Home</a> &gt; Blog
        </div>
        <h1 style="font-size: 2.5rem; margin-bottom: 2rem; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">The WatchOnRepeat Blog</h1>
        <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 2rem;">Thoughts, guides, and tips on getting the most out of video looping.</p>
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          {"".join([f'''
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 1.5rem; border-radius: var(--radius-lg); transition: background 0.2s;">
            <h2 style="margin-top: 0; margin-bottom: 0.5rem;"><a href="/blog/{a['slug']}" style="color: var(--text-primary); text-decoration: none;">{a['title'].replace(" - WatchOnRepeat", "")}</a></h2>
            <p style="color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.6;">{a['desc']}</p>
            <a href="/blog/{a['slug']}" style="color: var(--primary-color); font-weight: bold; text-decoration: none;">Read Article &rarr;</a>
          </div>
          ''' for a in articles])}
        </div>
      </div>
"""

def make_page(title, desc, content, slug=""):
    h = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', head_top, flags=re.DOTALL)
    h = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{desc}">', h, flags=re.DOTALL)
    h = re.sub(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{title}">', h, flags=re.DOTALL)
    h = re.sub(r'<meta property="og:description" content=".*?">', f'<meta property="og:description" content="{desc}">', h, flags=re.DOTALL)
    h = re.sub(r'<link rel="canonical" href=".*?">', f'<link rel="canonical" href="https://watchonrepeat.com/blog/{slug}">', h, flags=re.DOTALL)
    
    return h + head_bottom + '<main class="main-content" style="padding-top: 2rem;">\n' + content + '\n    </main>\n' + footer_bottom

# Save index
with open('blog/index.html', 'w', encoding='utf-8') as f:
    f.write(make_page("Blog & Guides - WatchOnRepeat", "Thoughts, guides, and tips on getting the most out of video looping.", blog_index, ""))

# Save articles
for a in articles:
    with open(f"blog/{a['slug']}.html", 'w', encoding='utf-8') as f:
        f.write(make_page(a['title'], a['desc'], a['content'], a['slug']))

# Delete the third article if it exists
if os.path.exists('blog/transcribe-music-youtube-ab-looping.html'):
    os.remove('blog/transcribe-music-youtube-ab-looping.html')
    
print("Blog rewritten successfully.")
