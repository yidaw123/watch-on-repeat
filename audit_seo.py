import os
import glob
from bs4 import BeautifulSoup
import re

root_dir = r"c:\Users\devil\Documents\video loop site project"
sitemap_path = os.path.join(root_dir, 'sitemap.xml')

test_pages = {
    'dm_test.html', 'test.html', 'test_error.html', 'test_fb_img.html', 
    'downloader.html', 'error_catcher.html', 'standalone_dm.html', 
    'edge_output.html', 'logo_generator.html', 'index_v7.html'
}

html_files = []
for p in glob.glob(os.path.join(root_dir, '*.html')) + glob.glob(os.path.join(root_dir, 'blog', '*.html')) + glob.glob(os.path.join(root_dir, 'watch', '*.html')):
    html_files.append(p)

public_htmls = []
for p in html_files:
    filename = os.path.basename(p)
    if filename not in test_pages:
        public_htmls.append(p)

with open(sitemap_path, 'r', encoding='utf-8') as f:
    sitemap_content = f.read()
soup_sitemap = BeautifulSoup(sitemap_content, 'xml')
sitemap_urls = [loc.text.strip() for loc in soup_sitemap.find_all('loc')]

print("--- SITEMAP COMPLETENESS ---")
for p in public_htmls:
    rel_path = os.path.relpath(p, root_dir).replace('\\', '/')
    if rel_path == 'index.html':
        expected_url = 'https://watchonrepeat.com/'
    elif rel_path == 'blog/index.html':
        expected_url = 'https://watchonrepeat.com/blog/'
    elif rel_path.endswith('/index.html'):
        expected_url = 'https://watchonrepeat.com/' + rel_path[:-11]
    else:
        expected_url = 'https://watchonrepeat.com/' + rel_path.replace('.html', '')
    
    if expected_url not in sitemap_urls and expected_url + '/' not in sitemap_urls:
        print(f"MISSING in sitemap: {p} (Expected: {expected_url})")

for tp in test_pages:
    for url in sitemap_urls:
        if tp.replace('.html', '') in url and url != 'https://watchonrepeat.com/':
            print(f"TEST PAGE in sitemap: {tp} -> {url}")

print("\n--- SEO TAGS ---")
canonicals = {}
titles = {}
descriptions = {}

for p in public_htmls:
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    soup = BeautifulSoup(content, 'html.parser')
    
    rel_path = os.path.relpath(p, root_dir).replace('\\', '/')
    
    # canonical
    canonical = soup.find('link', rel='canonical')
    if not canonical:
        print(f"MISSING canonical: {p}")
    else:
        href = canonical.get('href')
        if href in canonicals:
            print(f"DUPLICATE canonical: {href} in {p} and {canonicals[href]}")
        canonicals[href] = p

    # title
    title = soup.find('title')
    if not title or not title.text.strip():
        print(f"MISSING title: {p}")
    else:
        t = title.text.strip()
        if t in titles:
            print(f"DUPLICATE title: '{t}' in {p} and {titles[t]}")
        titles[t] = p

    # description
    desc = soup.find('meta', attrs={'name': 'description'})
    if not desc or not desc.get('content', '').strip():
        print(f"MISSING description: {p}")
    else:
        d = desc.get('content', '').strip()
        if len(d) < 150 or len(d) > 160:
            print(f"DESCRIPTION length {len(d)} (should be 150-160): {p}")
        if d in descriptions:
            print(f"DUPLICATE description: '{d}' in {p} and {descriptions[d]}")
        descriptions[d] = p

    # og/twitter
    required_meta = {
        'og:title': {'property': 'og:title'},
        'og:description': {'property': 'og:description'},
        'og:image': {'property': 'og:image'},
        'og:url': {'property': 'og:url'},
        'twitter:title': {'name': 'twitter:title'},
        'twitter:description': {'name': 'twitter:description'}
    }
    for name, attrs in required_meta.items():
        tag = soup.find('meta', attrs=attrs)
        if not tag or not tag.get('content', '').strip():
            print(f"MISSING {name}: {p}")

    # structured data
    ld_json = soup.find('script', type='application/ld+json')
    if not ld_json:
        print(f"MISSING JSON-LD structured data: {p}")
