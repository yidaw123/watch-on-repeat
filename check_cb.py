import glob

issues = []
for f in glob.glob('**/*.html', recursive=True):
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
            if 'href="style.css"' in content or "href='style.css'" in content:
                issues.append(f)
    except:
        pass
print("Files missing cache buster:", issues)
