"""
compliance.py — Country-specific label requirements and compliance scoring
"""

# ---------------------------------------------------------------------------
# Canonical required fields per country
# ---------------------------------------------------------------------------
COUNTRY_RULES = {
    "USA": [
        "Device Name",
        "UDI",
        "Manufacturer",
        "Warnings",
        "Lot Number",
        "Expiry Date",
    ],
    "UK": [
        "Device Name",
        "UDI",
        "UK Responsible Person",
        "Manufacturer",
        "Expiry Date",
    ],
    "India": [
        "Device Name",
        "Manufacturer",
        "Lot Number",
        "Expiry Date",
        "Storage Conditions",
    ],
    "Japan": [
        "Device Name",
        "MAH",
        "UDI",
        "Lot Number",
        "Expiry Date",
    ],
}

# Country metadata (flag + full name for UI)
COUNTRY_META = {
    "USA":   {"flag": "🇺🇸", "full_name": "United States"},
    "UK":    {"flag": "🇬🇧", "full_name": "United Kingdom"},
    "India": {"flag": "🇮🇳", "full_name": "India"},
    "Japan": {"flag": "🇯🇵", "full_name": "Japan"},
}


def score_compliance(extracted_fields: dict, country: str) -> dict:
    """
    Compare extracted OCR fields against a country's requirements.

    Args:
        extracted_fields: dict of {field_name: value_or_None}
        country: one of "USA", "UK", "India", "Japan"

    Returns:
        {
          "country": str,
          "flag": str,
          "full_name": str,
          "required": list[str],
          "found": list[str],
          "missing": list[str],
          "percentage": float,   # 0–100
          "passed": bool,        # True if percentage == 100
        }
    """
    required = COUNTRY_RULES.get(country, [])
    found = []
    missing = []

    for field in required:
        # A field is "found" if it exists in extracted_fields AND has a non-empty value
        val = extracted_fields.get(field)
        if val and str(val).strip():
            found.append(field)
        else:
            missing.append(field)

    total = len(required)
    percentage = round((len(found) / total) * 100, 1) if total else 0.0

    return {
        "country": country,
        "flag": COUNTRY_META[country]["flag"],
        "full_name": COUNTRY_META[country]["full_name"],
        "required": required,
        "found": found,
        "missing": missing,
        "percentage": percentage,
        "passed": percentage == 100.0,
    }


def score_all_countries(extracted_fields: dict) -> dict:
    """Score compliance for all four countries."""
    scores = {}
    for country in COUNTRY_RULES:
        scores[country] = score_compliance(extracted_fields, country)
    return scores


def best_match(scores: dict) -> str:
    """Return the country name with the highest compliance percentage."""
    return max(scores, key=lambda c: scores[c]["percentage"])
