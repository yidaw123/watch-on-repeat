import os
import sys
import re

def main():
    if len(sys.argv) != 8:
        print("Usage: python publish_blog.py <slug> <title> <desc> <tag> <content_html> <date_str> <date_iso>")
        sys.exit(1)

    slug = sys.argv[1]
    title = sys.argv[2]
    desc = sys.argv[3]
    tag = sys.argv[4]
    content = sys.argv[5]
    date_str = sys.argv[6]
    date_iso = sys.argv[7]

    print(f"Publishing blog: {slug}")

    # 1. Create the new blog HTML file using an existing template
    template_path = 'blog/sports-coaching-film-room-tape-breakdown.html'
    if not os.path.exists(template_path):
        print(f"ERROR: Template file {template_path} not found!")
        sys.exit(1)

    with open(template_path, 'r', encoding='utf-8') as f:
        html = f.read()

    html = re.sub(r'<title>.*?</title>', f'<title>{title} | WatchOnRepeat Blog</title>', html)
    html = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{desc}">', html)
    html = re.sub(r'<link rel="canonical" href="https://watchonrepeat.com/blog/.*?">', f'<link rel="canonical" href="https://watchonrepeat.com/blog/{slug}">', html)
    html = re.sub(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{title}">', html)
    html = re.sub(r'<meta property="og:description" content=".*?">', f'<meta property="og:description" content="{desc}">', html)
    html = re.sub(r'<meta property="og:url" content="https://watchonrepeat.com/blog/.*?">', f'<meta property="og:url" content="https://watchonrepeat.com/blog/{slug}">', html)
    html = re.sub(r'<meta name="twitter:title" content=".*?">', f'<meta name="twitter:title" content="{title}">', html)
    html = re.sub(r'<meta name="twitter:description" content=".*?">', f'<meta name="twitter:description" content="{desc}">', html)
    html = re.sub(r'"headline": ".*?"', f'"headline": "{title}"', html)
    html = re.sub(r'"description": ".*?"', f'"description": "{desc}"', html)
    html = re.sub(r'"datePublished": ".*?"', f'"datePublished": "{date_iso}"', html)
    html = re.sub(r'"dateModified": ".*?"', f'"dateModified": "{date_iso}"', html)
    html = re.sub(r'"url": "https://watchonrepeat.com/blog/.*?"', f'"url": "https://watchonrepeat.com/blog/{slug}"', html)

    html = re.sub(r'<div class="blog-tag">.*?</div>', f'<div class="blog-tag">{tag}</div>', html, count=1)
    html = re.sub(r'<h1>.*?</h1>', f'<h1>{title}</h1>', html, count=1)
    html = re.sub(r'<span>(January|February|March|April|May|June|July|August|September|October|November|December).*?202\d</span>', f'<span>{date_str}</span>', html, count=1)

    # Replace article content robustly
    new_html, count = re.subn(r'<div class="article-content">[\s\S]*?</div>\s*<footer class="site-footer"', f'<div class="article-content">\n{content}\n  </div>\n\n      <footer class="site-footer"', html)
    if count == 0:
        new_html, count = re.subn(r'<div class="article-content">[\s\S]*?</div>\s*<div class="article-footer">', f'<div class="article-content">\n{content}\n  </div>\n  <div class="article-footer">', html)
        if count == 0:
            print("ERROR: Failed to replace article content. Regex did not match.")
            sys.exit(1)
    html = new_html

    with open(f'blog/{slug}.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Created blog/{slug}.html")

    # 2. Update index.html
    with open('blog/index.html', 'r', encoding='utf-8') as f:
        idx = f.read()

    new_card = f'''
        <div class="blog-card">
          <div class="blog-tag" style="margin-bottom: 0.5rem;">{tag}</div>
          <div class="blog-date" style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">{date_str}</div>
          <h2><a href="../blog/{slug}">{title}</a></h2>
          <p>{desc}</p>
          <a href="../blog/{slug}" class="read-more">Read Article <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i></a>
        </div>
'''
    
    idx_new, count = re.subn(r'(<div[^>]*class=["\'][^"\']*blog-grid[^"\']*["\'][^>]*>)', r'\g<1>' + new_card, idx, count=1)
    if count == 0:
        print("ERROR: Could not find blog-grid in blog/index.html")
        sys.exit(1)
        
    with open('blog/index.html', 'w', encoding='utf-8') as f:
        f.write(idx_new)
    print("Updated blog/index.html")

    # 3. Update sitemap.xml
    with open('sitemap.xml', 'r', encoding='utf-8') as f:
        sm = f.read()

    new_sm = f'''  <url>
    <loc>https://watchonrepeat.com/blog/{slug}</loc>
    <lastmod>{date_iso}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>'''
    
    sm_new, count = re.subn(r'</urlset>', f'{new_sm}\n</urlset>', sm)
    if count == 0:
        print("ERROR: Could not find </urlset> in sitemap.xml")
        sys.exit(1)
        
    with open('sitemap.xml', 'w', encoding='utf-8') as f:
        f.write(sm_new)
    print("Updated sitemap.xml")

    print("SUCCESS: Blog published successfully.")

if __name__ == "__main__":
    main()
