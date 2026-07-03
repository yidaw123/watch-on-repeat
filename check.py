import sys
import re

def check(file):
    text = open(file, 'r', encoding='utf-8').read()
    # remove strings
    text = re.sub(r'"[^"]*"', '', text)
    text = re.sub(r"'[^']*'", '', text)
    text = re.sub(r'`[^`]*`', '', text)
    # remove comments
    text = re.sub(r'//.*', '', text)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
    
    print(f"--- {file} ---")
    print(f"Parens: {text.count('(')} open, {text.count(')')} close")
    print(f"Brackets: {text.count('[')} open, {text.count(']')} close")
    print(f"Braces: {text.count('{')} open, {text.count('}')} close")
    print("")

check('app.js')
check('js/loops.js')
