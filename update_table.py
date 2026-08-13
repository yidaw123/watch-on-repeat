import re

with open(r'c:\Users\devil\Documents\video loop site project\listenonrepeat-alternative.html', 'r', encoding='utf-8') as f:
    html = f.read()

# YouTubeLoop.net features:
# A/B Looping: Yes
# Multiple Loop Segments: No
# Built-in Audio Recorder: No
# Cloud Sync: No
# Video Notes: No
# History & Discovery: Yes
# Tempo Ramp: No
# Speed Control: Yes
# Keyboard Hotkeys: No
# Customizable Playlists: Yes
# Sharing Packaged Session: Yes
# Advanced Analytics: No
# 10+ Platforms: No
# Local Video/Audio Files: No

features = {
    "A/B Looping": True,
    "Multiple Loop Segments": False,
    "Built-in Audio Recorder": False,
    "Cloud Sync": False,
    "Video Notes": False,
    "History & Discovery": True,
    "Tempo Ramp": False,
    "Speed Control": True,
    "Keyboard Hotkeys": False,
    "Customizable Playlists": True,
    "Sharing Packaged Session": True,
    "Advanced Analytics": False,
    "10+ Platforms (Vimeo, FB, etc.)": False,
    "Local Video/Audio Files": False
}

def replacer(match):
    row_html = match.group(0)
    
    # Extract the feature name (first td)
    feature_match = re.search(r'<td>(.*?)</td>', row_html)
    if not feature_match: return row_html
    
    feature_name = feature_match.group(1).strip()
    
    if feature_name in features:
        is_yes = features[feature_name]
        icon = '<i data-lucide="check" class="check-icon"></i>' if is_yes else '<i data-lucide="x" class="x-icon"></i>'
        new_td = f'\n            <td>{icon}</td>'
        
        # Insert after the wor-column td
        return re.sub(r'(<td class="wor-column">.*?</td>)', r'\1' + new_td, row_html, count=1, flags=re.DOTALL)
    
    return row_html

# Replace header
html = html.replace('<th>LoopingTube</th>', '<th>YouTubeLoop.net</th>\n            <th>LoopingTube</th>')

# Replace rows
html = re.sub(r'<tr>\s*<td>.*?</tr>', replacer, html, flags=re.DOTALL)

with open(r'c:\Users\devil\Documents\video loop site project\listenonrepeat-alternative.html', 'w', encoding='utf-8') as f:
    f.write(html)
