import re

with open(r'c:\Users\devil\Documents\video loop site project\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Let's find where to insert renderNotes()
# I will insert it right before renderSavedNotesTab()
def replacer(match):
    return "renderNotes() {\n      if (this.notesManager) this.renderSavedNotesTab();\n    }\n\n    " + match.group(0)

js = re.sub(r'renderSavedNotesTab\(\) \{', replacer, js)

with open(r'c:\Users\devil\Documents\video loop site project\app.js', 'w', encoding='utf-8') as f:
    f.write(js)
