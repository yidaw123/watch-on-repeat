import os
import re

# Create blog dir if it doesn't exist
os.makedirs('blog', exist_ok=True)

# Read template from guide.html
with open('guide.html', 'r', encoding='utf-8') as f:
    template = f.read()

# Find split points
head_split = template.find('</head>')
main_split = template.find('<main class="main-content" style="padding-top: 2rem;">')
footer_split = template.find('<footer class="site-footer"')

head_top = template[:head_split]
head_bottom = template[head_split:main_split]
footer_bottom = template[footer_split:]
# Fix footer links
footer_bottom = footer_bottom.replace('href="/', 'href="../')

# Fix asset paths in the head_top (CSS, logo, etc.)
head_top = head_top.replace('href="style.css', 'href="../style.css')
head_top = head_top.replace('href="/style.css', 'href="../style.css')
head_top = head_top.replace('href="logo.svg"', 'href="../logo.svg"')
head_top = head_top.replace('href="/logo.svg"', 'href="../logo.svg"')

# Fix asset paths in the head_bottom (Navbar logo)
head_bottom = head_bottom.replace('src="logo.svg"', 'src="../logo.svg"')
head_bottom = head_bottom.replace('src="/logo.svg"', 'src="../logo.svg"')

# Replace the navbar in head_bottom to make it modern and clean for the blog
new_navbar = """
  <div id="app-shell">
    <header class="navbar" style="background: transparent; padding: 1rem 2rem;">
      <a href="../" class="brand" style="text-decoration: none; display: flex; align-items: center; gap: 0.75rem;">
        <img src="../logo.svg" alt="WatchOnRepeat Logo" style="width: 32px; height: 32px; object-fit: contain;">
        <span class="brand-name" style="font-size: 1.25rem;">Watch<span>On</span>Repeat</span>
      </a>
      <div style="flex: 1; display: flex; justify-content: flex-end; align-items: center; gap: 1.5rem;">
        <a href="../blog/" style="color: var(--text-primary); font-weight: 500; text-decoration: none;">Blogs</a>
        <a href="../" class="btn btn-primary" style="text-decoration: none; font-size: 0.9rem; padding: 0.5rem 1rem;">Launch App</a>
      </div>
    </header>
"""
# We need to replace the existing header block in head_bottom
# Let's just use regex to strip out the old <header> block and replace it
head_bottom = re.sub(r'<div id="app-shell">.*?</header>', new_navbar, head_bottom, flags=re.DOTALL)

