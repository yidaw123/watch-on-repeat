import re

with open(r'c:\Users\devil\Documents\video loop site project\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace class="empty-state-list" with class="empty-state empty-state-list"
html = re.sub(r'class="empty-state-list(.*?)"', r'class="empty-state empty-state-list\1"', html)

with open(r'c:\Users\devil\Documents\video loop site project\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
