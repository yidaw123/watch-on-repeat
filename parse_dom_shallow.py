from html.parser import HTMLParser

class MyHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_sidebar = False
        self.depth = 0
        self.tree = []

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        cls = attr_dict.get('class', '')
        tag_id = attr_dict.get('id', '')
        
        if 'sidebar-card' in cls:
            self.in_sidebar = True
            
        if self.in_sidebar:
            indent = '  ' * self.depth
            info = f'{tag}'
            if tag_id: info += f' id=\"{tag_id}\"'
            if cls: info += f' class=\"{cls}\"'
            if self.depth < 3:
                self.tree.append(indent + '<' + info + '>')
            if tag not in ['img', 'input', 'br', 'hr', 'meta', 'link']:
                self.depth += 1

    def handle_endtag(self, tag):
        if self.in_sidebar:
            if tag not in ['img', 'input', 'br', 'hr', 'meta', 'link']:
                self.depth -= 1
            indent = '  ' * self.depth
            if self.depth < 3:
                self.tree.append(indent + '</' + tag + '>')
            if self.depth <= 0:
                self.in_sidebar = False

parser = MyHTMLParser()
with open('c:/Users/devil/Documents/video loop site project/index.html', 'r', encoding='utf-8') as f:
    parser.feed(f.read())

with open('c:/Users/devil/Documents/video loop site project/dom_tree_shallow.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(parser.tree))
