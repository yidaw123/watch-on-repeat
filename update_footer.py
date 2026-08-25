import glob
import re

files = glob.glob('*.html')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    old_pattern = r'Blogs</a>\s*</div>'
    new_replacement = 'Blogs</a> <span style="opacity:0.3">|</span>\n        <a href="/top-loops.html" style="margin: 0 0.5rem; color: var(--text-secondary); text-decoration: none; font-weight: bold;">Top Loops</a>\n      </div>'
    
    if re.search(old_pattern, content):
        content = re.sub(old_pattern, new_replacement, content)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
