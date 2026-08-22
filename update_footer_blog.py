import os
import glob

# Find all HTML files in the root
html_files = glob.glob('*.html')

for file in html_files:
    if file == 'edge_output.html':
        continue
        
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # We want to add Blog to the footer-seo-links
    # Looks like: <a href="/listenonrepeat-alternative" ...>ListenOnRepeat Alternative</a>
    if '<a href="/listenonrepeat-alternative"' in content and 'href="/blog/"' not in content:
        # Find the end of that tag
        insert_target = 'ListenOnRepeat Alternative</a>'
        if insert_target in content:
            new_html = 'ListenOnRepeat Alternative</a> <span style="opacity:0.3">|</span>\n        <a href="/blog/" style="margin: 0 0.5rem; color: var(--text-secondary); text-decoration: none;">Blog & Guides</a>'
            content = content.replace(insert_target, new_html)
            
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {file}")
