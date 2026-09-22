import os
import re
from urllib.parse import urljoin, urlparse

html_files = []
for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or 'playwright' in root or 'test-results' in root:
        continue
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f).replace('\\', '/'))

dead_links = []

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    links = re.findall(r'href=["\']([^"\']+)["\']', content)
    for link in links:
        if link.startswith('http://') or link.startswith('https://') or link.startswith('//') or link.startswith('mailto:') or link.startswith('tel:'):
            continue
        
        # strip query/hash
        target = link.split('?')[0].split('#')[0]
        if not target:
            continue
            
        # resolve relative to root if it starts with /, otherwise relative to filepath dir
        if target.startswith('/'):
            target_path = target.lstrip('/')
        else:
            dir_path = os.path.dirname(filepath)
            # handle simple resolution (doesn't handle ../ perfectly but enough for flat structures)
            target_path = os.path.normpath(os.path.join(dir_path, target)).replace('\\', '/')
            if target_path.startswith('./'): target_path = target_path[2:]
            
        if not target_path:
            target_path = 'index.html'
        elif target_path.endswith('/'):
            target_path += 'index.html'
        elif not os.path.splitext(target_path)[1]:
            target_path += '.html'
            
        if not os.path.exists(target_path):
            dead_links.append((filepath, link, target_path))

if not dead_links:
    print("NO DEAD LINKS FOUND!")
else:
    for f, l, t in set(dead_links):
        print(f"Dead link in {f}: {l} (Expected file: {t})")