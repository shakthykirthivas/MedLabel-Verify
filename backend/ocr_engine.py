"""
ocr_engine.py — OCR extraction and field parsing for MedLabel Verify

Supports:
  - Tesseract OCR with enhanced image preprocessing
  - Regex-based extraction for all ISO 15223-1 medical device label fields
  - Multi-line and symbol-based detection
"""

import re
import io
import logging

logger = logging.getLogger(__name__)

try:
    import pytesseract
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    from PIL import Image, ImageFilter, ImageEnhance
    TESSERACT_OK = True
except ImportError:
    TESSERACT_OK = False
    logger.warning("pytesseract / Pillow not installed — OCR disabled")

try:
    from pdf2image import convert_from_bytes
    PDF_OK = True
except ImportError:
    PDF_OK = False
    logger.warning("pdf2image not installed — PDF OCR disabled")


def extract_text(file_bytes: bytes, content_type: str) -> str:
    try:
        if content_type == "application/pdf":
            return _ocr_pdf(file_bytes)
        else:
            return _ocr_image(file_bytes)
    except Exception as exc:
        logger.error("OCR failed: %s", exc)
        return ""


def parse_fields(raw_text: str) -> dict:
    """
    Parse OCR raw text into structured medical device label fields.
    Uses multiple regex patterns per field for robustness against OCR noise.
    """
    text = raw_text.strip()
    if not text:
        return {k: None for k in [
            "Device Name", "Manufacturer", "UDI", "Lot Number",
            "Expiry Date", "Warnings", "Storage Conditions", "MAH",
            "UK Responsible Person", "License Numbers", "Rx Only",
        ]}

    # Normalise OCR noise but preserve newlines for boundary detection
    t = re.sub(r'[|}{@]', ' ', text)
    t = re.sub(r'[ \t]+', ' ', t)   # collapse spaces/tabs only, keep newlines

    logger.info("=== OCR RAW TEXT ===\n%s\n=== END OCR TEXT ===", t)

    # ── Device Name ──────────────────────────────────────────────────────────
    device_name = _extract_device_name(t)

    # ── Manufacturer ─────────────────────────────────────────────────────────
    manufacturer = _extract_manufacturer(t)

    # ── UDI ──────────────────────────────────────────────────────────────────
    udi = _extract_udi(t)

    # ── Lot Number ───────────────────────────────────────────────────────────
    lot = _extract_lot(t)

    # ── Expiry Date ──────────────────────────────────────────────────────────
    expiry = _extract_expiry(t)

    # ── Warnings ─────────────────────────────────────────────────────────────
    warnings = _extract_warnings(t)

    # ── Storage Conditions ───────────────────────────────────────────────────
    storage = _extract_storage(t)

    # ── MAH ──────────────────────────────────────────────────────────────────
    mah = _extract_mah(t)

    # ── UK Responsible Person ─────────────────────────────────────────────────
    uk_rep = _extract_uk_rep(t)

    # ── License Numbers ───────────────────────────────────────────────────────
    license_no = _extract_license(t)

    # ── Rx Only ──────────────────────────────────────────────────────────────
    rx_only = _extract_rx_only(t)

    fields = {
        "Device Name":           device_name,
        "Manufacturer":          manufacturer,
        "UDI":                   udi,
        "Lot Number":            lot,
        "Expiry Date":           expiry,
        "Warnings":              warnings,
        "Storage Conditions":    storage,
        "MAH":                   mah,
        "UK Responsible Person": uk_rep,
        "License Numbers":       license_no,
        "Rx Only":               rx_only,
    }

    return {k: (v.strip() if isinstance(v, str) else None) for k, v in fields.items()}


# ═══════════════════════════════════════════════════════════════════════════════
# Field Extraction Functions
# ═══════════════════════════════════════════════════════════════════════════════

