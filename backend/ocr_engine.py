"""
ocr_engine.py — OCR extraction and field parsing for MedLabel Verify
"""

import re
import io
import logging

logger = logging.getLogger(__name__)

try:
    import pytesseract
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    from PIL import Image
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
    text = raw_text.strip()
    # Normalise OCR noise but preserve newlines for boundary detection
    t = re.sub(r'[|}{@]', ' ', text)
    t = re.sub(r'[ \t]+', ' ', t)   # collapse spaces/tabs only, keep newlines

    # ── Device Name ──────────────────────────────────────────────────────────
    device_name = _f(t, r"(?:device\s*name|product\s*name)[:\-]?\s*(.+)")
    if not device_name:
        # REF symbol (ISO 5.1.6) — catalogue/model number on same line
        device_name = _f(t, r"REF\s+([A-Za-z0-9][A-Za-z0-9\s\-\/]{2,40})")
    if not device_name:
        # Brand + product keyword on one line e.g. "POLYMED NEBULIZER MASK"
        device_name = _f(t, r"^((?:POLYMED|OMRON|PHILIPS|SIEMENS|GE|BD|BECTON|MEDTRONIC|ABBOTT|STRYKER)\s+[A-Z][A-Z\s\-]{3,50})$", multiline=True)
    if not device_name:
        # Look for Title-Case or ALL-CAPS standalone device name line
        # Skip lines that are clearly descriptions, addresses, or codes
        SKIP_PREFIXES = re.compile(
            r"^(EN\s|Prefabricated|Quantity|REF|LOT|Mfg|Tel|Email|Batch|Exp|MD\s|EC\s|UDI|Consult|\(0|www\.|http)",
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
                device_name = stripped
                break
    if not device_name:
        device_name = _first_line(t)

    # ── Manufacturer ─────────────────────────────────────────────────────────
    ADDRESS_STOP = r"(?=\s*(?:plot|sector|street|road|village|phase|block|pin\s*\d|p\.o\.|dist\.|p\.s\.|hsiidc|industrial|area|bahadur|faridabad|haryana|india|\d{6}))"

    manufacturer = _f(t, r"(?:manufacturer|mfr\.?|made\s*by|mfg\.?\s*by|manufactured\s*by)[:\-]?\s*([A-Z][\w\s\.,\-&]+?(?:LTD\.?|LLC\.?|INC\.?|CORP\.?|PVT\.?\s*LTD\.?|MEDICURE|MEDTECH|MEDICAL|HEALTHCARE|SURGICAL|BIOTECH|EXPERTS)\.?)")
    if not manufacturer:
        # Match company name on line immediately after manufacturer logo/address block
        # Catches "MedDev Experts", "POLYMED Healthcare LTD" etc.
        manufacturer = _f(t, r"^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4})\s*\n\s*(?:Shivalik|Plot|Sector|Road|Nagar|Street|Block|Phase|\d)", multiline=True)
    if not manufacturer:
        manufacturer = _f(t, r"((?:[A-Z][A-Z\s&\-]{2,40}?\s+)(?:LTD\.?|PVT\.?\s*LTD\.?|MEDICURE|MEDICAL|HEALTHCARE|SURGICAL|EXPERTS)\.?)" + ADDRESS_STOP)
    if not manufacturer:
        manufacturer = _f(t, r"([\w][\w\s\-\.,]+(?:LTD\.?|LLC\.?|INC\.?|CORP\.?|PVT\.?\s*LTD\.?|MEDICURE|MEDTECH|MEDICAL|GlobalMed|EXPERTS)\.?)")
    # Safety: never let "Consult instructions" or similar slip through as manufacturer
    if manufacturer and re.search(r"consult|instruction|warning|caution|sterile", manufacturer, re.IGNORECASE):
        manufacturer = None

    # ── UDI ──────────────────────────────────────────────────────────────────
    # GS1 strict: (01) + 14 digits, optionally followed by (17)YYMMDD and (10)lot
    udi = _f(t, r"(?:^|\s)UDI[:\-]?\s*(\(01\)[0-9]{8,}(?:\([0-9]+\)[A-Za-z0-9\-]+)*)")
    if not udi:
        # Full GS1 string starting with (01) — require at least 8 digits after (01)
        udi = _f(t, r"(\(01\)[0-9]{8,14}(?:\s*\([0-9]{2}\)[A-Za-z0-9\-]+)*)")
    if not udi:
        udi = _f(t, r"(\+[A-Za-z0-9\/\-]{6,})")   # HIBC format
    if not udi:
        udi = _f(t, r"([0-9]{14})")                # bare GTIN-14

    # ── Lot Number ───────────────────────────────────────────────────────────
    # ISO 5.1.5 LOT symbol box — OCR reads LOT directly; also GS1 AI (10)
    lot = _f(t, r"\bLOT\s*[:\-]?\s*([A-Za-z0-9\-]{3,20})\b")
    if not lot:
        lot = _f(t, r"(?:lot|batch)\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Za-z0-9\-]{3,20})")
    if not lot:
        lot = _f(t, r"\(10\)\s*([A-Za-z0-9\-]{3,20})")

    # ── Expiry Date ──────────────────────────────────────────────────────────
    expiry = _f(t, r"(?:use[\s\-]*by|expiry|expiration|exp\.?)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})")
    if not expiry:
        # Only match if it looks like a valid date (month 01-12, day 01-31)
        m = re.search(r"(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})", t, re.IGNORECASE)
        if m and int(m.group(2)) <= 12 and int(m.group(3)) <= 31:
            expiry = f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    if not expiry:
        expiry = _f(t, r"(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})")
    if not expiry:
        # GS1 AI (17) YYMMDD → convert to 20YY-MM
        raw_gs1 = _f(t, r"\(17\)\s*(\d{6})")
        if raw_gs1 and len(raw_gs1) == 6:
            yy = raw_gs1[0:2]
            mm = raw_gs1[2:4]
            dd = raw_gs1[4:6]
            expiry = f"20{yy}-{mm}-{dd}"
        elif raw_gs1:
            expiry = raw_gs1
    if not expiry:
        # Plain Exp. Date: 2025-06 or similar on label
        expiry = _f(t, r"[Ee]xp\.?\s*[Dd]ate?\s*[:\-]?\s*(\d{4}[\-\/]\d{2}(?:[\-\/]\d{2})?)")
    if not expiry:
        expiry = _f(t, r"(\d{1,2}[\/\-]\d{4})")

    # ── Warnings ─────────────────────────────────────────────────────────────
    # ONLY match actual warning/safety phrases — never addresses or company info
    # Order: explicit warning keyword → STERILE symbol → known safety phrases
    warnings_parts = []

    # Explicit warning/caution label
    w1 = _f(t, r"(?:warning|caution)[:\-]\s*(.{5,200}?)(?:\n|$)")
    if w1:
        warnings_parts.append(w1.strip())

    # ISO 5.2.x STERILE symbol text
    sterile = _f(t, r"\b(STERILE(?:\s*(?:A|EO|R))?)\b")
    if sterile:
        warnings_parts.append(sterile)

    # "Not made with natural rubber latex" — common on Indian labels
    latex = _f(t, r"(Not\s+made\s+with\s+natural\s+rubber\s+latex[^\.]*\.?)")
    if latex:
        warnings_parts.append(latex.strip())

    # "Not made with DEHP plasticizers"
    dehp = _f(t, r"(Not\s+made\s+with\s+(?:DEHP|di[\-\s]?2[\-\s]?ethylhexyl)[^\.]*\.?)")
    if dehp:
        warnings_parts.append(dehp.strip())

    # Single use / Do not reuse
    single = _f(t, r"((?:Single\s+Use\s+Only|Do\s+Not\s+Re[\-]?[Uu]se|For\s+Single\s+Use))")
    if single:
        warnings_parts.append(single)

    # Consult IFU
    ifu = _f(t, r"(Consult\s+Instructions?\s+for\s+Use)")
    if ifu:
        warnings_parts.append(ifu)

    warnings = "; ".join(warnings_parts) if warnings_parts else None

    # ── Storage Conditions ───────────────────────────────────────────────────
    storage = _f(t, r"(?:storage|store\s*(?:at|between|below)|keep\s*(?:at|below|between))[:\-]?\s*(.+?)(?:\n|$)")
    if not storage:
        storage = _f(t, r"\b([Kk]eep\s+[Dd]ry|[Ss]tore\s+in\s+a?\s*dry\s+place|[Pp]rotect\s+from\s+moisture)\b")
    if not storage:
        # Temperature range: "15°C to 30°C" or "15oC - 30oC" or "15 C to 30 C"
        storage = _f(t, r"(-?\d+\s*[°oO℃]?\s*[Cc]\s*(?:to|[-–])\s*-?\d+\s*[°oO℃]?\s*[Cc])")
    if not storage:
        # Two separate temperatures on label like "15°C ... 30°C"
        # Match the range by finding both numbers near each other
        storage = _f(t, r"(\d{1,2}\s*[°oO]?\s*[Cc]\b.*?\b\d{1,2}\s*[°oO]?\s*[Cc])")
    if not storage:
        storage = _f(t, r"(\d+\s*[°]?\s*C(?:\s*max)?)")

    # ── MAH ──────────────────────────────────────────────────────────────────
    mah = _f(t, r"(?:mah|marketing\s*auth(?:ori[sz]ation)?\s*holder)[:\-]?\s*(.+?)(?:\n|$)")
    if not mah:
        mah = _f(t, r"(?:販売|製造|認証)[^\n]*")

    # ── UK Responsible Person ─────────────────────────────────────────────────
    uk_rep = _f(t, r"(?:uk\s*responsible\s*person|uk\s*rep(?:resentative)?|ukrp)[:\-]?\s*(.+?)(?:\n|$)")
    if not uk_rep:
        # EC REP box — company name follows on same line or next line
        uk_rep = _f(t, r"EC\s*REP[:\-]?\s*([A-Z][A-Za-z][\w\s\.,\-&]{2,50})(?:\n|$)")
    if not uk_rep:
        uk_rep = _f(t, r"EC\s*REP\s*\n\s*([A-Z][A-Za-z][\w\s\.,\-&]{2,50})", multiline=True)
    if not uk_rep:
        uk_rep = _f(t, r"(?:authoris(?:ed|ed)\s*representative)[:\-]?\s*(.+?)(?:\n|$)")

    # ── License Numbers ───────────────────────────────────────────────────────
    license_no = _f(t, r"(?:mfg\.?\s*lic(?:ense|ence)?\.?\s*no\.?|manufacturing\s*licen[cs]e\s*(?:no\.?)?)[:\-]?\s*([A-Za-z0-9\/\-\.]{5,30})")
    if not license_no:
        license_no = _f(t, r"(?:imp(?:ort)?\s*lic(?:ense|ence)?\.?\s*no\.?)[:\-]?\s*([A-Za-z0-9\/\-\.]{5,30})")
    if not license_no:
        license_no = _f(t, r"(?:MFG\/MD|MFG\/IMP)[\/\s]*([0-9]{4}\/[0-9]{6})")
    if not license_no:
        license_no = _f(t, r"(?:lic(?:ense|ence)?\s*no\.?)[:\-]?\s*([A-Za-z0-9\/\-\.]{5,30})")
    if not license_no:
        license_no = _f(t, r"(?:CDSCO|MDL)\s*[:\-]?\s*([A-Za-z0-9\/\-]{5,30})")
    if not license_no:
        # Direct Indian license number pattern: Letter/YYYY/NNNNNN
        license_no = _f(t, r"\b([A-Z]\/\d{4}\/\d{6})\b")
    if not license_no:
        # MFG/MD/YYYY/NNNNNN pattern
        license_no = _f(t, r"\b((?:ML|MFG|IMP)\s*[\/\s]\s*(?:NFGIMD|NFGMD|MD|IMP)?[\/\s]\s*\d{4}[\/\s]\d{6})\b")
    if not license_no:
        # Alphanumeric license code pattern: e.g. "1232XX-112I-4545" or "1232XX-1121-4545"
        # Format: digits+letters, hyphen-separated segments
        license_no = _f(t, r"\b([A-Z0-9]{4,8}-[A-Z0-9]{3,6}-[A-Z0-9]{3,6})\b")

    # ── Rx Only ──────────────────────────────────────────────────────────────
    # The Rx symbol is often misread by OCR as Px, Bx, FX, R*, or separated letters. "Only" can be misread as "ony", "omy", etc.
    rx_raw = _f(t, r"\b([PFRB][xX\*\,\.\-\s]*(?:Only|ony|omy)|Rx\s*(?:Only|ony|omy)|R\s*x\s*(?:Only|ony|omy)|Romy|Rony)\b")
    if rx_raw:
        rx_only = "Rx Only"
    else:
        rx_only = _f(t, r"(prescription\s*only|federal\s*law\s*restricts)")

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


def _ocr_image(file_bytes: bytes) -> str:
    if not TESSERACT_OK:
        return ""
    img = Image.open(io.BytesIO(file_bytes))
    img = img.convert('L')
    width, height = img.size
    img = img.resize((width * 2, height * 2), Image.LANCZOS)
    custom_config = r'--oem 3 --psm 6'
    return pytesseract.image_to_string(img, config=custom_config)


def _ocr_pdf(file_bytes: bytes) -> str:
    if not PDF_OK:
        return ""
    pages = convert_from_bytes(file_bytes, first_page=1, last_page=1, dpi=200)
    if not pages:
        return ""
    return _ocr_image(_pil_to_bytes(pages[0]))


def _pil_to_bytes(img) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


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