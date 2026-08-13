with open('c:/Users/devil/Documents/video loop site project/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

div_balance = 0
for i, line in enumerate(lines):
    opens = line.count('<div')
    closes = line.count('</div')
    div_balance += (opens - closes)
    if 'id="tab-' in line:
        print(f'Line {i+1}: {line.strip()} (Balance: {div_balance})')
print(f'Final balance: {div_balance}')