def _extract_device_name(t: str) -> str:
    """Extract device name — combines brand name + product descriptor lines."""

    # 1. Explicit "Device Name:" or "Product Name:" label
    name = _f(t, r"(?:device\s*name|product\s*name)[:\-]?\s*(.+)")
    if name:
        return name

    # 2. Look for branded product names with ® or ™ symbols
    # This catches "CompuHyper GlobalMed®" or "Medtronic™" etc.
    brand_match = re.search(
        r"^(.+?(?:[®™©]|[\(\[]?(?:R|TM|C)[\)\]]?).*)$",
        t, re.MULTILINE | re.IGNORECASE
    )
    if brand_match:
        brand_line = brand_match.group(1).strip()
        # Now gather subsequent descriptor lines (product type, dimensions)
        lines = t.splitlines()
        brand_idx = None
        for i, line in enumerate(lines):
            if brand_line in line.strip():
                brand_idx = i
                break

        if brand_idx is not None:
            name_parts = [brand_line]
            # Collect subsequent lines that look like product descriptors
            for j in range(brand_idx + 1, min(brand_idx + 5, len(lines))):
                next_line = lines[j].strip()
                if not next_line:
                    break
                # Stop if we hit field labels or symbols
                if re.match(r"^(CAT|LOT|REF|UDI|USE\s*BY|Mfg|Tel|Email|Batch|Exp|MD\s|EC\s|\(0|www\.|http|Manufacturer|QTY|SINGLE|DO NOT|KEEP|STERILE|UPPER|LIMIT|\d+\.\d+\.\d+)", next_line, re.IGNORECASE):
                    break
                # Include lines that look like product descriptors or dimensions
                if re.match(r"^[A-Za-z®™\s\-\.\,\(\)]+$", next_line) or re.match(r"^\d+[\.\,]?\d*\s*mm", next_line, re.IGNORECASE):
                    name_parts.append(next_line)
                else:
                    break
            return " ".join(name_parts)
        return brand_line

    # 3. REF symbol (ISO 5.1.6) — catalogue/model number on same line
    name = _f(t, r"REF\s+([A-Za-z0-9][A-Za-z0-9\s\-\/]{2,40})")
    if name:
        return name

    # 4. Brand + product keyword on one line
    name = _f(t, r"^((?:POLYMED|OMRON|PHILIPS|SIEMENS|GE|BD|BECTON|MEDTRONIC|ABBOTT|STRYKER|COMPUHYPER|MEDDEV)\s+[A-Z][A-Z\s\-]{3,50})$", multiline=True)
    if name:
        return name

    # 5. Look for Title-Case or ALL-CAPS standalone device name line
    SKIP_PREFIXES = re.compile(
        r"^(EN\s|Prefabricated|Quantity|REF|LOT|Mfg|Tel|Email|Batch|Exp|MD\s|EC\s|UDI|Consult|\(0|www\.|http|CAT|USE\s*BY|QTY|SINGLE|DO NOT|KEEP|Manufacturer|STERILE)",
        re.IGNORECASE
    )
    for line in t.splitlines():
        stripped = line.strip()
        if not stripped or len(stripped) < 4:
            continue
        if SKIP_PREFIXES.match(stripped):
            continue
        # Title Case or ALL-CAPS, letters/spaces/hyphens only, no long digit runs
        if re.match(r"^[A-Z][A-Za-z\s\-]{3,40}$", stripped) and not re.search(r"\d{4,}", stripped):
            return stripped

    # 6. Fallback to first meaningful line
    return _first_line(t)


