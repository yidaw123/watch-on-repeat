with open('c:/Users/devil/Documents/video loop site project/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

b = 0
for i, line in enumerate(lines):
    opens_main = line.count('<main')
    closes_main = line.count('</main>')
    b += opens_main - closes_main
    if 'seo-about-section' in line:
        print(f"Line {i+1}: {line.strip()} | main tag balance: {b}")
