import os
import re

# Read current build_blog.py
with open('build_blog.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Blockquote attribution
content = content.replace(
    '<blockquote>"The journey to mastery is not a straight line of accumulated hours; it is a staircase built on focused, uncomfortable moments of conscious effort."</blockquote>',
    '<blockquote>"The journey to mastery is not a straight line of accumulated hours; it is a staircase built on focused, uncomfortable moments of conscious effort." — <em>The Editorial Team</em></blockquote>'
)

# Fix Editorial Team to WatchOnRepeat Team
content = content.replace('By The Editorial Team', 'By the WatchOnRepeat Team')

# Fix footer links in python script
content = content.replace(
    'footer_bottom = template[footer_split:]',
    'footer_bottom = template[footer_split:]\n# Fix footer links\nfooter_bottom = footer_bottom.replace(\'href="/\', \'href="../\')'
)

# Fix breadcrumb links in articles
content = content.replace('<a href="/">Home</a> &gt; <a href="/blog/">Blog</a>', '<a href="../">Home</a> &gt; <a href="../blog/">Blog</a>')

# Fix breadcrumb links in index
content = content.replace('<a href="/">Home</a> &gt; Blog', '<a href="../">Home</a> &gt; Blog')

# Fix absolute links in blog index cards
content = content.replace('href="/blog/{a[\'slug\']}"', 'href="../blog/{a[\'slug\']}"')

# Add missing meta tags to make_page function
meta_replacements = """    h = re.sub(r'<link rel="canonical" href=".*?">', f'<link rel="canonical" href="https://watchonrepeat.com/blog/{slug}">', h, flags=re.DOTALL)
    
    # Fix og:url and twitter tags
    h = re.sub(r'<meta property="og:url" content=".*?">', f'<meta property="og:url" content="https://watchonrepeat.com/blog/{slug}">', h, flags=re.DOTALL)
    h = re.sub(r'<meta name="twitter:title" content=".*?">', f'<meta name="twitter:title" content="{title}">', h, flags=re.DOTALL)
    h = re.sub(r'<meta name="twitter:description" content=".*?">', f'<meta name="twitter:description" content="{desc}">', h, flags=re.DOTALL)
"""

content = content.replace(
    '    h = re.sub(r\'<link rel="canonical" href=".*?">\', f\'<link rel="canonical" href="https://watchonrepeat.com/blog/{slug}">\', h, flags=re.DOTALL)',
    meta_replacements
)

with open('build_blog.py', 'w', encoding='utf-8') as f:
    f.write(content)
