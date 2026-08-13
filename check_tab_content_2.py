import re

with open(r'c:\Users\devil\Documents\video loop site project\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

tabs = ['saved-loops', 'recorded-audio', 'notes', 'favorites', 'playlists', 'saved-sessions', 'history']

for tab in tabs:
    match = re.search(f'<div[^>]*id="tab-{tab}"[^>]*>(.*?)</div>\\s*(?:<!--|<div[^>]*id="tab-)', html, re.DOTALL)
    if match:
        print(f"--- tab-{tab} ---")
        content = match.group(1).strip()
        print(content[:400])

