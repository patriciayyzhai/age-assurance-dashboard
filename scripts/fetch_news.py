"""
Step 1: Fetch news from NewsAPI.org and deduplicate against seen URLs.
Outputs a list of new, unique news articles for classification.
"""

import requests
import hashlib
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher
from config import (
    NEWS_API_KEY, NEWS_API_BASE, NEWS_LOOKBACK_HOURS,
    NEWS_LANGUAGE, NEWS_SORT_BY, NEWS_PAGE_SIZE,
    NEWS_KEYWORD_SETS, SEEN_URLS_FILE, load_json, save_json, now_iso,
)


def fetch_news_for_keyword(keyword_set: str, from_time: str) -> list[dict]:
    """Fetch news articles from NewsAPI.org for a given keyword set."""
    params = {
        "q": keyword_set,
        "from": from_time,
        "language": NEWS_LANGUAGE,
        "sortBy": NEWS_SORT_BY,
        "pageSize": NEWS_PAGE_SIZE,
        "apiKey": NEWS_API_KEY,
    }
    resp = requests.get(f"{NEWS_API_BASE}/everything", params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    return data.get("articles", [])


def normalize_url(url: str) -> str:
    """Normalize a URL for deduplication (strip trailing slash, lowercase)."""
    url = url.strip().lower()
    if url.endswith("/"):
        url = url[:-1]
    return url


def title_similarity(t1: str, t2: str) -> float:
    """Compute title similarity ratio (0-1)."""
    return SequenceMatcher(None, t1.lower(), t2.lower()).ratio()


def deduplicate(articles: list[dict], seen_urls: dict) -> list[dict]:
    """
    Deduplicate articles against seen URLs and within the current batch.
    Uses exact URL match + title similarity threshold.
    """
    DEDUP_TITLE_THRESHOLD = 0.85
    unique = []
    seen_titles = []

    for article in articles:
        url = article.get("url", "")
        title = article.get("title", "")

        if not url or not title:
            continue

        norm_url = normalize_url(url)
        url_hash = hashlib.md5(norm_url.encode()).hexdigest()

        # Check against previously seen URLs
        if norm_url in seen_urls:
            continue

        # Check against titles in current batch
        is_dup = False
        for seen_title in seen_titles:
            if title_similarity(title, seen_title) > DEDUP_TITLE_THRESHOLD:
                is_dup = True
                break
        if is_dup:
            continue

        seen_titles.append(title)
        unique.append(article)

    return unique


def run() -> list[dict]:
    """Main entry point: fetch and deduplicate news articles."""
    if not NEWS_API_KEY:
        print("[fetch_news] WARNING: NEWS_API_KEY not set, skipping news fetch")
        return []

    # Load seen URLs
    seen_data = load_json(SEEN_URLS_FILE) if SEEN_URLS_FILE.exists() else {
        "version": "1.0.0",
        "last_updated": now_iso(),
        "total_count": 0,
        "urls": {},
    }
    seen_urls = seen_data.get("urls", {})

    # Calculate lookback time
    from_time = (datetime.now(timezone.utc) - timedelta(hours=NEWS_LOOKBACK_HOURS)).strftime("%Y-%m-%dT%H:%M:%S")

    all_articles = []
    for keyword_set in NEWS_KEYWORD_SETS:
        print(f"[fetch_news] Fetching: {keyword_set}")
        try:
            articles = fetch_news_for_keyword(keyword_set, from_time)
            all_articles.extend(articles)
            print(f"  → {len(articles)} articles")
        except Exception as e:
            print(f"  → ERROR: {e}")

    print(f"[fetch_news] Total fetched: {len(all_articles)}")

    # Deduplicate
    unique_articles = deduplicate(all_articles, seen_urls)
    print(f"[fetch_news] After dedup: {len(unique_articles)}")

    return unique_articles


if __name__ == "__main__":
    articles = run()
    print(f"\nFetched {len(articles)} unique articles for classification")
    for a in articles[:5]:
        print(f"  - {a['title'][:80]}")