def _extract_manufacturer(t: str) -> str:
    """Extract manufacturer name and address."""

    # 1. ISO "Manufacturer" header symbol — look for company info following it
    mfr_match = re.search(
        r"[Mm]anufacturer\s*\n([\s\S]*?)(?:\n\s*\n|\n(?:MedDev|EC\s*REP|UK\s*Re|800\.|555\.|www\.|\(01\)))",
        t
    )
    if mfr_match:
        block = mfr_match.group(1).strip()
        # Clean up multi-line block into single-line manufacturer
        lines = [l.strip() for l in block.splitlines() if l.strip()]
        if lines:
            result = ", ".join(lines)
            # Check if it looks like a real manufacturer (has a company-ish name)
            if len(result) > 5 and not re.match(r"^\d+$", result):
                return result

    # 2. Explicit label: "Manufactured by" / "Mfg by" / "Made by"
    manufacturer = _f(t, r"(?:manufactured?\s*by|mfr\.?|mfg\.?\s*by|made\s*by)[:\-]?\s*([A-Z][\w\s\.,\-&]+?(?:LTD\.?|LLC\.?|INC\.?|CORP\.?|PVT\.?\s*LTD\.?|MEDICURE|MEDTECH|MEDICAL|HEALTHCARE|SURGICAL|BIOTECH|EXPERTS|GlobalMed[®]?)\b\.?)")
    if manufacturer:
        return manufacturer

    # 3. Company name ending in standard legal suffixes
    manufacturer = _f(t, r"([\w][\w\s\-\.,]+(?:LTD\.?|LLC\.?|INC\.?|CORP\.?|PVT\.?\s*LTD\.?|MEDICURE|MEDTECH|MEDICAL|GlobalMed[®]?|EXPERTS)\.?)")
    if manufacturer and not re.search(r"consult|instruction|warning|caution|sterile", manufacturer, re.IGNORECASE):
        return manufacturer

    # 4. Look for company name with ® followed by address lines
    brand_with_addr = re.search(
        r"^([A-Z][\w\s]+[®™]?)\s*\n\s*(\d+\s+[A-Za-z].*?)(?:\n\s*\n|\Z)",
        t, re.MULTILINE | re.DOTALL
    )
    if brand_with_addr:
        company = brand_with_addr.group(1).strip()
        addr_block = brand_with_addr.group(2).strip()
        addr_lines = [l.strip() for l in addr_block.splitlines() if l.strip()]
        if addr_lines:
            return company + ", " + ", ".join(addr_lines)

    # 5. Look for the Manufacturer block with the ISO symbol marker ⌂
    # Sometimes OCR renders the factory symbol as special characters
    mfr_block = _f(t, r"(?:Manufacturer|MANUFACTURER)\s+([\w][\w\s®™\.,\-&]+)")
    if mfr_block and not re.search(r"consult|instruction|warning|caution|sterile", mfr_block, re.IGNORECASE):
        return mfr_block

    return None


def _extract_udi(t: str) -> str:
    """Extract UDI (Unique Device Identifier) — GS1, HIBC, or bare GTIN."""

    # 1. Explicit UDI label
    udi = _f(t, r"(?:^|\s)UDI[:\-]?\s*(\(01\)[0-9A-Za-z\(\)\-]+)")
    if udi:
        return udi

    # 2. Full GS1 string: (01)NNNNN...(17)NNNNNN(21)NNNNN... or (10)NNNNN
    # Allow spaces between AI groups (OCR often adds spaces)
    gs1 = re.search(
        r"\(01\)\s*(\d{8,14})\s*(?:\((\d{2})\)\s*([A-Za-z0-9\-]+)\s*)*",
        t
    )
    if gs1:
        # Rebuild the full UDI string from the match area
        full_match = gs1.group(0).strip()
        # Try to get a longer match that includes all AI groups
        start_pos = gs1.start()
        extended = re.search(
            r"\(01\)\s*\d{8,14}(?:\s*\(\d{2}\)\s*[A-Za-z0-9\-]+)*",
            t[start_pos:]
        )
        if extended:
            udi_str = re.sub(r'\s+', '', extended.group(0))  # Remove spaces
            return udi_str
        return re.sub(r'\s+', '', full_match)

    # 3. HIBC format
    udi = _f(t, r"(\+[A-Za-z0-9\/\-]{6,})")
    if udi:
        return udi

    # 4. Bare GTIN-14 (14 consecutive digits)
    udi = _f(t, r"(\d{14})")
    if udi:
        return udi

    return None


def _extract_lot(t: str) -> str:
    """Extract lot/batch number."""

    # 1. LOT symbol box — OCR reads LOT directly
    lot = _f(t, r"\bLOT\s*[:\-]?\s*([A-Za-z0-9\-]{3,20})\b")
    if lot:
        return lot

    # 2. Lot/Batch with label
    lot = _f(t, r"(?:lot|batch)\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Za-z0-9\-]{3,20})")
    if lot:
        return lot

    # 3. GS1 AI (10) — lot number
    lot = _f(t, r"\(10\)\s*([A-Za-z0-9\-]{3,20})")
    if lot:
        return lot

    return None


