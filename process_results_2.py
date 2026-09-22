import json
import re

app_js_path = r"c:\Users\devil\Documents\video loop site project\app.js"
index_html_path = r"c:\Users\devil\Documents\video loop site project\index.html"

with open(app_js_path, 'r', encoding='utf-8') as f:
    app_js = f.read()

with open(index_html_path, 'r', encoding='utf-8') as f:
    index_html = f.read()

# 1. logEvent
log_events = []
for i, line in enumerate(app_js.split('\n')):
    if 'logEvent' in line:
        log_events.append({"line": i+1, "content": line.strip()})

# 2. openUpgradeModal
open_upgrade_modal = []
for i, line in enumerate(app_js.split('\n')):
    if 'openUpgradeModal' in line:
        open_upgrade_modal.append({"line": i+1, "content": line.strip()})

# 3. index.html handlers
html_handlers = []
for i, line in enumerate(index_html.split('\n')):
    matches = re.findall(r'on(?:click|change)="([^"]+)"', line, re.IGNORECASE)
    for m in matches:
        html_handlers.append({"line": i+1, "match": m, "content": line.strip()})
    
    matches2 = re.findall(r'app\.([a-zA-Z0-9_]+)', line)
    for m in matches2:
        html_handlers.append({"line": i+1, "match": "app."+m, "content": line.strip()})

def find_func_in_app(func_name):
    pattern = r'\b' + re.escape(func_name) + r'\s*(?:\(|:|=)'
    return re.search(pattern, app_js) is not None

dead_funcs = []
seen_funcs = set()
for h in html_handlers:
    match = h['match']
    if match.startswith('app.'):
        func_name = match.split('.')[1].split('(')[0]
        if func_name not in seen_funcs:
            seen_funcs.add(func_name)
            if not find_func_in_app(func_name):
                dead_funcs.append(func_name)

print("Dead Functions in app.:", dead_funcs)

# 4. catch blocks
silent_catches = []
lines = app_js.split('\n')
for i, line in enumerate(lines):
    if 'catch' in line:
        # check if it's empty
        if re.search(r'catch\s*\([^)]*\)\s*\{\s*\}', line) or (re.search(r'catch\s*\([^)]*\)\s*\{', line) and '}' in lines[i+1] and lines[i+1].strip() == '}'):
            silent_catches.append(i+1)

print("Silent catches lines:", silent_catches)

# 5. supabase queries
supabase_queries = []
for i, line in enumerate(lines):
    if 'supabaseClient.from' in line:
        # Check next few lines for error handling
        block = "\n".join(lines[i:i+3])
        if '.error' not in block and 'error' not in block:
            supabase_queries.append(i+1)

print("Supabase queries potentially missing error handling:", supabase_queries)

# 6. JSON.parse without try/catch
json_parse_lines = []
for i, line in enumerate(lines):
    if 'JSON.parse' in line:
        # check if there's a try block above it
        try_found = False
        for j in range(i, max(-1, i-10), -1):
            if 'try' in lines[j] and '{' in lines[j]:
                try_found = True
                break
        if not try_found:
            json_parse_lines.append(i+1)

print("JSON.parse without try/catch nearby:", json_parse_lines)

# Memory leaks
timers = []
for i, line in enumerate(lines):
    if 'setInterval' in line:
        timers.append(('setInterval', i+1))
    if 'setTimeout' in line:
        timers.append(('setTimeout', i+1))
    if 'addEventListener' in line:
        timers.append(('addEventListener', i+1))

print("Timers and event listeners:")
for t in timers:
    print(t)
