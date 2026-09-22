import glob

issues = []
for f in glob.glob('**/*.html', recursive=True):
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
            if 'node_modules' in f or 'test' in f.lower() or f.startswith('edge_output') or 'error_catcher' in f or 'playwright' in f:
                continue
            if 'rel="icon"' not in content and "rel='icon'" not in content and 'rel="shortcut icon"' not in content:
                issues.append(f)
    except:
        pass
print("Files missing favicon:", issues)