def _extract_expiry(t: str) -> str:
    """Extract expiry/use-by date."""

    # 1. USE BY / Expiry / Exp. with date
    expiry = _f(t, r"(?:use[\s\-]*by|expiry|expiration|exp\.?)\s*[:\-]?\s*(\d{4}[\-\/\.]\d{1,2}[\-\/\.]\d{1,2})")
    if expiry:
        return _normalize_date(expiry)

    expiry = _f(t, r"(?:use[\s\-]*by|expiry|expiration|exp\.?)\s*[:\-]?\s*(\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4})")
    if expiry:
        return _normalize_date(expiry)

    # 2. Standalone YYYY-MM-DD near USE BY or date keywords
    m = re.search(r"(\d{4})[\-\/\.](\d{2})[\-\/\.](\d{2})", t, re.IGNORECASE)
    if m and int(m.group(2)) <= 12 and int(m.group(3)) <= 31:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"

    # 3. DD/MM/YYYY or MM/DD/YYYY format
    expiry = _f(t, r"(\d{2}[\-\/\.]\d{2}[\-\/\.]\d{4})")
    if expiry:
        return _normalize_date(expiry)

    # 4. GS1 AI (17) YYMMDD → convert to 20YY-MM-DD
    raw_gs1 = _f(t, r"\(17\)\s*(\d{6})")
    if raw_gs1 and len(raw_gs1) == 6:
        yy = raw_gs1[0:2]
        mm = raw_gs1[2:4]
        dd = raw_gs1[4:6]
        return f"20{yy}-{mm}-{dd}"

    # 5. MM/YYYY or YYYY-MM format
    expiry = _f(t, r"(?:use[\s\-]*by|expiry|expiration|exp\.?)\s*[:\-]?\s*(\d{4}[\-\/]\d{2})")
    if expiry:
        return expiry

    expiry = _f(t, r"(\d{1,2}[\-\/]\d{4})")
    if expiry:
        return expiry

    return None


def _extract_warnings(t: str) -> str:
    """Extract warnings and safety symbols from label."""
    warnings_parts = []

    # Single use / Do not reuse (ISO 5.4.2)
    single = re.search(r"(SINGLE\s+USE|Do\s+Not\s+Re[\-]?[Uu]se|For\s+Single\s+Use)", t, re.IGNORECASE)
    if single:
        warnings_parts.append("Single Use")

    # Do not use if package is damaged (ISO 5.2.8)
    damaged = re.search(r"DO\s+NOT\s+USE\s+IF\s+PACKAGE\s+IS\s+DAMAGED", t, re.IGNORECASE)
    if not damaged:
        damaged = re.search(r"DO\s+NOT\s+USE.*?PACKAGE.*?DAMAGED", t, re.IGNORECASE)
    if damaged:
        warnings_parts.append("Do Not Use If Package Is Damaged")

    # Explicit warning/caution label
    w1 = _f(t, r"(?:warning|caution)[:\-]\s*(.{5,200}?)(?:\n|$)")
    if w1:
        warnings_parts.append(w1.strip())

    # STERILE symbol text (ISO 5.2.x)
    sterile = _f(t, r"\b(STERILE(?:\s*(?:A|EO|R))?)\b")
    if sterile:
        warnings_parts.append(sterile)

    # "Not made with natural rubber latex"
    latex = _f(t, r"(Not\s+made\s+with\s+natural\s+rubber\s+latex[^\.]*\.?)")
    if latex:
        warnings_parts.append(latex.strip())

    # "Not made with DEHP plasticizers"
    dehp = _f(t, r"(Not\s+made\s+with\s+(?:DEHP|di[\-\s]?2[\-\s]?ethylhexyl)[^\.]*\.?)")
    if dehp:
        warnings_parts.append(dehp.strip())

    # Consult IFU (ISO 5.4.3)
    ifu = re.search(r"Consult\s+Instructions?\s+for\s+Use", t, re.IGNORECASE)
    if ifu:
        warnings_parts.append("Consult Instructions for Use")

    return "; ".join(warnings_parts) if warnings_parts else None


