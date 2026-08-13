with open('c:/Users/devil/Documents/video loop site project/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'id="tab-notes"' in line: start = i
    if 'id="tab-up-next"' in line: end = i

b = 0
for i in range(start, end+1):
    line = lines[i]
    opens = line.count('<div')
    closes = line.count('</div')
    b += opens - closes
    print(f'L{i+1} [{b}]: {line.strip()}')
