"""
Debug script: test NewsAPI connectivity with the same keywords used in the pipeline.
Run: NEWS_API_KEY="your_key_here" python scripts/debug_newsapi.py
"""

import os
import sys
import requests
from datetime import datetime, timedelta, timezone

NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "").strip()
NEWS_API_BASE = "https://newsapi.org/v2"

# Same keyword sets as config.py
NEWS_KEYWORD_SETS = [
    '"age assurance" regulation',
    '"age verification" legislation',
    '"age estimation" law',
    '"online safety" children regulation',
    '"digital age verification"',
    '"social media age" law',
    '"child online protection" regulation',
    '"minor protection" online legislation',
]

print("=" * 60)
print("NewsAPI Debug Test")
print("=" * 60)

if not NEWS_API_KEY:
    print("\n❌ NEWS_API_KEY is not set!")
    print("   Run with: NEWS_API_KEY='your_key' python scripts/debug_newsapi.py")
    sys.exit(1)

print(f"\n✅ NEWS_API_KEY found (length={len(NEWS_API_KEY)}, ends with ...{NEWS_API_KEY[-4:]})")

# Step 1: Test API key validity with a simple request
print("\n--- Step 1: Test API key validity ---")
test_params = {
    "q": "test",
    "pageSize": 1,
    "apiKey": NEWS_API_KEY,
}
try:
    resp = requests.get(f"{NEWS_API_BASE}/everything", params=test_params, timeout=15)
    print(f"  HTTP Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"  ✅ API key valid! Response status: {data.get('status')}")
        print(f"  Total results for 'test': {data.get('totalResults')}")
    elif resp.status_code == 401:
        print(f"  ❌ HTTP 401 Unauthorized — API key is INVALID or EXPIRED!")
        error = resp.json()
        print(f"  Error: {error.get('message', 'Unknown')}")
        sys.exit(1)
    elif resp.status_code == 426:
        print(f"  ❌ HTTP 426 Upgrade Required — Free plan does not allow non-localhost requests!")
        print(f"  This means GitHub Actions IPs are blocked. Developer plan needed.")
    else:
        error = resp.json()
        print(f"  ❌ API returned error: {error.get('message', 'Unknown')}")
except requests.exceptions.ConnectionError as e:
    print(f"  ❌ Connection error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"  ❌ Unexpected error: {e}")
    sys.exit(1)

# Step 2: Test each keyword set
print("\n--- Step 2: Test keyword queries ---")
from_time = (datetime.now(timezone.utc) - timedelta(hours=48)).strftime("%Y-%m-%dT%H:%M:%S")
total_articles = 0

for kw in NEWS_KEYWORD_SETS:
    params = {
        "q": kw,
        "from": from_time,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 10,
        "apiKey": NEWS_API_KEY,
    }
    try:
        resp = requests.get(f"{NEWS_API_BASE}/everything", params=params, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            count = len(data.get("articles", []))
            total = data.get("totalResults", 0)
            total_articles += count
            print(f"  [{kw[:50]:<50}] → {count} articles (total: {total})")
            if count > 0:
                for a in data.get("articles", [])[:3]:
                    print(f"      • {a.get('title','')[:80]}")
        else:
            error = resp.json()
            print(f"  [{kw[:50]:<50}] → ERROR {resp.status_code}: {error.get('message','')[:80]}")
    except Exception as e:
        print(f"  [{kw[:50]:<50}] → EXCEPTION: {e}")

print(f"\n{'=' * 60}")
print(f"Total articles fetched: {total_articles}")
if total_articles == 0:
    print("\n⚠️  ZERO articles returned — possible causes:")
    print("   1. API key has no access to 'everything' endpoint (developer plan restriction)")
    print("   2. No relevant news in the past 48 hours for these keywords")
    print("   3. API key is valid but has no remaining requests")
    print()
    print("   → Try https://newsapi.org/v2/everything?q=test&apiKey=YOUR_KEY in browser")
    print("   → Check https://newsapi.org/account for plan details and usage stats")
else:
    print(f"\n✅ Pipeline should fetch ~{total_articles} articles per run (2x lookback = 48h)")
    print(f"   If GitHub Actions still gets 0, there may be an IP restriction.")
