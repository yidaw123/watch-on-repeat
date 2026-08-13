import re

file_path = r'c:\Users\devil\Documents\video loop site project\listenonrepeat-alternative.html'

with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

# We only want to apply this to the SECOND comparison-table (the competitor table)
# Let's find the section starting with "<h2>How We Compare to Competitors</h2>"
split_text = "<h2>How We Compare to Competitors</h2>"
parts = html.split(split_text)

if len(parts) == 2:
    table_html = parts[1]
    
    def process_tr(match):
        tr_content = match.group(0)
        
        # Find all th or td elements, including their leading/trailing whitespace if any
        # We'll use a regex to capture each cell (td or th) and the whitespace before it.
        # cells will be a list of the full strings (e.g. "            <th>Features</th>\n")
        
        # This regex matches whitespace followed by <th... or <td... up to </th or </td
        cells = re.findall(r'(?:\s*)<t[hd][^>]*>.*?</t[hd]>', tr_content, flags=re.DOTALL)
        
        if len(cells) == 8:
            old_indices = [0, 1, 5, 3, 4, 6, 7, 2]
            new_cells = [cells[i] for i in old_indices]
            
            # The TR itself might have leading/trailing things, so we rebuild the inside of the TR
            # Let's do it by replacing the inside of the TR
            # Just join the new cells
            inner_html = "".join(new_cells) + "\n          "
            # Return reconstructed tr
            return "<tr>\n" + "".join(new_cells) + "\n          </tr>"
        else:
            # Maybe it's a tr with different number of cells? Just return it
            return tr_content

    # Replace all <tr>...</tr> in the table
    new_table_html = re.sub(r'<tr>(.*?)</tr>', process_tr, table_html, flags=re.DOTALL)
    
    # Recombine
    final_html = parts[0] + split_text + new_table_html
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(final_html)
        print("Updated HTML written.")
else:
    print("Could not find competitor table section.")

