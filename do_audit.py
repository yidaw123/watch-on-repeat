import os
import glob
import re
from bs4 import BeautifulSoup

project_dir = r"c:\Users\devil\Documents\video loop site project"
html_files = [
    "index.html", "about.html", "guide.html", "music-practice.html", 
    "language-learning.html", "youtube-study-tool.html", 
    "listenonrepeat-alternative.html", "top-loops.html", 
    "contact.html", "privacy.html", "terms.html", 
    "blog/index.html"
]

# Add a couple of blog articles
blog_files = glob.glob(os.path.join(project_dir, "blog", "*.html"))
blog_articles = [f for f in blog_files if os.path.basename(f) != "index.html"][:3]
html_files.extend([os.path.relpath(f, project_dir) for f in blog_articles])

results = []

def add_issue(severity, file, issue, snippet=""):
    results.append(f"[{severity}] {file}: {issue}\nSnippet: {snippet}\n")

for file in html_files:
    filepath = os.path.join(project_dir, file)
    if not os.path.exists(filepath):
        add_issue("CRITICAL", file, "File not found")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        soup = BeautifulSoup(content, 'html.parser')
        
        # 2. Navbar consistency
        # Assuming navbar has logo and Launch App button
        header = soup.find('header') or soup.find('nav')
        if not header:
            add_issue("HIGH", file, "No <header> or <nav> found for navbar.")
        else:
            header_str = str(header).lower()
            if 'logo' not in header_str and 'navbar-brand' not in header_str:
                add_issue("MEDIUM", file, "Logo might be missing in navbar", str(header)[:100])
            if 'launch app' not in header_str:
                add_issue("HIGH", file, "'Launch App' button missing in navbar", str(header)[:100])
                
        # 3. Footer consistency
        footer = soup.find('footer')
        if not footer:
            add_issue("HIGH", file, "No <footer> found.")
        else:
            footer_text = footer.get_text().lower()
            required_links = ["about", "privacy", "terms", "contact", "advertise", "upgrade", "donate"]
            for link in required_links:
                if link not in footer_text:
                    add_issue("MEDIUM", file, f"Footer missing link: {link}")
            if "copyright" not in footer_text and "©" not in footer_text:
                add_issue("LOW", file, "Footer missing copyright notice")
                
        # 4. Responsive meta tag
        viewport = soup.find('meta', attrs={'name': 'viewport'})
        if not viewport or 'width=device-width' not in viewport.get('content', ''):
            add_issue("HIGH", file, "Missing or incorrect responsive viewport meta tag", str(viewport))
            
        # 5. CSS file references
        styles = soup.find_all('link', rel='stylesheet')
        has_style_css = False
        for style in styles:
            href = style.get('href', '')
            if 'style.css' in href:
                has_style_css = True
                if '?' not in href or 'v=' not in href:
                    add_issue("LOW", file, "style.css missing cache-buster", href)
        if not has_style_css:
            add_issue("HIGH", file, "Does not reference style.css")
            
        # 6. Font loading
        has_fonts = any('fonts.googleapis.com' in s.get('href', '') for s in styles) or \
                    any('fonts.gstatic.com' in s.get('href', '') for s in soup.find_all('link', rel='preconnect'))
        if not has_fonts:
            add_issue("LOW", file, "Might be missing Google Fonts reference")
            
        # 7. Favicon
        favicons = soup.find_all('link', rel='icon') + soup.find_all('link', rel='shortcut icon')
        if not favicons:
            add_issue("MEDIUM", file, "Missing favicon reference")

# Write results
with open(os.path.join(project_dir, 'audit_results.txt'), 'w', encoding='utf-8') as f:
    f.write("\n".join(results))

print("Audit script finished.")
