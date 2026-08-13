with open('c:/Users/devil/Documents/video loop site project/youtubeloop.txt', 'r', encoding='utf-8') as f:
    html = f.read()
import re
scripts = re.findall(r'<script.*?src=[\'"](.*?)[\'"]', html)
for s in scripts:
    print(s)
