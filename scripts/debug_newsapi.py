"""
Debug script: test NewsAPI connectivity with the same keywords used in the pipeline.
Uses /top-headlines (free-plan compatible). Does NOT support date/sort/language filtering.
Run: NEWS_API_KEY="your_key_here" python scripts/debug_newsapi.py
"""

import os
import sys
import requests

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

# Step 1: Test API key validity with a simple /top-headlines request (free-plan safe)
print("\n--- Step 1: Test API key validity (/top-headlines) ---")
test_params = {
    "q": "technology",
    "pageSize": 1,
    "apiKey": NEWS_API_KEY,
}
try:
    resp = requests.get(f"{NEWS_API_BASE}/top-headlines", params=test_params, timeout=15)
    print(f"  HTTP Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        if data.get("status") == "ok":
            print(f"  ✅ API key valid! totalResults={data.get('totalResults', 0)}")
        else:
            print(f"  ⚠️  Status not 'ok': {data.get('status')} - {data.get('message', '')}")
    elif resp.status_code == 401:
        print(f"  ❌ HTTP 401 Unauthorized — API key is INVALID or EXPIRED!")
        error = resp.json()
        print(f"  Error: {error.get('message', 'Unknown')}")
        print(f"\n  🔑 Go to https://newsapi.org/register to get a free API key")
        print(f"     (takes 30 seconds — just name + email, no credit card)")
        sys.exit(1)
    elif resp.status_code == 426:
        print(f"  ❌ HTTP 426 Upgrade Required — GitHub Actions IPs blocked.")
        print(f"  This is a Dev plan restriction. Production needs a paid plan.")
    else:
        error = resp.json()
        print(f"  ❌ API returned error: {error.get('message', 'Unknown')}")
except requests.exceptions.ConnectionError as e:
    print(f"  ❌ Connection error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"  ❌ Unexpected error: {e}")
    sys.exit(1)

# Step 2: Test each keyword set with /top-headlines (no date/language/sort on free plan)
print("\n--- Step 2: Test keyword queries (/top-headlines) ---")
total_articles = 0

for kw in NEWS_KEYWORD_SETS:
    params = {
        "q": kw,
        "pageSize": 10,
        "apiKey": NEWS_API_KEY,
    }
    try:
        resp = requests.get(f"{NEWS_API_BASE}/top-headlines", params=params, timeout=15)
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
    print("   1. Free plan key — /top-headlines only returns current headlines (not archive)")
    print("   2. Keywords too specific for trending news (top-headlines = what's hot NOW)")
    print("   3. API key is valid but has no remaining requests (free = 100/day)")
    print()
    print("   → Try in browser: https://newsapi.org/v2/top-headlines?q=test&apiKey=YOUR_KEY")
    print("   → Check https://newsapi.org/account for usage stats")
else:
    print(f"\n✅ Pipeline should fetch ~{total_articles} articles per run")
    print(f"   Free plan limit: 100 requests/day. This test used {len(NEWS_KEYWORD_SETS)+1} requests.")
