import glob

root_pages = ['index.html', 'about.html', 'guide.html', 'music-practice.html', 'language-learning.html', 'youtube-study-tool.html', 'listenonrepeat-alternative.html', 'top-loops.html', 'contact.html', 'privacy.html', 'terms.html']

script_tag = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7515114786845929" crossorigin="anonymous"></script>'

for page in root_pages:
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if script_tag in content:
        content = content.replace(script_tag + '\n', '')
        content = content.replace(script_tag, '')
        with open(page, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {page}')
