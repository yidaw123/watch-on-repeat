with open('c:/Users/devil/Documents/video loop site project/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '<main ' in line or '</main>' in line or 'player-column' in line or 'sidebar-column' in line or 'stats-dashboard-container' in line or 'seo-about-section' in line or 'faq-accordion' in line:
        print(f"{i+1}: {line.strip()}")