def _extract_storage(t: str) -> str:
    """Extract storage conditions including temperature limits and handling."""
    storage_parts = []

    # Upper temperature limit (ISO 5.3.4) — "40°C UPPER LIMIT OF TEMPERATURE"
    upper_temp = re.search(
        r"(\d+)\s*[°oO℃]?\s*[Cc]?\s*(?:UPPER\s+LIMIT\s+OF\s+TEMPERATURE|upper\s+(?:temp(?:erature)?\s+)?limit)",
        t, re.IGNORECASE
    )
    if not upper_temp:
        upper_temp = re.search(
            r"UPPER\s+LIMIT\s+OF\s+TEMPERATURE\s*[:\-]?\s*(\d+)\s*[°oO℃]?\s*[Cc]?",
            t, re.IGNORECASE
        )
    if upper_temp:
        temp_val = upper_temp.group(1)
        storage_parts.append(f"Upper temperature limit: {temp_val}°C")

    # Lower temperature limit (ISO 5.3.5)
    lower_temp = re.search(
        r"(\d+)\s*[°oO℃]?\s*[Cc]?\s*(?:LOWER\s+LIMIT\s+OF\s+TEMPERATURE|lower\s+(?:temp(?:erature)?\s+)?limit)",
        t, re.IGNORECASE
    )
    if lower_temp:
        temp_val = lower_temp.group(1)
        storage_parts.append(f"Lower temperature limit: {temp_val}°C")

    # Temperature range: "15°C to 30°C" or "15-30°C" or "Store at 15-30C"
    if not storage_parts:
        temp_range = _f(t, r"(?:store\s*(?:at|between)?|temperature)[:\-]?\s*(-?\d+\s*[°oO℃]?\s*[Cc]?\s*(?:to|[-–])\s*-?\d+\s*[°oO℃]?\s*[Cc]?)")
        if temp_range:
            storage_parts.append(temp_range)

    # Explicit storage statement
    if not storage_parts:
        storage_stmt = _f(t, r"(?:storage|store\s*(?:at|between|below)|keep\s*(?:at|below|between))[:\-]?\s*(.+?)(?:\n|$)")
        if storage_stmt:
            storage_parts.append(storage_stmt)

    # Keep Dry (ISO 5.3.6) — umbrella symbol
    keep_dry = re.search(r"KEEP\s+DRY", t, re.IGNORECASE)
    if keep_dry:
        storage_parts.append("Keep Dry")

    # Protect from sunlight
    protect_sun = re.search(r"(?:protect\s+from\s+(?:sun)?light|keep\s+away\s+from\s+light)", t, re.IGNORECASE)
    if protect_sun:
        storage_parts.append("Protect from sunlight")

    # Protect from moisture
    protect_moisture = re.search(r"(?:protect\s+from\s+moisture|store\s+in\s+(?:a\s+)?dry\s+place)", t, re.IGNORECASE)
    if protect_moisture:
        storage_parts.append("Protect from moisture")

    return "; ".join(storage_parts) if storage_parts else None


def _extract_mah(t: str) -> str:
    """Extract Marketing Authorization Holder."""
    mah = _f(t, r"(?:mah|marketing\s*auth(?:ori[sz]ation)?\s*holder)[:\-]?\s*(.+?)(?:\n|$)")
    if mah:
        return mah

    # Japanese label patterns
    mah = _f(t, r"(?:販売|製造|認証)[^\\n]*")
    if mah:
        return mah

    return None


