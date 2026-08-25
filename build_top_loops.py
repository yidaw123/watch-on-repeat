import re

# We want to extract just the head/header and the footer.
# But we don't want the left/right ad gutters from index.html for this page, we want it full width like the blog.
# Actually, the cleanest way is to use the exact same template logic as the blog, which uses guide.html!

with open('guide.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find split points (youtube-looper uses the simpler layout)
head_split = html.find('</head>')
main_split = html.find('<main class="main-content"')
footer_split = html.find('<footer class="site-footer"')

head_content = html[:main_split]
footer_content = html[footer_split:]

# Replace title and description in head
head_content = re.sub(r'<title>.*?</title>', '<title>Top Loops & Shared Sessions - WatchOnRepeat</title>', head_content, flags=re.DOTALL)
head_content = re.sub(r'<meta name="description" content=".*?">', '<meta name="description" content="Discover the best curated video loops for guitar practice, language learning, coding, and more.">', head_content)

# Clean up header UI (we want the simple blog header)
new_header = """
    <header class="navbar">
      <div class="navbar-top" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <a href="/" class="brand" style="text-decoration: none; display: flex; align-items: center; gap: 0.75rem;">
          <img src="/logo.svg" alt="WatchOnRepeat Logo" style="width: 32px; height: 32px; object-fit: contain;">
          <span class="brand-name" style="font-size: 1.25rem;">Watch<span>On</span>Repeat</span>
        </a>
        <a href="/" class="btn btn-primary" style="padding: 0.5rem 1.25rem; font-weight: 600; font-size: 0.9rem; text-decoration: none; white-space: nowrap;">Launch App</a>
      </div>
    </header>
"""
head_content = re.sub(r'<header class="navbar.*?</header>', new_header, head_content, flags=re.DOTALL)

# Also need to load Supabase JS if it's not in head
if "supabase-js" not in head_content:
    head_content = head_content.replace('</head>', '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>\n</head>')

main_content = """
<main style="max-width: 1200px; margin: 0 auto; padding: 2rem; min-height: 80vh;">
  <div style="text-align: center; margin-bottom: 4rem; padding: 4rem 1rem; background: radial-gradient(circle at top, rgba(99, 102, 241, 0.15) 0%, transparent 60%);">
    <h1 style="font-size: 3rem; font-weight: 900; margin-bottom: 1rem; color: var(--text-primary); letter-spacing: -1px;">Top Loops & <span style="background: linear-gradient(135deg, #a855f7, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Shared Sessions</span></h1>
    <p style="font-size: 1.25rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto;">Discover how others are using WatchOnRepeat to master skills, learn languages, and find their flow state.</p>
  </div>

  <!-- Curated Examples Section -->
  <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 1.5rem; color: var(--text-bright); display: flex; align-items: center; gap: 0.75rem;">
    <i data-lucide="star" style="color: #f59e0b;"></i> Curated Examples
  </h2>
  
  <style>
    @media (min-width: 900px) {
      .top-loops-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
    }
  </style>
  
  <div class="top-loops-grid" style="display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 5rem;">
    
    <!-- 1. Guitar -->
    <a href="/?v=BBz-Jyr23M4&p=youtube&start=120&end=145" style="display: block; text-decoration: none; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary-color)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='none';">
      <img src="https://img.youtube.com/vi/BBz-Jyr23M4/hqdefault.jpg" style="width: 100%; height: 200px; object-fit: cover;" alt="Guitar Tutorial Loop">
      <div style="padding: 1.5rem;">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
          <span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">YouTube</span>
          <span style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">GUITAR</span>
        </div>
        <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 0.5rem;">Master the Pentatonic Scale</h3>
        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5;">Loop this 25-second solo section at 75% speed to build muscle memory and nail the timing perfectly.</p>
      </div>
    </a>

    <!-- 2. Dance -->
    <a href="/?v=knGYfOCjc6Q&p=youtube&start=45&end=60" style="display: block; text-decoration: none; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary-color)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='none';">
      <img src="https://img.youtube.com/vi/knGYfOCjc6Q/hqdefault.jpg" style="width: 100%; height: 200px; object-fit: cover;" alt="Dance Choreography Loop">
      <div style="padding: 1.5rem;">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
          <span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">YouTube</span>
          <span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">DANCE</span>
        </div>
        <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 0.5rem;">Step-by-Step Choreography</h3>
        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5;">Learn complex routines safely. Loop this 15-second instructional segment at half-speed until you nail the footwork.</p>
      </div>
    </a>

    <!-- 3. English Learning -->
    <a href="/?v=9917PU7CPzg&p=youtube&start=180&end=195" style="display: block; text-decoration: none; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary-color)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='none';">
      <img src="https://img.youtube.com/vi/9917PU7CPzg/hqdefault.jpg" style="width: 100%; height: 200px; object-fit: cover;" alt="English Pronunciation Loop">
      <div style="padding: 1.5rem;">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
          <span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">YouTube</span>
          <span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">LANGUAGE</span>
        </div>
        <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 0.5rem;">Shadowing English Pronunciation</h3>
        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5;">Improve your accent by using the "shadowing" technique—listen to this native speaker phrase and repeat it constantly.</p>
      </div>
    </a>

    <!-- 4. Gaming -->
    <a href="/?v=HKqhMssvwMI&p=youtube&start=120&end=145" style="display: block; text-decoration: none; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary-color)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='none';">
      <img src="https://img.youtube.com/vi/HKqhMssvwMI/hqdefault.jpg" style="width: 100%; height: 200px; object-fit: cover;" alt="League of Legends Tutorial Loop">
      <div style="padding: 1.5rem;">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
          <span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">YouTube</span>
          <span style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">GAMING</span>
        </div>
        <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 0.5rem;">Learn League of Legends</h3>
        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5;">Loop specific strategies and mechanics from the top-watched LoL tutorials until you understand the game flow completely.</p>
      </div>
    </a>

    <!-- 5. Coding -->
    <a href="/?v=ix9cRaBkVe0&p=youtube&start=300&end=330" style="display: block; text-decoration: none; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary-color)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='none';">
      <img src="https://img.youtube.com/vi/ix9cRaBkVe0/hqdefault.jpg" style="width: 100%; height: 200px; object-fit: cover;" alt="Python Coding Tutorial Loop">
      <div style="padding: 1.5rem;">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
          <span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">YouTube</span>
          <span style="background: rgba(236, 72, 153, 0.1); color: #ec4899; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">PROGRAMMING</span>
        </div>
        <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 0.5rem;">Master Python Concepts</h3>
        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5;">Sometimes you need to hear an explanation three times before it clicks. Loop this complex Python tutorial until you fully grasp it.</p>
      </div>
    </a>

    <!-- 6. SoundCloud LoFi -->
    <a href="/?v=chillhopdotcom/sets/lofihiphop&p=soundcloud" style="display: block; text-decoration: none; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary-color)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='none';">
      <div style="width: 100%; height: 200px; background: linear-gradient(135deg, #ff5500 0%, #ff8800 100%); display: flex; align-items: center; justify-content: center; color: white;">
        <i data-lucide="music" style="width: 48px; height: 48px;"></i>
      </div>
      <div style="padding: 1.5rem;">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
          <span style="background: rgba(255, 85, 0, 0.1); color: #ff5500; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">SoundCloud</span>
          <span style="background: rgba(14, 165, 233, 0.1); color: #0ea5e9; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">AMBIENCE</span>
        </div>
        <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 0.5rem;">Endless LoFi Study Focus</h3>
        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5;">Put on your headphones, loop this chill ambient SoundCloud track, and enter a state of deep work and focus.</p>
      </div>
    </a>
  </div>

  <!-- Shared Loops Feed Section -->
  <hr style="border: 0; border-top: 1px solid var(--border-color); margin-bottom: 3rem;">
  
  <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 1.5rem; color: var(--text-bright); display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <i data-lucide="users" style="color: #6366f1;"></i> Recently Shared Sessions
    </div>
    <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 16px;">Live Feed</span>
  </h2>
  
  <p style="color: var(--text-secondary); margin-bottom: 2rem;">Explore packaged sessions created and shared by the community. Click any loop to instantly load their video, timestamps, and settings.</p>

  <div id="shared-loops-feed" style="display: flex; flex-direction: column; gap: 1rem;">
    <!-- Populated by JS -->
    <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
      <i data-lucide="loader" class="spin" style="margin-bottom: 1rem; display: inline-block;"></i>
      <p>Loading recent community loops...</p>
    </div>
  </div>

</main>

<script>
  // Add simple spin animation class if not exists
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .spin { animation: spin 2s linear infinite; }
  `;
  document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    const feedContainer = document.getElementById('shared-loops-feed');
    
    // Supabase credentials
    const SUPABASE_URL = 'https://golkbcdlxpojjwqtyuzn.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_e1gQuU0n8FofmTkitqTEQQ_pi1g8fqD';
    
    if (typeof supabase === 'undefined') {
      feedContainer.innerHTML = '<p style="color: #ef4444; padding: 2rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">Error: Supabase client library failed to load.</p>';
      return;
    }

    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    try {
      // Fetch 20 most recent public instances
      const { data, error } = await supabaseClient
        .from('video_instances')
        .select('*')
        .neq('platform', 'local') // Exclude local files since they can't be shared
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        feedContainer.innerHTML = '<p style="padding: 2rem; background: rgba(255,255,255,0.02); border-radius: 8px; text-align: center;">No shared sessions found yet. Be the first to share one!</p>';
        return;
      }

      feedContainer.innerHTML = ''; // Clear loading state
      
      data.forEach(instance => {
        const date = new Date(instance.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        
        let thumbUrl = '';
        if (instance.platform === 'youtube') {
          thumbUrl = `https://img.youtube.com/vi/${instance.video_id}/mqdefault.jpg`;
        } else {
          thumbUrl = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='60' viewBox='0 0 90 60'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%238b5cf6'/><stop offset='100%' stop-color='%23ec4899'/></linearGradient></defs><rect width='90' height='60' fill='url(%23g)' opacity='0.85'/><text x='45' y='35' font-family='Outfit,sans-serif' font-size='10' font-weight='bold' fill='white' text-anchor='middle'>${instance.platform.toUpperCase()}</text></svg>`;
        }
        
        const title = instance.video_title || `Shared ${instance.platform} session`;
        const url = `/?instance=${instance.id}`;
        
        const card = document.createElement('a');
        card.href = url;
        card.style.cssText = "display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 12px; text-decoration: none; color: inherit; transition: background 0.2s;";
        card.onmouseover = () => { card.style.background = 'rgba(255,255,255,0.05)'; };
        card.onmouseout = () => { card.style.background = 'rgba(255,255,255,0.02)'; };
        
        card.innerHTML = `
          <img src="${thumbUrl}" alt="Thumbnail" style="width: 120px; height: 68px; object-fit: cover; border-radius: 6px; background: #000;">
          <div style="flex: 1; min-width: 0;">
            <h4 style="font-size: 1.1rem; color: var(--text-primary); margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</h4>
            <div style="display: flex; gap: 0.75rem; font-size: 0.85rem; color: var(--text-muted);">
              <span style="text-transform: capitalize;"><i data-lucide="video" style="width: 14px; height: 14px; display: inline; margin-right: 4px; vertical-align: -2px;"></i>${instance.platform}</span>
              <span>&bull;</span>
              <span><i data-lucide="calendar" style="width: 14px; height: 14px; display: inline; margin-right: 4px; vertical-align: -2px;"></i>${date}</span>
            </div>
          </div>
          <div style="padding-left: 1rem;">
            <div style="background: rgba(99, 102, 241, 0.1); color: #6366f1; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <i data-lucide="play" style="width: 20px; height: 20px; margin-left: 2px;"></i>
            </div>
          </div>
        `;
        
        feedContainer.appendChild(card);
      });
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      
    } catch (err) {
      console.error(err);
      feedContainer.innerHTML = '<p style="color: #ef4444; padding: 2rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">Failed to load shared sessions. Please try again later.</p>';
    }
  });
</script>
"""

with open('top-loops.html', 'w', encoding='utf-8') as f:
    f.write(head_content + main_content + footer_content)

print("Generated top-loops.html")
