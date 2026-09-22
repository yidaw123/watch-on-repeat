import os
import re

# ============================================
# COMPREHENSIVE SITE AUDIT
# ============================================

issues = []

# 1. Dead internal links across ALL html files
html_files = []
for root, dirs, files in os.walk('.'):
    skip = False
    for s in ['node_modules', '.git', 'playwright', 'test-results']:
        if s in root:
            skip = True
    if skip:
        continue
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f).replace('\\', '/'))

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Check internal href links
    links = re.findall(r'href=["\'](/[^"\'#?]+)', content)
    for link in links:
        target = link.lstrip('/')
        if not target:
            target = 'index.html'
        elif target.endswith('/'):
            target += 'index.html'
        elif not '.' in os.path.basename(target):
            target += '.html'
        if not os.path.exists(target):
            issues.append(f"[DEAD LINK] {filepath} -> {link} (file {target} missing)")

    # Check internal src links (images, scripts)
    srcs = re.findall(r'src=["\'](/[^"\'#?]+)', content)
    for src in srcs:
        target = src.lstrip('/')
        if not os.path.exists(target):
            issues.append(f"[DEAD SRC] {filepath} -> {src} (file {target} missing)")

# 2. Check sitemap vs actual files
with open('sitemap.xml', 'r', encoding='utf-8') as f:
    sitemap = f.read()
sitemap_urls = re.findall(r'<loc>https://watchonrepeat\.com/?(.*?)</loc>', sitemap)
for url in sitemap_urls:
    if not url:
        target = 'index.html'
    elif url.endswith('/'):
        target = url + 'index.html'
    elif not '.' in os.path.basename(url):
        target = url + '.html'
    else:
        target = url
    if not os.path.exists(target):
        issues.append(f"[SITEMAP DEAD] sitemap.xml lists {url} but file {target} missing")

# 3. Check for pages that exist but are NOT in sitemap (public pages only)
public_pages = [
    'index.html', 'about.html', 'guide.html', 'music-practice.html',
    'language-learning.html', 'youtube-study-tool.html',
    'listenonrepeat-alternative.html', 'top-loops.html',
    'contact.html', 'privacy.html', 'terms.html'
]
for page in public_pages:
    slug = page.replace('.html', '')
    if slug == 'index':
        check = ''
    else:
        check = slug
    found = False
    for url in sitemap_urls:
        if url == check or url == check + '/':
            found = True
            break
    if not found:
        issues.append(f"[SITEMAP MISSING] {page} exists but is NOT in sitemap.xml")

# 4. Check blog articles vs sitemap
blog_files = []
for f in os.listdir('blog'):
    if f.endswith('.html') and f != 'index.html':
        blog_files.append(f)
for bf in blog_files:
    slug = bf.replace('.html', '')
    check = 'blog/' + slug
    found = False
    for url in sitemap_urls:
        if url == check or url == check + '/':
            found = True
            break
    if not found:
        issues.append(f"[SITEMAP MISSING] blog/{bf} exists but NOT in sitemap.xml")

# 5. Check each public page has canonical tag
for filepath in html_files:
    # skip test/internal files
    basename = os.path.basename(filepath)
    if basename in ['dm_test.html', 'test.html', 'test_error.html', 'test_fb_img.html',
                     'downloader.html', 'error_catcher.html', 'standalone_dm.html',
                     'edge_output.html', 'logo_generator.html', 'index_v7.html',
                     'contact-success.html']:
        continue
    if 'watch/' in filepath:
        continue
        
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    if 'rel="canonical"' not in content:
        issues.append(f"[NO CANONICAL] {filepath} is missing a canonical tag")

# 6. Check each public page has meta description
for filepath in html_files:
    basename = os.path.basename(filepath)
    if basename in ['dm_test.html', 'test.html', 'test_error.html', 'test_fb_img.html',
                     'downloader.html', 'error_catcher.html', 'standalone_dm.html',
                     'edge_output.html', 'logo_generator.html', 'index_v7.html',
                     'contact-success.html']:
        continue
    if 'watch/' in filepath:
        continue
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    if 'name="description"' not in content:
        issues.append(f"[NO META DESC] {filepath} is missing meta description")

# 7. Check each public page has <title>
for filepath in html_files:
    basename = os.path.basename(filepath)
    if basename in ['dm_test.html', 'test.html', 'test_error.html', 'test_fb_img.html',
                     'downloader.html', 'error_catcher.html', 'standalone_dm.html',
                     'edge_output.html', 'logo_generator.html', 'index_v7.html',
                     'contact-success.html']:
        continue
    if 'watch/' in filepath:
        continue
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    if '<title>' not in content:
        issues.append(f"[NO TITLE] {filepath} is missing <title> tag")

# 8. Check blog/index.html links to each article
with open('blog/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    blog_index = f.read()
for bf in blog_files:
    slug = bf.replace('.html', '')
    if slug not in blog_index:
        issues.append(f"[BLOG INDEX MISSING] blog/{bf} is not linked from blog/index.html")

# 9. Check robots.txt blocks test pages
with open('robots.txt', 'r', encoding='utf-8') as f:
    robots = f.read()
test_pages = ['dm_test.html', 'test.html', 'test_error.html', 'test_fb_img.html',
              'downloader.html', 'error_catcher.html', 'standalone_dm.html',
              'edge_output.html', 'logo_generator.html', 'index_v7.html']
for tp in test_pages:
    if tp not in robots:
        issues.append(f"[ROBOTS MISSING] {tp} is NOT blocked in robots.txt")

# 10. Check for duplicate canonical URLs
canonicals = {}
for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    m = re.search(r'rel="canonical"\s+href="([^"]+)"', content)
    if m:
        url = m.group(1)
        if url in canonicals:
            issues.append(f"[DUPLICATE CANONICAL] {filepath} and {canonicals[url]} share canonical: {url}")
        else:
            canonicals[url] = filepath

# REPORT
print("=" * 60)
print("COMPREHENSIVE SITE AUDIT REPORT")
print("=" * 60)
if not issues:
    print("\nZERO ISSUES FOUND. Site is clean.")
else:
    print(f"\n{len(issues)} ISSUE(S) FOUND:\n")
    for i in issues:
        print(f"  - {i}")
print("\n" + "=" * 60)