def _extract_uk_rep(t: str) -> str:
    """Extract UK Responsible Person or EC REP."""

    # 1. Explicit UK Responsible Person label
    uk_rep = _f(t, r"(?:uk\s*responsible\s*person|uk\s*rep(?:resentative)?|ukrp)[:\-]?\s*(.+?)(?:\n|$)")
    if uk_rep:
        return uk_rep

    # 2. EC REP box — company name on same or next line
    uk_rep = _f(t, r"EC\s*REP[:\-]?\s*([A-Z][A-Za-z][\w\s\.,\-&]{2,50})(?:\n|$)")
    if uk_rep:
        return uk_rep

    uk_rep = _f(t, r"EC\s*REP\s*\n\s*([A-Z][A-Za-z][\w\s\.,\-&]{2,50})", multiline=True)
    if uk_rep:
        return uk_rep

    # 3. Authorised representative
    uk_rep = _f(t, r"(?:authoris(?:ed|ed)\s*representative)[:\-]?\s*(.+?)(?:\n|$)")
    if uk_rep:
        return uk_rep

    # 4. Look for a UK-address block (company name + UK postcode pattern)
    # UK postcodes: XX## #XX format
    uk_block = re.search(
        r"([A-Z][A-Za-z]+(?:\s+[A-Za-z]+){0,5})\s*\n\s*([A-Za-z]+(?:shire|bury|ham|field|pool|ford|bridge|gate|wick|mouth)?)\s*\n\s*([A-Z]{1,2}\d{1,2}\s*\d[A-Z]{2})\s*(?:UK|United\s*Kingdom)?",
        t, re.IGNORECASE
    )
    if uk_block:
        parts = [uk_block.group(1).strip(), uk_block.group(2).strip(), uk_block.group(3).strip()]
        # Check if there's "UK" after
        full = uk_block.group(0)
        if re.search(r"UK", full):
            parts.append("UK")
        return ", ".join(parts)

    # 5. Look for MedDevFront UK or similar pattern with address
    uk_company = re.search(
        r"((?:MedDev\w*|[A-Z][a-z]+(?:[A-Z][a-z]+)+)\s+UK)\s*\n?\s*([A-Za-z]+(?:shire|bury|ham|field|pool|ford|bridge|gate|wick|mouth)?)\s*\n?\s*([A-Z]{1,2}\d{1,2}\s*\d[A-Z]{2})\s*(?:UK)?",
        t, re.IGNORECASE
    )
    if uk_company:
        parts = [uk_company.group(1).strip(), uk_company.group(2).strip(), uk_company.group(3).strip(), "UK"]
        return ", ".join(parts)

    return None


def _extract_license(t: str) -> str:
    """Extract manufacturing/import license numbers."""

    # Manufacturing license
    lic = _f(t, r"(?:mfg\.?\s*lic(?:ense|ence)?\.?\s*no\.?|manufacturing\s*licen[cs]e\s*(?:no\.?)?)[:\-]?\s*([A-Za-z0-9\/\-\.]{5,30})")
    if lic:
        return lic

    # Import license
    lic = _f(t, r"(?:imp(?:ort)?\s*lic(?:ense|ence)?\.?\s*no\.?)[:\-]?\s*([A-Za-z0-9\/\-\.]{5,30})")
    if lic:
        return lic

    # Indian format: MFG/MD/YYYY/NNNNNN
    lic = _f(t, r"(?:MFG\/MD|MFG\/IMP)[\/\s]*([0-9]{4}\/[0-9]{6})")
    if lic:
        return lic

    # Generic license number
    lic = _f(t, r"(?:lic(?:ense|ence)?\s*no\.?)[:\-]?\s*([A-Za-z0-9\/\-\.]{5,30})")
    if lic:
        return lic

    # CDSCO / MDL
    lic = _f(t, r"(?:CDSCO|MDL)\s*[:\-]?\s*([A-Za-z0-9\/\-]{5,30})")
    if lic:
        return lic

    # Direct Indian license number: Letter/YYYY/NNNNNN
    lic = _f(t, r"\b([A-Z]\/\d{4}\/\d{6})\b")
    if lic:
        return lic

    # Alphanumeric license code: "1232XX-112I-4545"
    lic = _f(t, r"\b([A-Z0-9]{4,8}-[A-Z0-9]{3,6}-[A-Z0-9]{3,6})\b")
    if lic:
        return lic

    return None


def _extract_rx_only(t: str) -> str:
    """Extract Rx Only indication."""
    # The Rx symbol is often misread by OCR
    rx_raw = _f(t, r"\b([PFRB][xX\*\,\.\-\s]*(?:Only|ony|omy)|Rx\s*(?:Only|ony|omy)|R\s*x\s*(?:Only|ony|omy)|Romy|Rony)\b")
    if rx_raw:
        return "Rx Only"

    rx = _f(t, r"(prescription\s*only|federal\s*law\s*restricts)")
    if rx:
        return "Rx Only"

    return None


