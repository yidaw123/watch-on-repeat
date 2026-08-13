import re

with open(r'c:\Users\devil\Documents\video loop site project\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

tabs = ['analytics', 'saved-loops', 'recorded-audio', 'notes', 'favorites', 'playlists', 'saved-sessions', 'history']

for tab in tabs:
    # Find the div block for each tab
    match = re.search(f'<div[^>]*id="tab-{tab}"[^>]*>(.*?)</div>\\s*<!--', html, re.DOTALL)
    if match:
        print(f"--- tab-{tab} ---")
        content = match.group(1).strip()
        print(content[:300] + ('...' if len(content) > 300 else ''))

