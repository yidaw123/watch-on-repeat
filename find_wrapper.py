with open('c:/Users/devil/Documents/video loop site project/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'id="ad-gutter-right"' in line:
        print(f"Right gutter starts at line {i+1}")
    if 'class="content-wrapper"' in line:
        print(f"Content wrapper starts at line {i+1}")