# Add some modern CSS for the blog
blog_css = """
  <style>
    /* Modern Blog Styles */
    .blog-hero {
      text-align: center;
      padding: 4rem 2rem;
      background: radial-gradient(circle at 50% -20%, rgba(139, 92, 246, 0.15), transparent 70%);
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 3rem;
    }
    .blog-hero h1 {
      font-size: 3rem;
      font-family: 'Orbitron', sans-serif;
      margin-bottom: 1rem;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .blog-hero p {
      font-size: 1.2rem;
      color: var(--text-secondary);
      max-width: 600px;
      margin: 0 auto;
    }
    
    .blog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 2rem;
      max-width: 1000px;
      margin: 0 auto 5rem auto;
      padding: 0 1.5rem;
    }
    
    .blog-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 2rem;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
    }
    .blog-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      border-color: rgba(139, 92, 246, 0.4);
    }
    
    .blog-tag {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--primary-color);
      font-weight: 700;
      margin-bottom: 1rem;
    }
    
    .blog-card h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      line-height: 1.3;
      font-family: 'Outfit', sans-serif;
    }
    .blog-card h2 a {
      color: var(--text-primary);
      text-decoration: none;
    }
    
    .blog-card p {
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 2rem;
      flex: 1;
    }
    
    .read-more {
      font-weight: 600;
      color: var(--primary-color);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
    }
    .read-more:hover {
      color: #d8b4fe;
    }
    
    /* Article Page Styles */
    .article-header {
      text-align: center;
      max-width: 800px;
      margin: 0 auto 3rem auto;
      padding: 0 1.5rem;
    }
    .article-header .blog-tag {
      justify-content: center;
      display: flex;
      margin-top: 2rem;
    }
    .article-header h1 {
      font-size: 3rem;
      line-height: 1.2;
      font-family: 'Outfit', sans-serif;
      margin-bottom: 1rem;
      color: var(--text-primary);
    }
    .article-meta {
      color: var(--text-muted);
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }
    
    .article-content {
      max-width: 720px;
      margin: 0 auto 5rem auto;
      padding: 0 1.5rem;
    }
    .article-content p {
      font-size: 1.15rem;
      line-height: 1.8;
      color: var(--text-secondary, #333);
      margin-bottom: 1.75rem;
    }
    .article-content h2 {
      font-size: 1.8rem;
      font-family: 'Outfit', sans-serif;
      margin-top: 3rem;
      margin-bottom: 1.25rem;
      color: var(--text-primary);
    }
    .article-content h3 {
      font-size: 1.4rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    .article-content ul, .article-content ol {
      margin-bottom: 2rem;
      padding-left: 1.5rem;
    }
    .article-content li {
      font-size: 1.15rem;
      line-height: 1.7;
      color: var(--text-secondary, #333);
      margin-bottom: 0.75rem;
    }
    .article-content blockquote {
      border-left: 4px solid var(--primary-color);
      padding-left: 1.5rem;
      margin: 2rem 0;
      font-style: italic;
      color: var(--text-muted);
    }
    
    @media(max-width: 768px) {
      .blog-hero h1 { font-size: 2.2rem; }
      .article-header h1 { font-size: 2.2rem; }
      .article-content p { font-size: 1.05rem; }
    }
  </style>
"""

# Inject CSS into head_bottom before </head>
# Wait, head_bottom doesn't have </head>. It's after </head>.
# Let's inject into head_top.
head_top = head_top + blog_css

# Add AdSense script tag to blog pages
adsense_tag = """
  <!-- Google AdSense -->
  <meta name="google-adsense-account" content="ca-pub-7515114786845929">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7515114786845929" crossorigin="anonymous"></script>
"""
head_top = head_top + adsense_tag


