import os
import re

html_files = []
for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or 'playwright' in root or 'test-results' in root:
        continue
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f).replace('\\', '/'))

all_links = set()
dead_links = []

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    links = re.findall(r'href=["\'](/[^"\']+)["\']', content)
    for link in links:
        if link.startswith('//'): continue
        
        # resolve target
        target = link.lstrip('/')
        if '?' in target:
            target = target.split('?')[0]
        if '#' in target:
            target = target.split('#')[0]
            
        if not target:
            target = 'index.html'
        elif target.endswith('/'):
            target += 'index.html'
        elif not target.endswith('.html') and not target.endswith('.json') and not target.endswith('.css') and not target.endswith('.png') and not target.endswith('.ico') and not target.endswith('.svg') and not target.endswith('.js') and not target.endswith('.xml'):
            target += '.html'
            
        if not os.path.exists(target):
            dead_links.append((filepath, link, target))

if not dead_links:
    print("NO DEAD LINKS FOUND!")
else:
    for f, l, t in set(dead_links):
        print(f"Dead link in {f}: {l} (Expected file: {t})")