from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import database
import ocr_engine
import compliance

# Configure logging so OCR debug output is visible
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/search")
async def search(device: str):
    result = await database.search_device(device)
    if not result:
        return {"error": "Device not found", "device": None}
    return {"device": result, "requirements": result.pop("requirements")}

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    logger.info("Upload received: filename=%s, content_type=%s", file.filename, file.content_type)
    contents = await file.read()
    logger.info("File size: %d bytes", len(contents))

    raw_text = ocr_engine.extract_text(contents, file.content_type)
    if not raw_text or not raw_text.strip():
        logger.warning("OCR returned empty text for file: %s", file.filename)
        return {
            "error": None,
            "raw_text": "",
            "extracted_fields": {k: None for k in [
                "Device Name", "Manufacturer", "UDI", "Lot Number",
                "Expiry Date", "Warnings", "Storage Conditions", "MAH",
                "UK Responsible Person", "License Numbers", "Rx Only",
            ]},
            "compliance": compliance.score_all_countries({}),
            "best_match": "USA"
        }

    logger.info("OCR extracted %d characters of text", len(raw_text))
    fields = ocr_engine.parse_fields(raw_text)
    logger.info("Parsed fields: %s", {k: (v[:60] + '...' if v and len(v) > 60 else v) for k, v in fields.items()})

    scores = compliance.score_all_countries(fields)
    best = compliance.best_match(scores)

    return {
        "extracted_fields": fields,
        "compliance": scores,
        "best_match": best,
        "raw_text": raw_text
    }

@app.post("/debug-ocr")
async def debug_ocr(file: UploadFile = File(...)):
    contents = await file.read()
    raw_text = ocr_engine.extract_text(contents, file.content_type)
    fields = ocr_engine.parse_fields(raw_text)
    return {"raw_text": raw_text, "parsed_fields": fields}