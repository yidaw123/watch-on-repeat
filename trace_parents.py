with open('c:/Users/devil/Documents/video loop site project/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

b = 0
open_divs = []
for i, line in enumerate(lines):
    idx = 0
    while True:
        o = line.find('<div', idx)
        c = line.find('</div', idx)
        if o == -1 and c == -1: break
        if o != -1 and (c == -1 or o < c):
            b += 1
            open_divs.append(i+1)
            idx = o + 4
        else:
            b -= 1
            if open_divs: open_divs.pop()
            idx = c + 5
    if i+1 == 899:
        print(f"At tab-up-next, open divs from lines: {open_divs}")
        break
