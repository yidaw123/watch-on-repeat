import re, os

pages = {
    'index.html': 'Homepage',
    'about.html': 'About',
    'privacy.html': 'Privacy',
    'terms.html': 'Terms',
    'contact.html': 'Contact',
    'guide.html': 'Guide',
    'youtube-looper.html': 'YouTube Looper',
    'music-practice.html': 'Music Practice',
    'language-learning.html': 'Language Learning',
    'youtube-study-tool.html': 'Study Tool',
    'listenonrepeat-alternative.html': 'ListenOnRepeat Alt',
    'blog/index.html': 'Blog Index',
    'blog/the-science-of-repetition-language-mastery.html': 'Blog: Repetition',
    'blog/why-the-10000-hour-rule-is-wrong.html': 'Blog: 10k Hours',
    'blog/why-transcribing-by-ear-beats-reading-tabs.html': 'Blog: Transcribing',
    'blog/the-psychology-of-flow-why-we-loop-songs.html': 'Blog: Flow State',
}

for filepath, label in pages.items():
    if not os.path.exists(filepath):
        print(f'{label:25} | MISSING')
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # Strip tags to get text
    text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    text = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    words = len(text.split())

    has_title = bool(re.search(r'<title>.+</title>', html))
    has_desc = bool(re.search(r'meta name="description"', html))
    has_ga = 'G-E9NYZYJL0D' in html
    has_canonical = bool(re.search(r'rel="canonical"', html))
    has_noindex = 'noindex' in html.lower()

    flags = []
    if not has_title: flags.append('NO_TITLE')
    if not has_desc: flags.append('NO_DESC')
    if not has_ga: flags.append('NO_GA')
    if not has_canonical: flags.append('NO_CANONICAL')
    if has_noindex: flags.append('NOINDEX!')
    if words < 300: flags.append('THIN(<300w)')

    flag_str = ', '.join(flags) if flags else 'OK'
    print(f'{label:25} | {words:5} words | {flag_str}')
