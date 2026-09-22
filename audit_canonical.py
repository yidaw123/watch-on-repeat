import os
import glob
from bs4 import BeautifulSoup

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

public_htmls = [p for p in html_files if os.path.basename(p) not in test_pages]

print("\n--- CANONICAL URL CHECK ---")
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

    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    soup = BeautifulSoup(content, 'html.parser')
    
    canonical = soup.find('link', rel='canonical')
    if canonical:
        href = canonical.get('href')
        if href != expected_url and href != expected_url + '/':
            print(f"WRONG Canonical in {p}: expected {expected_url}, got {href}")
    else:
        print(f"MISSING Canonical in {p}")
