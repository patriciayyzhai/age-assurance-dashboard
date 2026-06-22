"""
Pipeline orchestrator: runs all steps in sequence.
1. Fetch news → 2. Classify → 3. Update data → 4. Notify → 5. Merge data
"""

import json
import sys
from config import now_iso
from fetch_news import run as fetch_news
from classify_news import run as classify_news
from update_data import run as update_data
from notify import run as notify
from merge_data import run as merge_data
from validate_schemas import run as validate_schemas


def run():
    """Run the full pipeline."""
    print("=" * 60)
    print("  Age Assurance Regulation Pipeline")
    print(f"  Started: {now_iso()}")
    print("=" * 60)
    
    # Step 0: Validate existing data
    print("\n--- Step 0: Validate existing data ---")
    if not validate_schemas():
        print("ERROR: Existing data is invalid. Aborting pipeline.")
        sys.exit(1)
    
    # Step 1: Fetch news
    print("\n--- Step 1: Fetch news ---")
    articles = fetch_news()
    
    if not articles:
        print("\nNo new articles found. Pipeline complete.")
        # Still merge data to ensure merged.json is up to date
        print("\n--- Step 5: Merge data ---")
        merge_data()
        return
    
    # Step 2-3: Classify news
    print("\n--- Step 2-3: Classify news ---")
    classified = classify_news(articles)
    
    if not classified:
        print("\nNo relevant articles found. Pipeline complete.")
        print("\n--- Step 5: Merge data ---")
        merge_data()
        return
    
    # Step 4: Update data
    print("\n--- Step 4: Update data ---")
    summary = update_data(classified, articles)
    
    # Step 5: Notify
    print("\n--- Step 5: Notify ---")
    notify(summary)
    
    # Step 6: Merge data for frontend
    print("\n--- Step 6: Merge data ---")
    merge_data()
    
    # Final validation
    print("\n--- Step 7: Final validation ---")
    if not validate_schemas():
        print("WARNING: Updated data failed validation!")
    
    print("\n" + "=" * 60)
    print(f"  Pipeline complete: {now_iso()}")
    print(f"  Auto-applied: {len(summary['auto_updates'])}")
    print(f"  Pending review: {len(summary['review_items'])}")
    print(f"  Discarded: {len(summary['discarded'])}")
    print("=" * 60)
    
    # Output summary for GitHub Actions
    print(f"\n::set-output name=auto_updates::{len(summary['auto_updates'])}")
    print(f"::set-output name=review_items::{len(summary['review_items'])}")


if __name__ == "__main__":
    run()
