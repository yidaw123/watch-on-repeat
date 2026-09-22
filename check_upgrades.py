import urllib.request
import ssl
import json

SUPABASE_URL = "https://golkbcdlxpojjwqtyuzn.supabase.co"
SUPABASE_KEY = "sb_publishable_e1gQuU0n8FofmTkitqTEQQ_pi1g8fqD"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Prefer": "count=exact"
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/events?event_name=eq.upgrade_clicked&select=id", headers=headers)
try:
    with urllib.request.urlopen(req, context=ctx) as response:
        content_range = response.headers.get("Content-Range", "")
        count = content_range.split("/")[-1] if content_range else "0"
        print(f"Total upgrade button clicks: {count}")
except Exception as e:
    print(f"Error: {e}")
