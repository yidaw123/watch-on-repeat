import os
import re

# Create blog dir if it doesn't exist
os.makedirs('blog', exist_ok=True)

# Read template from youtube-looper.html
with open('youtube-looper.html', 'r', encoding='utf-8') as f:
    template = f.read()

# Find split points
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
        "desc": "Learn the best and easiest ways to loop YouTube videos infinitely on desktop and mobile in 2026, including A/B looping techniques.",
        "content": """
      <div class="article-container">
        <div class="breadcrumb">
          <a href="/">Home</a> &gt; <a href="/blog/">Blog</a> &gt; How to Loop YouTube Videos Infinitely
        </div>
        
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">How to Loop YouTube Videos Infinitely on Any Device</h1>
        <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 2rem;">Last Updated: August 2026</p>

        <section class="prose">
          <p>Have you ever found a song, an ambient background track, or a study video on YouTube that you just wanted to listen to on repeat? You're not alone. Millions of users every day search for ways to seamlessly put YouTube videos on an infinite loop. While YouTube does have a built-in loop feature, it often falls short when you need advanced controls, ad-blocking, or specific segment repeating (A/B looping). In this comprehensive guide, we'll explore all the different methods to loop YouTube videos infinitely on desktop, mobile, and tablets in 2026.</p>
          
          <h2>Method 1: The Native YouTube Loop Feature</h2>
          <p>In 2021, YouTube finally rolled out a native loop feature for desktop users. Here's how to use it:</p>
          <ol>
            <li>Open your desired video on YouTube in your desktop browser.</li>
            <li>Right-click anywhere inside the video player.</li>
            <li>Select <strong>"Loop"</strong> from the context menu that appears.</li>
          </ol>
          <p>While this is convenient, it has major limitations. First, if the video has ads, the ads may still play between loops, completely ruining the vibe of a study or sleep session. Second, you cannot loop a specific *part* of a video (like a guitar solo). Third, the mobile app version of this feature is buried deep in the settings menu.</p>

          <h2>Method 2: Using WatchOnRepeat (The Professional Way)</h2>
          <p>For users who need more control, a dedicated tool like <strong>WatchOnRepeat</strong> is the definitive solution. We built WatchOnRepeat to solve all the annoyances of the native player. It completely strips away the distractions, recommended videos, and comments, leaving you with a pristine, cinema-style interface.</p>
          <p>To use WatchOnRepeat:</p>
          <ul>
            <li><strong>The URL Trick:</strong> Simply go to your browser's address bar while watching a YouTube video, delete "youtube.com", and type "watchonrepeat.com" in its place. Press enter, and the video instantly loads on our looper!</li>
            <li><strong>Copy and Paste:</strong> Copy any video or playlist link and paste it directly into our homepage.</li>
          </ul>
          
          <h3>Advanced A/B Looping for Musicians and Language Learners</h3>
          <p>The biggest advantage of a tool like ours is <strong>A/B looping</strong>. If you are a musician trying to learn a complex solo, or a language learner trying to master the pronunciation of a specific phrase, you don't want to loop a 10-minute video. You want to loop a 5-second chunk. With WatchOnRepeat, you can set precise Start (A) and End (B) points. The player will continuously repeat just that segment until you have it perfectly memorized.</p>

          <h2>Method 3: Browser Extensions</h2>
          <p>There are several Chrome and Firefox extensions designed to loop videos. While they work, they often require intrusive permissions to read all your website data. Furthermore, as YouTube constantly updates its frontend code to combat ad blockers, many of these extensions break frequently. Using a standalone web-app avoids these constant breakages and keeps your browser free of bloatware.</p>

          <h2>Conclusion</h2>
          <p>Whether you're studying for an exam with lo-fi hip hop, practicing an instrument, or just enjoying your favorite track, looping shouldn't be a hassle. Skip the clunky native features and try a dedicated, feature-rich looper for the ultimate uninterrupted experience.</p>
        </section>
      </div>
"""
    },
    {
        "slug": "best-listenonrepeat-alternatives-2026",
        "title": "The Best ListenOnRepeat Alternatives in 2026 - WatchOnRepeat",
        "desc": "Looking for a ListenOnRepeat alternative? Discover why WatchOnRepeat is the ultimate free tool for looping and repeating YouTube videos.",
        "content": """
      <div class="article-container">
        <div class="breadcrumb">
          <a href="/">Home</a> &gt; <a href="/blog/">Blog</a> &gt; Best ListenOnRepeat Alternatives
        </div>
        
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">The Best ListenOnRepeat Alternatives for 2026</h1>
        <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 2rem;">Last Updated: August 2026</p>

        <section class="prose">
          <p>For over a decade, ListenOnRepeat was the go-to destination for millions of internet users looking to loop their favorite YouTube videos. Its simple URL trick (adding 'repeat' to the YouTube URL) became internet folklore. However, in recent years, ListenOnRepeat has dramatically pivoted its business model. They introduced paywalls, restricted core features behind premium subscriptions, and bloated their interface with unnecessary social features and ads.</p>
          <p>If you're frustrated with these changes and are looking for a true, free, and distraction-free alternative, you're in the right place. Here is a deep dive into the best alternatives available in 2026.</p>

          <h2>Why Are Users Leaving ListenOnRepeat?</h2>
          <p>The core philosophy of a video looper is simplicity. Users want to listen to a song on repeat, not sign up for a social network or pay a monthly fee just to repeat a video segment. The frustration hit a boiling point when basic features like A/B looping and saving loop history were pushed behind a premium tier. This left a massive vacuum in the market for a tool that respects the user's time and wallet.</p>

          <h2>Enter WatchOnRepeat: The Ultimate Successor</h2>
          <p>We built <strong>WatchOnRepeat</strong> specifically to address the pain points of former ListenOnRepeat users. Our goal was to create the fastest, cleanest, and most feature-rich looper entirely for free.</p>
          
          <h3>Key Features That Make It Better:</h3>
          <ul>
            <li><strong>100% Free Core Features:</strong> A/B looping, unlimited video repeats, and speed controls will always remain free. No paywalls for the basics.</li>
            <li><strong>The New URL Trick:</strong> Just like the old days, you can simply change "youtube.com" to "watchonrepeat.com" in any URL to instantly launch the looper. It's muscle memory rebuilt for a new era.</li>
            <li><strong>Audio Recording:</strong> Want to practice along with a backing track? WatchOnRepeat features a built-in microphone recorder so you can record your takes while the video loops, saving them securely to your local browser.</li>
            <li><strong>Time-Stamped Notes:</strong> Perfect for studying, you can take notes that are directly tied to video timestamps. Clicking a note jumps the video right to that exact second.</li>
            <li><strong>No Tracking, Pure Privacy:</strong> Your history, your notes, and your audio recordings are stored in your browser's IndexedDB. We don't upload your private study sessions or practice takes to our servers.</li>
          </ul>

          <h2>Other Alternatives</h2>
          <p>While we believe WatchOnRepeat is the premier choice, there are other tools like YouTubeLoop and Loop2Learn. However, these tools often suffer from outdated, clunky UI designs that haven't been updated since 2015, or they lack advanced features like playlist support and pitch-shifting.</p>

          <h2>The Verdict</h2>
          <p>If you miss the golden days of simple, effective video looping without the corporate bloat, WatchOnRepeat is the definitive ListenOnRepeat alternative for 2026. Give the URL trick a try on your next favorite song, and experience the difference.</p>
        </section>
      </div>
"""
    },
    {
        "slug": "transcribe-music-youtube-ab-looping",
        "title": "How to Transcribe Music from YouTube using A/B Looping - WatchOnRepeat",
        "desc": "A complete guide for musicians on how to transcribe complex solos, chords, and lyrics from YouTube videos using advanced A/B looping and speed controls.",
        "content": """
      <div class="article-container">
        <div class="breadcrumb">
          <a href="/">Home</a> &gt; <a href="/blog/">Blog</a> &gt; Transcribe Music with A/B Looping
        </div>
        
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">How to Transcribe Music from YouTube Using A/B Looping</h1>
        <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 2rem;">Last Updated: August 2026</p>

        <section class="prose">
          <p>Transcribing music—learning a song by ear without sheet music—is arguably the most powerful exercise a musician can do to improve their ear, technique, and vocabulary. Historically, musicians wore out vinyl records and cassette tapes physically rewinding the same 5-second solo over and over. Today, we have YouTube, the largest library of recorded music in human history. But navigating a fast bebop jazz solo or a blistering metal sweep picking section on the standard YouTube player is an exercise in frustration.</p>
          <p>This is where <strong>A/B looping</strong> and speed control become your best friends. In this guide, we'll show you exactly how to use WatchOnRepeat to transcribe any piece of music efficiently.</p>

          <h2>What is A/B Looping?</h2>
          <p>A/B looping simply means setting a specific start point (Point A) and a specific end point (Point B) within an audio or video track. The player will continuously play only the section between A and B, instantly jumping back to A the millisecond it reaches B. This allows you to listen to a difficult phrase dozens of times in a row without ever taking your hands off your instrument.</p>

          <h2>Step-by-Step Transcription Workflow</h2>
          
          <h3>1. Isolate the Phrase</h3>
          <p>Never try to transcribe an entire solo at once. Break it down into digestible phrases—usually 1 to 2 bars of music, or a single breath of a vocal line. Paste your YouTube link into WatchOnRepeat. Play the video and hit the <strong>[Set A]</strong> button exactly where the phrase starts, and the <strong>[Set B]</strong> button where it ends. Fine-tune the timestamps using the micro-adjustment buttons (+/- 0.1s) until the loop feels perfectly seamless.</p>

          <h3>2. Slow It Down (Without Changing Pitch)</h3>
          <p>If the phrase is too fast to decipher, use the speed controls. WatchOnRepeat uses advanced audio algorithms to slow down the video playback (e.g., to 50% or 25% speed) <em>without</em> altering the pitch of the notes. This means the notes will still be in the correct key, just played slower, allowing your ear to catch every passing tone and ghost note.</p>

          <h3>3. Sing What You Hear</h3>
          <p>Before you even touch your instrument, try to sing the phrase. If you can sing it perfectly in pitch and rhythm, you have internalized it in your brain. This makes finding the notes on your guitar, piano, or bass significantly easier. Let the A/B loop run 10 times while you just listen, then sing along with it for the next 10 loops.</p>

          <h3>4. Find the First Note</h3>
          <p>Once the phrase is in your head, pause the loop. Find the first note of the phrase on your instrument. Then, find the last note. Work your way through the middle, using your voice as a guide. Play along with the loop at a slow speed until you nail it.</p>
          
          <h3>5. Record Your Take</h3>
          <p>A unique feature of WatchOnRepeat is the built-in <strong>Audio Recorder</strong>. Once you think you have transcribed the phrase, hit the record button and play along with the original video. Listen back to your recording. Are you rushing the tempo? Are your bends perfectly in tune with the original artist? Self-recording provides brutal but necessary feedback for mastery.</p>

          <h2>Conclusion</h2>
          <p>Transcribing is hard work, but the right tools make it significantly less frustrating. By utilizing precise A/B loops, speed controls, and self-recording, you can accelerate your musical growth and learn from the greatest musicians on earth, directly from YouTube. Happy practicing!</p>
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
        <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 2rem;">Guides, tutorials, and deep-dives into getting the most out of video looping, music practice, and language learning.</p>
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
    f.write(make_page("Blog & Guides - WatchOnRepeat", "Guides, tutorials, and deep-dives into getting the most out of video looping.", blog_index, ""))

# Save articles
for a in articles:
    with open(f"blog/{a['slug']}.html", 'w', encoding='utf-8') as f:
        f.write(make_page(a['title'], a['desc'], a['content'], a['slug']))

print("Blog generated successfully.")
