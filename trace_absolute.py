with open('c:/Users/devil/Documents/video loop site project/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

b = 0
for i, line in enumerate(lines):
    opens = line.count('<div')
    closes = line.count('</div')
    b += opens - closes
    if 'id="tab-' in line:
        print(f"Line {i+1}: {line.strip()} | ABSOLUTE Balance: {b}")
