with open('c:/Users/devil/Documents/video loop site project/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    if '<main ' in line or '<main>' in line:
        stack.append('main')
    elif '</main>' in line:
        stack.pop()
    
    if 'seo-about-section' in line:
        print(f"At seo-about-section, main stack: {stack}")
