with open(r'c:\Users\devil\Documents\video loop site project\index.html', 'r', encoding='utf-8') as f:
    html = f.read()
import re
matches = re.finditer(r'<div[^>]*id="tab-([^"]+)"', html)
for m in matches:
    print(m.group(1))