articles = [
    {
        "slug": "the-science-of-repetition-language-mastery",
        "title": "The Science of Repetition: How to Master a Language Through Immersion",
        "desc": "Discover the neurological mechanisms behind spaced repetition and active listening, and how looping media builds fluency.",
        "tag": "Language Learning",
        "date": "August 2026",
        "content": """
      <article>
        <header class="article-header">
          <div class="blog-tag">Language Learning</div>
          <h1>The Science of Repetition: How to Master a Language Through Immersion</h1>
          <div class="article-meta">
            <span>By the WatchOnRepeat Team</span>
            <span>&bull;</span>
            <span>August 2026</span>
          </div>
        </header>

        <div class="article-content">
          <p>Anyone who has tried to learn a new language as an adult knows the feeling: you can memorize vocabulary lists and grammar rules for hours, but the moment a native speaker asks you a simple question, your brain freezes. The words are in your head somewhere, but you can't access them fast enough to hold a conversation.</p>
          
          <p>This disconnect happens because traditional classroom language learning relies heavily on declarative memory—knowing <em>that</em> a rule exists. True fluency, however, requires procedural memory—knowing <em>how</em> to use the language automatically. The bridge between these two types of memory is built on one fundamental psychological principle: repetition through immersion.</p>
          
          <h2>Active vs. Passive Listening</h2>
          <p>A common myth in the language learning community is that you can learn by "osmosis." People will play Spanish podcasts while they sleep or have French movies playing in the background while they work, hoping their subconscious mind will pick it up.</p>
          
          <p>Unfortunately, the brain is incredibly efficient at filtering out noise it doesn't understand. Passive listening might help you get a feel for the general cadence of a language, but it won't teach you vocabulary or grammar. To build actual neural pathways, you need <strong>active listening</strong>.</p>
          
          <p>Active listening requires deep focus. It means listening to a short phrase, breaking it down, understanding the individual phonemes, and mimicking the speaker's intonation perfectly. This is an intense cognitive task, which is why it is impossible to do with a 2-hour movie playing at full speed.</p>

          <h2>The Power of the Micro-Loop</h2>
          <p>To transition from passive to active listening, linguists recommend a technique often used by musicians: the micro-loop. Instead of listening to a 5-minute dialogue, you isolate a 3-second phrase.</p>
          
          <ul>
            <li><strong>Listen:</strong> Play the 3-second phrase 10 times in a row. Close your eyes. Focus entirely on the sounds, not the spelling.</li>
            <li><strong>Mimic:</strong> Try to sing the phrase exactly as the native speaker said it. Match their pitch, their speed, and their emotion.</li>
            <li><strong>Analyze:</strong> Only after you can mimic the sound perfectly should you look at the written text to understand the grammar.</li>
          </ul>
          
          <p>By forcing your brain to process the exact same auditory input repeatedly, you strip away the cognitive load of trying to keep up with the conversation. You give your neurons the time they need to wire together.</p>

          <blockquote>"Repetition is the mother of learning, the father of action, which makes it the architect of accomplishment." — Zig Ziglar</blockquote>

          <h2>Building Your Immersion Environment</h2>
          <p>In the digital age, you don't need to move to a foreign country to immerse yourself. YouTube is the greatest language learning repository in human history. It offers an infinite supply of native speakers talking naturally about subjects you genuinely care about.</p>
          
          <p>The key is to find content slightly above your current level (what linguist Stephen Krashen calls "i+1" comprehensible input). If you love cooking, watch Italian cooking tutorials. If you love technology, watch German tech reviews. The visual context will help your brain bridge the gap when you encounter unknown words.</p>

          <h2>A Practical Workflow</h2>
          <p>When you sit down for a focused study session, find a YouTube video that interests you. When you encounter a native idiom or a fast-spoken phrase you don't understand, don't just turn on the subtitles and move on. Isolate that phrase. Loop it. Slow it down to 50% speed without changing the pitch. Listen to it until the blur of syllables resolves into distinct, understandable words.</p>
          
          <p><em>(Note: If you're looking for a tool to make this easier, this is exactly why we built <a href="/" style="color: var(--primary-color);">WatchOnRepeat</a>. It lets you set A/B loops on any video to isolate phrases seamlessly).</em></p>

          <p>Language mastery isn't about raw intelligence; it's about exposure. Embrace the repetition, focus on the sounds, and watch how quickly your brain adapts to its new environment.</p>
        </div>
      </article>
"""
    },
    {
        "slug": "why-the-10000-hour-rule-is-wrong",
        "title": "Why the 10,000 Hour Rule is Wrong (And How Deliberate Practice Works)",
        "desc": "Mindless repetition won't make you an expert. Learn how deliberate practice and isolating variables accelerates skill acquisition.",
        "tag": "Skill Mastery",
        "date": "August 2026",
        "content": """
      <article>
        <header class="article-header">
          <div class="blog-tag">Skill Mastery</div>
          <h1>Why the 10,000 Hour Rule is Wrong (And How Deliberate Practice Works)</h1>
          <div class="article-meta">
            <span>By the WatchOnRepeat Team</span>
            <span>&bull;</span>
            <span>August 2026</span>
          </div>
        </header>

        <div class="article-content">
          <p>In 2008, Malcolm Gladwell popularized the "10,000-Hour Rule"—the idea that it takes 10,000 hours of practice to achieve mastery in any field. It's a comforting thought. It implies that expertise is simply a matter of punching the clock. If you play guitar for 10,000 hours, you'll be Jimi Hendrix. If you play tennis for 10,000 hours, you'll be Serena Williams.</p>
          
          <p>There's just one problem: it's not true.</p>
          
          <p>Anders Ericsson, the cognitive psychologist whose research Gladwell originally based his rule on, spent the latter part of his career actively debunking the pop-culture version of his work. In his foundational 1993 study, <em>"The Role of Deliberate Practice in the Acquisition of Expert Performance"</em> (published in the Psychological Review), Ericsson and his colleagues demonstrated that simply repeating an action for thousands of hours often leads to stagnation, not mastery. The difference between an amateur and an expert isn't the <em>amount</em> of time spent practicing, but the <em>quality</em> of the practice.</p>

          <div style="background: rgba(139, 92, 246, 0.1); border-left: 4px solid var(--primary-color); padding: 1.5rem; margin: 2rem 0; border-radius: 0 var(--radius-md) var(--radius-md) 0;">
            <h3 style="margin-top: 0; font-size: 1.1rem; color: var(--primary-color);">The Scientific Consensus</h3>
            <p style="margin-bottom: 0; font-size: 1rem; color: var(--text-secondary);">A 2014 meta-analysis by Princeton researchers published in <em>Psychological Science</em> further supported Ericsson's caveat. They analyzed 88 studies on deliberate practice and found that practice time only accounted for a 12% difference in performance across various domains. The scientific consensus is clear: hours alone do not create experts; cognitive engagement and targeted correction do.</p>
          </div>

          <h2>The Trap of Mindless Repetition</h2>
          <p>Think about driving a car. You probably have thousands of hours of driving experience. Are you a world-class race car driver? No. You are probably exactly as good at driving today as you were five years ago.</p>
          
          <p>Once a skill reaches an acceptable level of automaticity—meaning you can do it without thinking about it—your brain stops improving. If you are a musician who only ever plays songs you already know from start to finish, you are simply reinforcing your current ability level. You are driving the car.</p>

          <h2>The Mechanics of Deliberate Practice</h2>
          <p>To break through a plateau, you must engage in what Ericsson called <strong>Deliberate Practice</strong>. This is practice designed specifically to improve performance, characterized by intense focus, immediate feedback, and stepping just outside your comfort zone.</p>
          
          <p>Deliberate practice generally involves three steps:</p>
          
          <ol>
            <li><strong>Isolating the Weakness:</strong> You cannot fix a messy guitar solo by playing the whole song over and over. You must identify the exact two-second segment where your fingers trip up.</li>
            <li><strong>Slowing Down:</strong> Speed hides sloppy technique. You must slow the movement down to a pace where you can execute it with absolute, conscious perfection.</li>
            <li><strong>Immediate Feedback:</strong> You need to know instantly if you made a mistake. This usually comes from a coach, a mirror, or recording yourself.</li>
          </ol>

          <h2>Applying Deliberate Practice in the Real World</h2>
          <p>Whether you are learning a martial art, studying a language, or mastering an instrument, the internet provides incredible resources for deliberate practice, provided you use them correctly.</p>
          
          <p>If you are learning a dance routine from a video, don't watch the whole routine. Isolate a 4-beat measure. Loop that specific measure. Slow the video down to 50% speed. Watch the instructor's footwork intensely, then try to replicate it. Record yourself on your phone and compare your footage directly against the instructor. Only when you have mastered those 4 beats should you move on to the next.</p>
          
          <blockquote>"The journey to mastery is not a straight line of accumulated hours; it is a staircase built on focused, uncomfortable moments of conscious effort." — <em>WatchOnRepeat Team</em></blockquote>

          <h2>Conclusion</h2>
          <p>The 10,000-hour rule is a myth because time is passive. Mastery is active. The next time you sit down to practice, ask yourself: am I just putting in time, or am I deliberately tackling my weaknesses?</p>
          
          <p><em>(Tip: Tools that allow for precise A/B looping and speed control without pitch distortion are essential for deliberate practice. This philosophy is the foundation of why we created <a href="/" style="color: var(--primary-color);">WatchOnRepeat</a>.)</em></p>
        </div>
      </article>
"""
    },
    {
        "slug": "why-transcribing-by-ear-beats-reading-tabs",
        "title": "Why Transcribing by Ear Beats Reading Tabs (And How to Start)",
        "desc": "Sheet music and guitar tabs are great, but developing relative pitch through transcription is the true secret to musical fluency.",
        "tag": "Music Theory",
        "date": "August 2026",
        "content": """
      <article>
        <header class="article-header">
          <div class="blog-tag">Music Theory</div>
          <h1>Why Transcribing by Ear Beats Reading Tabs (And How to Start)</h1>
          <div class="article-meta">
            <span>By the WatchOnRepeat Team</span>
            <span>&bull;</span>
            <span>August 2026</span>
          </div>
        </header>

        <div class="article-content">
          <p>We live in a golden age of musical accessibility. If you want to learn the blistering guitar solo from "Hotel California" or the bassline to a Dua Lipa song, a quick Google search will yield dozens of free, highly accurate tabs and sheet music. It has never been easier to learn how to play a song.</p>
          
          <p>But there is a hidden downside to this convenience: musicians are losing their ears.</p>
          
          <p>When you rely exclusively on visual aids (like sheet music or fretboard diagrams) to learn music, you are essentially painting by numbers. You might be able to physically recreate the sounds, but you aren't developing the underlying neurological connection between what you hear and what your hands do.</p>

          <h2>The Problem with "Painting by Numbers"</h2>
          <p>Imagine trying to hold a conversation in a foreign language, but instead of understanding the words, you are just reading phonetics off a teleprompter. That is what it feels like to play music entirely from tabs. When the sheet music is taken away, or when you are asked to improvise with a band, you freeze.</p>
          
          <p>True musical fluency comes from <strong>relative pitch</strong>—the ability to hear a musical interval (the distance between two notes) and instantly know what it feels like to play it on your instrument. The only way to develop relative pitch is through transcription: listening to a piece of music and figuring it out entirely by ear.</p>

          <h2>The Transcription Process</h2>
          <p>Transcribing can be incredibly frustrating at first, especially if you have spent years relying on your eyes instead of your ears. The trick is to start small and isolate your variables.</p>
          
          <ol>
            <li><strong>Find the Root Note:</strong> Before you try to learn a melody, figure out the bassline. The bass notes usually dictate the chord progression. Once you know what key the song is in, you have a roadmap for the rest of the notes.</li>
            <li><strong>Sing It First:</strong> This is the most important step. If you can't sing the riff, you can't play it. Put your instrument down, listen to the phrase, and sing it back. This forces your brain to internalize the pitch rather than relying on muscle memory.</li>
            <li><strong>Hunt and Peck:</strong> Once you can sing the melody perfectly, pick up your instrument and try to match the notes to the sounds in your head. It will be slow at first, but your brain will quickly start mapping the physical frets or keys to the intervals you hear.</li>
          </ol>

          <h2>The Technology of Slowing Down</h2>
          <p>Historically, transcribing fast jazz solos or complex classical runs required physical vinyl records. Musicians would literally place a finger on the record to slow it down, which dropped the pitch and made it incredibly difficult to decipher.</p>
          
          <p>Today, digital tools have completely revolutionized this process. When tackling a difficult piece of music, the most effective workflow is to isolate a specific 2-second measure and loop it continuously. If the notes are too fast to distinguish, you can digitally slow the playback speed down to 50% without altering the pitch.</p>
          
          <blockquote>"You can't play what you can't hear. The ear is the most important part of your musical equipment."<br>— <strong>Victor Wooten</strong>, 5-time Grammy-winning bassist</blockquote>

          <p>Reading sheet music is undeniably a valuable skill for any working musician, but it shouldn't be a crutch. To become a truly fluent, expressive player who can jump into a jam session and improvise effortlessly, you have to bridge the gap between your mind and your fingers.</p>
          
          <p>Start small. Take a solo you love, load it up in <a href="../" style="color: var(--primary-color); font-weight: 500;">WatchOnRepeat</a>, drop the speed, and loop the first measure. Turn away from the screen, close your eyes, and trust your ears.</p>
        </div>
      </article>
"""
    },
    {
        "slug": "the-psychology-of-flow-why-we-loop-songs",
        "title": "The Psychology of Flow: Why Gamers and Coders Listen to the Same Song on Repeat",
        "desc": "Explore the science of the 'flow state' and why repetitive background audio helps block out distractions and reduce cognitive load.",
        "tag": "Productivity",
        "date": "August 2026",
        "content": """
      <article>
        <header class="article-header">
          <div class="blog-tag">Productivity</div>
          <h1>The Psychology of Flow: Why Gamers and Coders Listen to the Same Song on Repeat</h1>
          <div class="article-meta">
            <span>By the WatchOnRepeat Team</span>
            <span>&bull;</span>
            <span>August 2026</span>
          </div>
        </header>

        <div class="article-content">
          <p>If you walk into a software engineering firm or a competitive gaming tournament, you'll notice a strange phenomenon: a significant number of people will be listening to the exact same song, or the exact same ambient track, looped continuously for hours on end.</p>
          
          <p>To an outside observer, this sounds like psychological torture. Why would anyone subject themselves to the same 3-minute synth-wave track fifty times in a row? The answer lies in the neuroscience of focus and the pursuit of the "flow state."</p>

          <h2>Understanding the Flow State</h2>
          <p>In the 1970s, psychologist Mihaly Csikszentmihalyi coined the term <em>Flow</em>. It describes a state of total cognitive absorption—a mental state where a person is fully immersed in a feeling of energized focus, full involvement, and enjoyment in the process of an activity. In pop culture, it's often referred to as being "in the zone."</p>
          
          <p>Achieving flow requires a delicate balance between the challenge of a task and the skill of the performer. But more importantly, it requires the complete elimination of external distractions. This is where looping audio comes in.</p>

          <h2>The Problem with Playlists</h2>
          <p>Many people use Spotify playlists or the radio to help them focus. But traditional music formats are inherently disruptive to deep work. Every time a song ends and a new one begins, there is a shift in tempo, key, instrumentation, and volume.</p>
          
          <p>Your brain is hardwired to notice novelty. From an evolutionary standpoint, sudden changes in our auditory environment signal potential threats. So, every time the song changes, a small part of your brain is pulled out of your work to process the new auditory information. This constant micro-context-switching prevents you from ever sinking fully into a flow state.</p>

          <h2>How Looping Audio Hacks the Brain</h2>
          <p>When you put a single track on an infinite loop, something magical happens around the third or fourth repetition. The music stops being a focal point and becomes a predictable, ambient texture.</p>
          
          <p>Because the brain knows exactly what is coming next, it stops allocating cognitive resources to analyzing the audio. The music fades into the background, acting as an acoustic shield that blocks out unpredictable environmental noises (like a coworker talking or a siren outside) without demanding any attention itself.</p>

          <div style="background: rgba(139, 92, 246, 0.1); border-left: 4px solid var(--primary-color); padding: 1.5rem; margin: 2rem 0; border-radius: 0 var(--radius-md) var(--radius-md) 0;">
            <h3 style="margin-top: 0; font-size: 1.1rem; color: var(--primary-color);">The Video Game Connection</h3>
            <p style="margin-bottom: 0; font-size: 1rem; color: var(--text-secondary);">This is exactly why video game soundtracks are so effective for studying. Composers like Koji Kondo (Super Mario, Zelda) intentionally design video game music to be looped infinitely in the background without becoming irritating. The music is designed to foster focus and drive the player forward without distracting them from the task at hand.</p>
          </div>

          <h2>Finding Your Focus Track</h2>
          <p>Not all music works for looping. Tracks with heavy, comprehensible lyrics are generally poor choices, as the language centers of your brain will constantly try to process the words. The best tracks for looping are usually:</p>
          
          <ul>
            <li><strong>Video Game Soundtracks:</strong> (e.g., Skyrim, Donkey Kong Country, SimCity).</li>
            <li><strong>Lo-Fi Hip Hop:</strong> Predictable, repetitive beats with gentle instrumentation.</li>
            <li><strong>Ambient/Drone:</strong> Continuous sonic textures without distinct melodies.</li>
            <li><strong>Brown Noise:</strong> A deeper, more pleasant alternative to white noise that mimics the sound of heavy rainfall or a distant waterfall.</li>
          </ul>

          <p>YouTube is arguably the best repository on the internet for obscure video game soundtracks and atmospheric noise. The next time you are facing a difficult coding problem or a dense reading assignment, try ditching the Spotify shuffle button. Find a track that fades nicely into the background, throw it into <a href="../" style="color: var(--primary-color); font-weight: 500;">WatchOnRepeat</a> for an infinite, uninterrupted loop, and let the predictability carry you straight into the flow state.</p>
        </div>
      </article>
"""
    }
]

