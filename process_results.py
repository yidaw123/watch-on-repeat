import json
import re

with open('audit_results.json', 'r', encoding='utf-8') as f:
    results = json.load(f)

app_js_path = r"c:\Users\devil\Documents\video loop site project\app.js"
with open(app_js_path, 'r', encoding='utf-8') as f:
    app_js = f.read()

def find_func_in_app(func_name):
    return f"{func_name}(" in app_js or f"{func_name} =" in app_js or f"{func_name} " in app_js

dead_funcs = []
seen_funcs = set()
for h in results['html_handlers']:
    match = h['match']
    if match.startswith('app.'):
        func_name = match.split('.')[1].split('(')[0]
        if func_name not in seen_funcs:
            seen_funcs.add(func_name)
            if not find_func_in_app(func_name):
                dead_funcs.append(func_name)

print("Dead Functions in app.:", dead_funcs)

# Error handling - silent swallowing
silent_catches = []
for i, line in enumerate(app_js.split('\n')):
    if 'catch' in line and '{' in line and '}' in line:
        if re.search(r'catch\s*\([^)]*\)\s*\{\s*\}', line):
            silent_catches.append(i+1)

# Check missing error handling in supabase
missing_supabase_errors = []
for i, line in enumerate(app_js.split('\n')):
    if 'supabaseClient.from' in line:
        if '.error' not in line and not re.search(r'error\s*=', app_js.split('\n')[i:i+5]):
            missing_supabase_errors.append(i+1)

print("Silent catches lines:", silent_catches)
print("Supabase lines:", [s['line'] for s in results['supabase']])

# Check JSON.parse without try/catch
json_parse_lines = []
for i, line in enumerate(app_js.split('\n')):
    if 'JSON.parse' in line:
        json_parse_lines.append(i+1)

print("JSON parse lines:", json_parse_lines)