# ═══════════════════════════════════════════════════════════════════════════════
# OCR Engine — Image Processing
# ═══════════════════════════════════════════════════════════════════════════════

def _ocr_image(file_bytes: bytes) -> str:
    """Run Tesseract OCR with enhanced preprocessing for medical labels."""
    if not TESSERACT_OK:
        return ""

    img = Image.open(io.BytesIO(file_bytes))

    # Convert to RGB if needed (handle RGBA, palette, etc.)
    if img.mode not in ('L', 'RGB'):
        img = img.convert('RGB')

    # Strategy: try multiple preprocessing approaches, pick best result
    results = []

    # Approach 1: Grayscale + upscale + sharpen
    img_gray = img.convert('L')
    width, height = img_gray.size
    scale = max(2, min(4, 3000 // max(width, 1)))  # Scale to ~3000px wide
    img_up = img_gray.resize((width * scale, height * scale), Image.LANCZOS)
    img_sharp = img_up.filter(ImageFilter.SHARPEN)
    text1 = pytesseract.image_to_string(img_sharp, config='--oem 3 --psm 6')
    results.append(text1)

    # Approach 2: Enhanced contrast + threshold
    img_enhanced = ImageEnhance.Contrast(img_up).enhance(2.0)
    # Apply simple threshold to make text crisper
    img_thresh = img_enhanced.point(lambda x: 0 if x < 140 else 255, '1')
    text2 = pytesseract.image_to_string(img_thresh, config='--oem 3 --psm 6')
    results.append(text2)

    # Approach 3: PSM 4 (assume single column) for better block detection
    text3 = pytesseract.image_to_string(img_sharp, config='--oem 3 --psm 4')
    results.append(text3)

    # Pick the result with the most text content (usually the most accurate)
    best = max(results, key=lambda r: len(r.strip()))

    logger.info("OCR results lengths: approach1=%d, approach2=%d, approach3=%d, using=%d",
                len(text1.strip()), len(text2.strip()), len(text3.strip()), len(best.strip()))

    return best


def _ocr_pdf(file_bytes: bytes) -> str:
    if not PDF_OK:
        return ""
    pages = convert_from_bytes(file_bytes, first_page=1, last_page=1, dpi=300)
    if not pages:
        return ""
    return _ocr_image(_pil_to_bytes(pages[0]))


def _pil_to_bytes(img) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ═══════════════════════════════════════════════════════════════════════════════
# Utility Functions
# ═══════════════════════════════════════════════════════════════════════════════

def _f(text: str, pattern: str, multiline: bool = False):
    """Safe regex search — always returns string or None."""
    try:
        flags = re.IGNORECASE | re.MULTILINE if multiline else re.IGNORECASE
        match = re.search(pattern, text, flags)
        if match:
            result = match.group(1)
            if isinstance(result, str):
                return result.strip()
    except Exception:
        pass
    return None


def _first_line(text: str):
    for line in text.splitlines():
        cleaned = line.strip()
        if cleaned and len(cleaned) > 3:
            return cleaned
    return None


def _normalize_date(date_str: str) -> str:
    """Normalize a date string to YYYY-MM-DD if possible."""
    date_str = date_str.strip()
    # Already YYYY-MM-DD
    m = re.match(r"(\d{4})[\-\/\.](\d{1,2})[\-\/\.](\d{1,2})", date_str)
    if m:
        return f"{m.group(1)}-{m.group(2).zfill(2)}-{m.group(3).zfill(2)}"
    # DD/MM/YYYY or MM/DD/YYYY — try to parse sensibly
    m = re.match(r"(\d{1,2})[\-\/\.](\d{1,2})[\-\/\.](\d{4})", date_str)
    if m:
        a, b, year = int(m.group(1)), int(m.group(2)), m.group(3)
        if a > 12:  # Must be DD/MM/YYYY
            return f"{year}-{str(b).zfill(2)}-{str(a).zfill(2)}"
        else:
            return f"{year}-{str(a).zfill(2)}-{str(b).zfill(2)}"
    return date_str