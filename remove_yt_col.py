import re

file_path = r'c:\Users\devil\Documents\video loop site project\listenonrepeat-alternative.html'

with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

split_text = "<h2>How We Compare to Competitors</h2>"
parts = html.split(split_text)

if len(parts) == 2:
    table_html = parts[1]
    
    def process_tr(match):
        tr_content = match.group(0)
        cells = re.findall(r'(?:\s*)<t[hd][^>]*>.*?</t[hd]>', tr_content, flags=re.DOTALL)
        
        # We need to find which index corresponds to YouTube in the header row
        # But we can just iterate through the cells. If it's the header row, YouTube is exactly '<th>YouTube</th>'
        # Actually, since it's the same index for every row (index 6 based on 0-7), we can just pop index 6.
        if len(cells) == 8:
            new_cells = cells[:6] + cells[7:]
            return "<tr>\n" + "".join(new_cells) + "\n          </tr>"
        else:
            return tr_content

    new_table_html = re.sub(r'<tr>(.*?)</tr>', process_tr, table_html, flags=re.DOTALL)
    
    final_html = parts[0] + split_text + new_table_html
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(final_html)
        print("Updated HTML written.")