# Generate index.html for /blog/
blog_index = f"""
      <div class="blog-hero">
        <h1>Our Blogs</h1>
        <p>Deep dives into the psychology of learning, the science of skill mastery, and the art of deliberate practice.</p>
      </div>

      <div class="blog-grid">
        {"".join([f'''
        <div class="blog-card">
          <div class="blog-tag">{a['tag']}</div>
          <h2><a href="../blog/{a['slug']}">{a['title']}</a></h2>
          <p>{a['desc']}</p>
          <a href="../blog/{a['slug']}" class="read-more">Read Article <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i></a>
        </div>
        ''' for a in articles])}
      </div>
"""

def make_page(title, desc, content, slug=""):
    h = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', head_top, flags=re.DOTALL)
    h = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{desc}">', h, flags=re.DOTALL)
    h = re.sub(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{title}">', h, flags=re.DOTALL)
    h = re.sub(r'<meta property="og:description" content=".*?">', f'<meta property="og:description" content="{desc}">', h, flags=re.DOTALL)
    h = re.sub(r'<link rel="canonical" href=".*?">', f'<link rel="canonical" href="https://watchonrepeat.com/blog/{slug}">', h, flags=re.DOTALL)
    
    # Fix og:url and twitter tags
    h = re.sub(r'<meta property="og:url" content=".*?">', f'<meta property="og:url" content="https://watchonrepeat.com/blog/{slug}">', h, flags=re.DOTALL)
    h = re.sub(r'<meta name="twitter:title" content=".*?">', f'<meta name="twitter:title" content="{title}">', h, flags=re.DOTALL)
    h = re.sub(r'<meta name="twitter:description" content=".*?">', f'<meta name="twitter:description" content="{desc}">', h, flags=re.DOTALL)

    
    # We stripped out the main-content container to replace with full width for the blog hero
    # So we should close the main content wrapper cleanly if it's there, but actually we don't need the default main wrapper
    
    # Replace default main tag
    b = head_bottom.replace('<main class="main-content" style="padding-top: 2rem;">', '<main class="blog-main">')
    return h + b + content + '\n    </main>\n' + footer_bottom

# Save index
with open('blog/index.html', 'w', encoding='utf-8') as f:
    f.write(make_page("Blog - WatchOnRepeat", "Deep dives into the psychology of learning, the science of skill mastery, and the art of deliberate practice.", blog_index, ""))

# Save articles
for a in articles:
    with open(f"blog/{a['slug']}.html", 'w', encoding='utf-8') as f:
        f.write(make_page(a['title'], a['desc'], a['content'], a['slug']))

# Clean up old articles
if os.path.exists('blog/how-to-loop-youtube-videos-infinitely.html'):
    os.remove('blog/how-to-loop-youtube-videos-infinitely.html')
if os.path.exists('blog/best-listenonrepeat-alternatives-2026.html'):
    os.remove('blog/best-listenonrepeat-alternatives-2026.html')

print("Blog completely redesigned and rewritten successfully.")
