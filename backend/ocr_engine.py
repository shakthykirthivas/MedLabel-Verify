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
    t = re.sub(r'[|}{]', ' ', text)

    # Device Name
    device_name = _f(t, r"(?:device\s*name|product\s*name)[:\-]?\s*(.+)")
    if not device_name:
        device_name = _f(t, r"(Ultra[\w\s]+(?:Device|Implantable|Medical)[\w\s]*)")
    if not device_name:
        device_name = _f(t, r"((?:POLYMED|POLY|OMRON|PHILIPS|SIEMENS|GE|BD|BECTON)\s+[\w\s]+)")
    if not device_name:
        device_name = _first_line(t)

    # Manufacturer
    manufacturer = _f(t, r"(?:manufacturer|mfr|made\s*by|mfg\s*by)[:\-]?\s*(.+)")
    if not manufacturer:
        manufacturer = _f(t, r"([\w\s]+(?:LTD|LLC|INC|CORP|PVT\.?\s*LTD|CO|MEDICURE|MEDTECH|MEDICAL|GlobalMed)[\.]*)")

    # UDI
    udi = _f(t, r"(?:^|\s)UDI[:\-]?\s*([A-Za-z0-9\-\/\(\)\s]+)")
    if not udi:
        udi = _f(t, r"(\(01\)\s*[0-9]+(?:\s*\([0-9]+\)\s*[A-Za-z0-9]+)*)")
    if not udi:
        udi = _f(t, r"([0-9]{10,}(?:\s*[0-9]+)*)")

    # Lot Number
    lot = _f(t, r"LOT\s*[:\-]?\s*([A-Za-z0-9\-]+)")
    if not lot:
        lot = _f(t, r"(?:lot|batch)\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Za-z0-9\-]+)")
    if not lot:
        lot = _f(t, r"\(10\)\s*([A-Za-z0-9\-]+)")

    # Expiry Date
    expiry = _f(t, r"(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})")
    if not expiry:
        expiry = _f(t, r"(?:exp(?:iry|\.)?|use\s*by|expiration)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})")
    if not expiry:
        expiry = _f(t, r"\(17\)\s*(\d{6,8})")

    # Warnings
    warnings = _f(t, r"(?:warning|caution)[:\-]?\s*(.{5,150})")
    if not warnings:
        warnings = _f(t, r"(Do\s*Not\s*Reuse|Single\s*Use|Not\s*made\s*with)")
    if not warnings:
        warnings = _f(t, r"((?:not\s*made|do\s*not|single\s*use|sterile).{5,100})")

    # Storage
    storage = _f(t, r"(?:storage|store\s*(?:at|between|below)|keep\s*(?:at|below|between|dry))[:\-]?\s*(.+)")
    if not storage:
        storage = _f(t, r"(\d+\s*[°]?\s*C(?:\s*max)?)")

    # MAH
    mah = _f(t, r"(?:mah|marketing\s*auth(?:orization)?\s*holder)[:\-]?\s*(.+)")
    if not mah:
        mah = _f(t, r"(?:販売|製造|認証)[^\n]*")

    # UK Responsible Person
    uk_rep = _f(t, r"(?:uk\s*responsible\s*person|uk\s*rep(?:resentative)?|ukrp)[:\-]?\s*(.+)")
    if not uk_rep:
        uk_rep = _f(t, r"EC\s*REP[:\-]?\s*(.+)")

    # License Numbers
    license_no = _f(t, r"(?:lic(?:ense)?\s*no\.?|mfg\/imp\s*lic|MFG\/MD)[:\-]?\s*([A-Za-z0-9\/\-]+)")
    if not license_no:
        license_no = _f(t, r"(?:CDSCO|MDL|MFG|IMP)\s*[:\-]?\s*([A-Za-z0-9\/\-]+)")

    # Rx Only
    rx_only = _f(t, r"(R\s*ONLY|Rx\s*Only|prescription\s*only|federal\s*law)")

    fields = {
        "Device Name": device_name,
        "Manufacturer": manufacturer,
        "UDI": udi,
        "Lot Number": lot,
        "Expiry Date": expiry,
        "Warnings": warnings,
        "Storage Conditions": storage,
        "MAH": mah,
        "UK Responsible Person": uk_rep,
        "License Numbers": license_no,
        "Rx Only": rx_only,
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


def _f(text: str, pattern: str):
    """Safe regex search — always returns string or None."""
    try:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
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