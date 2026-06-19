"""
compliance.py — Country-specific label requirements and compliance scoring
Aligned with ISO 15223-1 symbol detection and frontend COUNTRY_REQUIREMENTS.
"""

# ---------------------------------------------------------------------------
# Required fields per country — must match frontend COUNTRY_REQUIREMENTS
# ---------------------------------------------------------------------------
COUNTRY_RULES = {
    "USA": [
        "Device Name",
        "Manufacturer",
        "UDI",
        "Lot Number",
        "Expiry Date",
        "Warnings",
        "Rx Only",
        "FDA-compliant labeling",
    ],
    "UK": [
        "Device Name",
        "Manufacturer",
        "UDI",
        "Lot Number",
        "Expiry Date",
        "Warnings",
        "UKCA marking",
        "UK Responsible Person",
    ],
    "India": [
        "Device Name",
        "Manufacturer",
        "UDI",
        "Lot Number",
        "Expiry Date",
        "Warnings",
        "Manufacturing License No.",
        "Import License No.",
    ],
    "Japan": [
        "Device Name",
        "Manufacturer",
        "UDI",
        "Lot Number",
        "Expiry Date",
        "Warnings",
        "MAH",
        "Japanese-language label",
    ],
}

# ---------------------------------------------------------------------------
# Field aliases — map OCR-extracted keys → compliance rule keys
# ---------------------------------------------------------------------------
FIELD_ALIASES = {
    # OCR key                  → compliance rule key
    "License Numbers":         ["Manufacturing License No.", "Import License No."],
    "UKCA Mark":               ["UKCA marking"],
    "MAH":                     ["MAH"],
    "UK Responsible Person":   ["UK Responsible Person"],
    "Rx Only":                 ["Rx Only"],
    "UDI":                     ["UDI"],
    # FDA-compliant labeling — infer from Rx Only or UDI presence
    # Japanese-language label — infer from MAH presence
}

# ---------------------------------------------------------------------------
# Country metadata
# ---------------------------------------------------------------------------
COUNTRY_META = {
    "USA":   {"flag": "🇺🇸", "full_name": "United States"},
    "UK":    {"flag": "🇬🇧", "full_name": "United Kingdom"},
    "India": {"flag": "🇮🇳", "full_name": "India"},
    "Japan": {"flag": "🇯🇵", "full_name": "Japan"},
}


def _resolve_fields(extracted_fields: dict) -> dict:
    """
    Expand extracted OCR fields into all compliance rule keys they satisfy.
    Handles aliases so 'License Numbers' satisfies both Indian license fields,
    'UKCA Mark' satisfies 'UKCA marking', etc.
    """
    resolved = dict(extracted_fields)  # start with original

    # License Numbers → satisfies both Manufacturing and Import license fields
    lic = extracted_fields.get("License Numbers")
    if lic and lic.strip():
        resolved["Manufacturing License No."] = lic
        resolved["Import License No."] = lic

    # UKCA Mark → satisfies 'UKCA marking'
    ukca = extracted_fields.get("UKCA Mark")
    if ukca and ukca.strip():
        resolved["UKCA marking"] = ukca

    # Rx Only or UDI present → infer FDA-compliant labeling for USA
    if (extracted_fields.get("Rx Only") or extracted_fields.get("UDI")):
        resolved["FDA-compliant labeling"] = "Inferred from Rx Only / UDI presence"

    # MAH present → infer Japanese-language label (MAH is Japan-specific)
    if extracted_fields.get("MAH"):
        resolved["Japanese-language label"] = "Inferred from MAH presence"

    return resolved


def score_compliance(extracted_fields: dict, country: str) -> dict:
    """
    Compare extracted OCR fields against a country's requirements.

    Returns:
        {
          "country": str,
          "flag": str,
          "full_name": str,
          "required": list[str],
          "found": list[str],
          "missing": list[str],
          "percentage": float,
          "passed": bool,
        }
    """
    resolved = _resolve_fields(extracted_fields)
    required = COUNTRY_RULES.get(country, [])
    found = []
    missing = []

    for field in required:
        val = resolved.get(field)
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
    return {country: score_compliance(extracted_fields, country) for country in COUNTRY_RULES}


def best_match(scores: dict, extracted_fields: dict = None) -> str:
    """Return the country with the highest compliance percentage, or priority rule."""
    if extracted_fields:
        priority = classify_country_priority(extracted_fields)
        if priority:
            return priority
    return max(scores, key=lambda c: scores[c]["percentage"])


def classify_country_priority(extracted_fields: dict) -> str:
    """
    Determine target country using the priority rules from the requirements doc:
      1. UKCA present → UK
      2. MAH or Japanese text → Japan
      3. Manufacturing/Import License Number → India
      4. Rx Only → USA
      5. Default → USA
    """
    if extracted_fields.get("UKCA Mark"):
        return "UK"
    
    manufacturer = str(extracted_fields.get("Manufacturer", "")).upper()
    if extracted_fields.get("MAH") or "JAPAN" in manufacturer:
        return "Japan"
    lic = extracted_fields.get("License Numbers", "")
    if lic and any(x in lic.upper() for x in ["CDSCO", "MFG", "IMP", "MDL", "MRP"]):
        return "India"
    if extracted_fields.get("UK Responsible Person"):
        return "UK"
    if extracted_fields.get("Rx Only"):
        return "USA"
    return "USA"