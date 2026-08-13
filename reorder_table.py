from bs4 import BeautifulSoup
import re

file_path = r'c:\Users\devil\Documents\video loop site project\listenonrepeat-alternative.html'

with open(file_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

soup = BeautifulSoup(html_content, 'html.parser')

# Find the competitor table
# It has a th with "LoopingTube" or "YouTubeLoop.net"
tables = soup.find_all('table', class_='comparison-table')
target_table = None
for table in tables:
    if table.find('th', string=re.compile('LoopingTube')):
        target_table = table
        break

if target_table:
    # Get the header row
    thead = target_table.find('thead')
    header_row = thead.find('tr')
    headers = header_row.find_all('th')
    
    # Extract names and keep their original index
    # Note: 0 is "Features", 1 is "WatchOnRepeat"
    # The competitors start at index 2
    competitors = []
    for i, th in enumerate(headers[2:]):
        competitors.append({
            'name': th.get_text(strip=True).lower(),
            'original_index': i + 2,
            'th_element': th
        })
    
    # Sort competitors alphabetically by their text
    competitors.sort(key=lambda x: x['name'])
    
    # Create the new column index mapping
    # index mapping maps new_index -> old_index
    index_mapping = [0, 1] + [c['original_index'] for c in competitors]
    
    # Reorder headers
    # Remove all ths first
    for th in headers:
        th.extract()
    
    # Append them back in the new order
    for old_idx in index_mapping:
        header_row.append(headers[old_idx])
        # add newline for formatting if it was there (BeautifulSoup handles it okay but let's just append)

    # Now reorder all rows in tbody
    tbody = target_table.find('tbody')
    for tr in tbody.find_all('tr'):
        tds = tr.find_all('td')
        if not tds: continue
        
        # Extract all tds
        for td in tds:
            td.extract()
            
        # Re-append in the new order
        for old_idx in index_mapping:
            tr.append(tds[old_idx])

    # Write back to file
    with open(file_path, 'w', encoding='utf-8') as f:
        # We need to make sure we don't mess up formatting completely, 
        # but bs4 might change formatting slightly. 
        # Alternatively, we can use the mapping to just do string manipulation if we want to preserve exact HTML formatting.
        pass
