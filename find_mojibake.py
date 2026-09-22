import os

files = [
    'blog/the-psychology-of-flow-why-we-loop-songs.html',
    'blog/the-science-of-repetition-language-mastery.html',
    'blog/why-transcribing-by-ear-beats-reading-tabs.html'
]
for f in files:
    with open(f, 'r', encoding='utf-8', errors='ignore') as fh:
        content = fh.read()
    count = content.count('\ufffd')
    print(f"{f}: {count} replacement chars")
    idx = 0
    while True:
        pos = content.find('\ufffd', idx)
        if pos == -1: break
        start = max(0, pos-40)
        end = min(len(content), pos+40)
        snippet = content[start:end].replace('\n', ' ').replace('\ufffd', '[???]')
        print(f"  pos {pos}: {snippet}")
        idx = pos + 1