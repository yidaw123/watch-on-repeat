with open('c:/Users/devil/Documents/video loop site project/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

b = 0
for i, line in enumerate(lines):
    if 'id="tab-recorded-audio"' in line: b = 0
    opens = line.count('<div')
    closes = line.count('</div')
    b += opens - closes
    if 'id="tab-recorded-audio"' in line or 'id="tab-notes"' in line or 'id="tab-up-next"' in line or 'id="tab-favorites"' in line or 'id="tab-playlists"' in line or 'id="tab-saved-sessions"' in line or 'id="tab-history"' in line:
        print(f"Line {i+1}: {line.strip()} | Balance BEFORE this tab next: {b - (opens-closes)}")
