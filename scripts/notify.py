"""
Step 5: Send WeCom webhook notifications for database updates.
"""

import json
import requests
from config import (
    WECOM_WEBHOOK_URL, WECOM_MAX_MARKDOWN_BYTES,
    URGENT_CONFIDENCE_THRESHOLD,
)


def truncate_markdown(text: str) -> str:
    """Truncate markdown to fit WeCom's byte limit."""
    encoded = text.encode("utf-8")
    if len(encoded) <= WECOM_MAX_MARKDOWN_BYTES:
        return text
    # Truncate by characters and check byte length
    while len(text.encode("utf-8")) > WECOM_MAX_MARKDOWN_BYTES - 20:
        text = text[:-10]
    return text + "\n\n..."


def send_markdown(content: str) -> bool:
    """Send a markdown message to WeCom webhook."""
    if not WECOM_WEBHOOK_URL:
        print("[notify] WARNING: WECOM_WEBHOOK_URL not set, skipping notification")
        return False
    
    payload = {
        "msgtype": "markdown",
        "markdown": {
            "content": truncate_markdown(content),
        },
    }
    
    try:
        resp = requests.post(WECOM_WEBHOOK_URL, json=payload, timeout=10)
        resp.raise_for_status()
        result = resp.json()
        if result.get("errcode") == 0:
            print("[notify] ✓ Markdown message sent successfully")
            return True
        else:
            print(f"[notify] ✗ WeCom error: {result}")
            return False
    except Exception as e:
        print(f"[notify] ✗ Error sending message: {e}")
        return False


def send_text_card(title: str, description: str, url: str = "") -> bool:
    """Send a template card message (for urgent alerts)."""
    if not WECOM_WEBHOOK_URL:
        print("[notify] WARNING: WECOM_WEBHOOK_URL not set, skipping notification")
        return False
    
    payload = {
        "msgtype": "template_card",
        "template_card": {
            "card_type": "text_notice",
            "source": {
                "desc": "Age Assurance Dashboard",
                "icon_url": "",
            },
            "main_title": {
                "title": title[:26],
                "desc": "",
            },
            "emphasis_content": {
                "title": "🚨",
                "desc": "New Regulation",
            },
            "sub_title_text": description[:50] if description else "",
            "horizontal_content_list": [],
            "card_action": {
                "type": 1 if url else 0,
                "url": url or "",
            },
        },
    }
    
    try:
        resp = requests.post(WECOM_WEBHOOK_URL, json=payload, timeout=10)
        resp.raise_for_status()
        result = resp.json()
        if result.get("errcode") == 0:
            print("[notify] ✓ Template card sent successfully")
            return True
        else:
            print(f"[notify] ✗ WeCom error: {result}")
            # Fallback to markdown
            fallback = f"## {title}\n\n{description}"
            if url:
                fallback += f"\n\n[Read more]({url})"
            return send_markdown(fallback)
    except Exception as e:
        print(f"[notify] ✗ Error sending template card: {e}")
        return False


def build_daily_digest(summary: dict) -> str:
    """Build a markdown digest of all daily updates."""
    auto_updates = summary.get("auto_updates", [])
    review_items = summary.get("review_items", [])
    discarded = summary.get("discarded", [])
    
    lines = [
        "# 📊 Age Assurance Dashboard — Daily Update",
        f"> **Date**: {__import__('datetime').datetime.now().strftime('%Y-%m-%d')}",
        "",
        f"**Summary**: {len(auto_updates)} auto-applied | {len(review_items)} pending review | {len(discarded)} discarded",
        "",
    ]
    
    if auto_updates:
        lines.append("---")
        lines.append("## ✅ Auto-Applied Updates")
        lines.append("")
        for update in auto_updates:
            news = update["news_item"]
            reg = update["regulation"]
            classification = news["classification"]
            
            emoji = "🚨" if classification["action_type"] == "new_regulation_proposed" else "📈"
            lines.append(f"### {emoji} {reg['name']}")
            lines.append(f"- **Type**: {classification['action_type'].replace('_', ' ').title()}")
            lines.append(f"- **Jurisdiction**: {reg.get('jurisdiction_id', 'N/A')}")
            if classification.get("status_change"):
                lines.append(f"- **Status Change**: → {classification['status_change'].replace('_', ' ').title()}")
            lines.append(f"- **Confidence**: {classification['confidence']:.0%}")
            if classification.get("summary"):
                lines.append(f"- **Summary**: {classification['summary']}")
            lines.append(f"- **Source**: [{news['source']}]({news['url']})")
            lines.append("")
    
    if review_items:
        lines.append("---")
        lines.append("## ⏳ Pending Review (Low Confidence)")
        lines.append("")
        for item in review_items:
            classification = item["classification"]
            lines.append(f"- **{item['title'][:60]}**")
            lines.append(f"  - Type: {classification['action_type'].replace('_', ' ').title()}")
            lines.append(f"  - Confidence: {classification['confidence']:.0%}")
            if classification.get("summary"):
                lines.append(f"  - Summary: {classification['summary']}")
            lines.append(f"  - [Source]({item['url']})")
            lines.append("")
    
    lines.append("---")
    lines.append(f"_Powered by Age Assurance Regulation Dashboard_")
    
    return "\n".join(lines)


def run(summary: dict) -> None:
    """Main entry point: send notifications based on update summary."""
    auto_updates = summary.get("auto_updates", [])
    
    if not auto_updates and not summary.get("review_items"):
        print("[notify] No updates to notify about")
        return
    
    # Send urgent alerts for high-confidence new regulations
    for update in auto_updates:
        news = update["news_item"]
        classification = news["classification"]
        
        if (classification["action_type"] == "new_regulation_proposed" 
            and classification["confidence"] >= URGENT_CONFIDENCE_THRESHOLD):
            send_text_card(
                title=f"🚨 New Regulation: {update['regulation']['name'][:30]}",
                description=classification.get("summary", news["title"]),
                url=news.get("url", ""),
            )
    
    # Send daily digest
    digest = build_daily_digest(summary)
    send_markdown(digest)


if __name__ == "__main__":
    print("Run via pipeline.py")
