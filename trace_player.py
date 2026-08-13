with open('c:/Users/devil/Documents/video loop site project/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'class="player-column"' in line:
        print(f"Start player-column at {i+1}")
    if 'class="sidebar-column"' in line:
        print(f"Start sidebar-column at {i+1}")
