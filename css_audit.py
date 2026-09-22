import os, re, glob
from bs4 import BeautifulSoup

project_dir = r'c:\Users\devil\Documents\video loop site project'
css_file = os.path.join(project_dir, 'style.css')

with open(css_file, 'r', encoding='utf-8') as f:
    css = f.read()

issues = []

open_braces = css.count('{')
close_braces = css.count('}')
if open_braces != close_braces:
    issues.append(f'CRITICAL: Unmatched braces in style.css. Open: {open_braces}, Close: {close_braces}')

# Basic syntax checks
if ';;' in css:
    issues.append('LOW: Double semicolons (;;) found in style.css')

# Look for common typos like `colr:`, `margin-top:;`
if re.search(r'[\w\-]+:\s*;', css):
    issues.append('MEDIUM: Empty property value found in style.css (e.g. `property: ;`)')

variables_to_check = ['--bg-primary', '--text-primary', '--color-primary']
for var in variables_to_check:
    if var not in css:
        issues.append(f'HIGH: Theme variable {var} not found in style.css')

z_indices = re.findall(r'z-index:\s*([^;]+);', css)
z_vals = []
for z in z_indices:
    try:
        z_vals.append(int(z.strip()))
    except:
        z_vals.append(z.strip())
issues.append(f'INFO: z-index values found in style.css: {sorted(list(set(str(v) for v in z_vals)))}')

blog_files = glob.glob(os.path.join(project_dir, 'blog', '*.html'))
blog_css_refs = []
for b in blog_files:
    with open(b, 'r', encoding='utf-8') as bf:
        soup = BeautifulSoup(bf.read(), 'html.parser')
        styles = soup.find_all('link', rel='stylesheet')
        for s in styles:
            href = s.get('href', '')
            if href not in blog_css_refs:
                blog_css_refs.append(href)

issues.append(f'INFO: CSS references in blog pages: {blog_css_refs}')

with open('css_audit_results.txt', 'w') as f:
    f.write('\n'.join(issues))
print("Done")
