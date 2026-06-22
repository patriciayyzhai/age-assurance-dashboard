"""
Build-time merge: merge regulations.json + overrides.json → merged.json
Also merges in seed data (jurisdictions, service_types).
"""

import json
from config import (
    REGULATIONS_FILE, OVERRIDES_FILE, JURISDICTIONS_FILE,
    SERVICE_TYPES_FILE, MERGED_FILE, load_json, save_json, now_iso,
)


def merge_regulations(regulations: list[dict], overrides: list[dict]) -> list[dict]:
    """
    Merge regulations with overrides.
    
    Override semantics:
    - Same ID → override wins (full replace unless _partial=true)
    - _partial=true → shallow-merge only listed fields
    - _deleted=true → exclude from output
    """
    override_map = {o["id"]: o for o in overrides}
    
    merged = []
    seen_ids = set()
    
    for reg in regulations:
        reg_id = reg["id"]
        seen_ids.add(reg_id)
        
        if reg_id in override_map:
            ov = override_map[reg_id]
            if ov.get("_deleted"):
                continue
            if ov.get("_partial"):
                # Shallow merge: only override listed fields
                merged_reg = {**reg}
                for key, value in ov.items():
                    if key not in ("id", "_partial", "_deleted"):
                        merged_reg[key] = value
                merged.append(merged_reg)
            else:
                # Full replace (but keep id)
                merged_reg = {**ov, "id": reg_id}
                merged_reg.pop("_partial", None)
                merged_reg.pop("_deleted", None)
                merged.append(merged_reg)
        else:
            merged.append(reg)
    
    # Add new regulations from overrides that don't exist in base
    for ov in overrides:
        ov_id = ov["id"]
        if ov_id not in seen_ids and not ov.get("_deleted"):
            new_reg = {**ov}
            new_reg.pop("_partial", None)
            new_reg.pop("_deleted", None)
            # Ensure required fields
            new_reg.setdefault("obligations", [])
            new_reg.setdefault("milestones", [])
            new_reg.setdefault("litigations", [])
            new_reg.setdefault("created_at", now_iso())
            new_reg.setdefault("updated_at", now_iso())
            merged.append(new_reg)
    
    return merged


def run() -> dict:
    """Main entry point: merge all data into merged.json."""
    # Load base data
    regs_data = load_json(REGULATIONS_FILE) if REGULATIONS_FILE.exists() else {
        "version": "1.0.0", "last_updated": now_iso(), "regulations": []
    }
    
    overrides_data = load_json(OVERRIDES_FILE) if OVERRIDES_FILE.exists() else {
        "version": "1.0.0", "last_updated": now_iso(), "overrides": []
    }
    
    jurisdictions_data = load_json(JURISDICTIONS_FILE) if JURISDICTIONS_FILE.exists() else {
        "version": "1.0.0", "last_updated": now_iso(), "jurisdictions": []
    }
    
    service_types_data = load_json(SERVICE_TYPES_FILE) if SERVICE_TYPES_FILE.exists() else {
        "version": "1.0.0", "last_updated": now_iso(), "service_types": []
    }
    
    # Merge regulations with overrides
    merged_regulations = merge_regulations(
        regs_data.get("regulations", []),
        overrides_data.get("overrides", []),
    )
    
    # Build merged output
    merged = {
        "version": regs_data.get("version", "1.0.0"),
        "last_updated": regs_data.get("last_updated", now_iso()),
        "regulations": merged_regulations,
        "news_items": [],  # Will be populated by pipeline if available
        "jurisdictions": jurisdictions_data.get("jurisdictions", []),
        "service_types": service_types_data.get("service_types", []),
    }
    
    # Save to public/data/merged.json
    save_json(MERGED_FILE, merged)
    
    print(f"[merge_data] Merged {len(merged_regulations)} regulations → {MERGED_FILE}")
    return merged


if __name__ == "__main__":
    result = run()
    print(f"Total regulations: {len(result['regulations'])}")
    print(f"Total jurisdictions: {len(result['jurisdictions'])}")
    print(f"Total service types: {len(result['service_types'])}")
