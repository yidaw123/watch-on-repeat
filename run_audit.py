import os
import re
import json
from bs4 import BeautifulSoup

def is_mojibake_or_weird(text):
    if '\ufffd' in text or '???' in text:
        return True
    return False

def check_html_file(filepath, is_blog):
    issues = []
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            html_content = f.read()
    except Exception as e:
        return [{"severity": "CRITICAL", "file": filepath, "issue": f"Could not read file: {e}"}]

    soup = BeautifulSoup(html_content, 'lxml')
    filename = os.path.basename(filepath)

    # 1 & 4. Typos, Mojibake, ???, &amp;amp;
    for text_node in soup.find_all(string=True):
        if text_node.parent.name in ['script', 'style']: continue
        text = str(text_node)
        if is_mojibake_or_weird(text):
            issues.append({"severity": "HIGH", "file": filename, "issue": "Garbled text / ??? / replacement char found", "exact_text": text.strip()[:100]})
    
    if '&amp;amp;' in html_content:
        issues.append({"severity": "MEDIUM", "file": filename, "issue": "Double-encoded entity &amp;amp; found", "exact_text": "&amp;amp;"})

    # 2. Placeholders
    placeholder_pattern = re.compile(r'(?i)\b(lorem|ipsum|placeholder|todo|fixme|xxx|hack|temp)\b')
    for text_node in soup.find_all(string=True):
        if text_node.parent.name in ['script', 'style']: continue
        text = str(text_node)
        match = placeholder_pattern.search(text)
        if match:
            # Check if it's not a common legit word in context
            issues.append({"severity": "HIGH", "file": filename, "issue": f"Placeholder text found: {match.group()}", "exact_text": text.strip()[:100]})

    # 3. Copyright year
    copyright_text = ""
    for elem in soup.find_all(string=re.compile(r'(?i)(copyright|©)')):
        if elem.parent.name not in ['script', 'style']:
            copyright_text += str(elem) + " "
    
    if copyright_text and "2026" not in copyright_text:
        issues.append({"severity": "MEDIUM", "file": filename, "issue": "Copyright year is not 2026", "exact_text": copyright_text.strip()[:100]})
    elif not copyright_text:
        issues.append({"severity": "LOW", "file": filename, "issue": "No copyright notice found", "exact_text": ""})

    # 5. Alt text on images
    for img in soup.find_all('img'):
        alt = img.get('alt')
        src = img.get('src', 'unknown')
        if alt is None:
            issues.append({"severity": "HIGH", "file": filename, "issue": "Missing alt attribute on image", "exact_text": f"img src={src}"})
        elif alt.strip() == "":
            issues.append({"severity": "MEDIUM", "file": filename, "issue": "Empty alt attribute on image", "exact_text": f"img src={src}"})
        elif alt.strip().lower() in ["image", "picture", "logo"]:
            issues.append({"severity": "LOW", "file": filename, "issue": "Unmeaningful alt text", "exact_text": f"img src={src}, alt='{alt}'"})

    # 6. Consistent branding
    branding_pattern = re.compile(r'(?i)watch\s*on\s*repeat')
    for text_node in soup.find_all(string=True):
        if text_node.parent.name in ['script', 'style']: continue
        text = str(text_node)
        matches = branding_pattern.finditer(text)
        for match in matches:
            matched_str = match.group()
            if matched_str != 'WatchOnRepeat' and 'watchonrepeat.com' not in text.lower():
                issues.append({"severity": "MEDIUM", "file": filename, "issue": "Inconsistent branding spelling", "exact_text": matched_str})

    # 8. Contact info
    emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', html_content)
    for email in set(emails):
        if "sentry.io" not in email and "w3.org" not in email:
            issues.append({"severity": "INFO", "file": filename, "issue": "Email found", "exact_text": email})

    # 7. Blog article quality
    if is_blog:
        title = soup.find('title')
        title_text = title.text if title else ""
        if not title_text or title_text.lower().strip() in ['blog post', 'article', 'post', 'title']:
            issues.append({"severity": "HIGH", "file": filename, "issue": "Generic or missing blog title", "exact_text": title_text})
        
        main_content = soup.find('main') or soup.find('article') or soup.find('body')
        if main_content:
            text_content = main_content.get_text(separator=' ')
            words = text_content.split()
            if len(words) < 200:
                issues.append({"severity": "MEDIUM", "file": filename, "issue": "Thin content in blog article", "exact_text": f"Word count: {len(words)}"})
            
            paragraphs = main_content.find_all('p')
            seen_p = set()
            for p in paragraphs:
                pt = p.get_text().strip()
                if len(pt) > 50:
                    if pt in seen_p:
                        issues.append({"severity": "HIGH", "file": filename, "issue": "Repeated paragraph found", "exact_text": pt[:100]})
                    seen_p.add(pt)
        
        internal_link = False
        for a in soup.find_all('a'):
            href = a.get('href', '')
            if href.startswith('/') or href.startswith('../') or 'watchonrepeat.com' in href:
                internal_link = True
                break
        if not internal_link:
            issues.append({"severity": "MEDIUM", "file": filename, "issue": "No internal link to main app found", "exact_text": ""})
            
        share_btn = False
        for el in soup.find_all(['button', 'a', 'div']):
            classes = el.get('class', [])
            if any('share' in str(c).lower() for c in classes) or 'share' in el.get_text().lower():
                share_btn = True
                break
        if not share_btn:
            issues.append({"severity": "LOW", "file": filename, "issue": "No share button found", "exact_text": ""})

    return issues

def main():
    base_dir = r"c:\Users\devil\Documents\video loop site project"
    root_files = [
        "index.html", "about.html", "guide.html", "music-practice.html", 
        "language-learning.html", "youtube-study-tool.html", 
        "listenonrepeat-alternative.html", "top-loops.html", 
        "contact.html", "privacy.html", "terms.html"
    ]
    
    all_issues = []
    
    for rf in root_files:
        path = os.path.join(base_dir, rf)
        if os.path.exists(path):
            all_issues.extend(check_html_file(path, is_blog=False))
            
    blog_dir = os.path.join(base_dir, "blog")
    if os.path.exists(blog_dir):
        for fname in os.listdir(blog_dir):
            if fname.endswith(".html"):
                path = os.path.join(blog_dir, fname)
                all_issues.extend(check_html_file(path, is_blog=True))

    artifact_content = "# Quality Audit Report\n\n"
    
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
    all_issues.sort(key=lambda x: (severity_order.get(x['severity'], 5), x['file']))
    
    current_severity = None
    for issue in all_issues:
        if issue['severity'] != current_severity:
            current_severity = issue['severity']
            artifact_content += f"\n## {current_severity} Issues\n\n"
            artifact_content += "| File | Issue | Exact Text |\n"
            artifact_content += "|---|---|---|\n"
            
        exact_text = issue['exact_text'].replace('\n', ' ').replace('|', '&#124;')
        artifact_content += f"| {issue['file']} | {issue['issue']} | `{exact_text}` |\n"
        
    artifact_path = r"c:\Users\devil\.gemini\antigravity\brain\0cf84c9f-7577-4f30-9ff4-f8ef4a5ec18d\audit_report.md"
    os.makedirs(os.path.dirname(artifact_path), exist_ok=True)
    with open(artifact_path, "w", encoding="utf-8") as f:
        f.write(artifact_content)
    print("Done!")

if __name__ == "__main__":
    main()
