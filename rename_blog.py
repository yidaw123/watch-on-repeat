import os

with open('build_blog.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Navbar links
content = content.replace('text-decoration: none;">Blog</a>', 'text-decoration: none;">Blogs</a>')

# Replace Hero Title
content = content.replace('<h1>Our Blog</h1>', '<h1>Our Blogs</h1>')

# Replace HTML Page Title for index
content = content.replace("<title>Blog - WatchOnRepeat</title>", "<title>Blogs - WatchOnRepeat</title>")

# Replace Breadcrumbs
content = content.replace('&gt; <a href="../blog/">Blog</a>', '&gt; <a href="../blog/">Blogs</a>')
content = content.replace('&gt; Blog', '&gt; Blogs')

# Replace Twitter meta title
content = content.replace('content="Blog - WatchOnRepeat"', 'content="Blogs - WatchOnRepeat"')

# Note: We are keeping the URL path as /blog/ as requested, just changing the display text

with open('build_blog.py', 'w', encoding='utf-8') as f:
    f.write(content)
