import glob

files = glob.glob('*.html')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We want to replace <a href="/blog/" ...>Blogs</a></div> with the new version
    # Since whitespace might differ, let's use replace on a smaller chunk
    old = 'Blogs</a>\n      </div>'
    new = 'Blogs</a> <span style="opacity:0.3">|</span>\n          <a href="/top-loops.html" style="margin: 0 0.5rem; color: var(--text-secondary); text-decoration: none; font-weight: bold;">Top Loops</a>\n      </div>'
    
    if old in content:
        content = content.replace(old, new)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
