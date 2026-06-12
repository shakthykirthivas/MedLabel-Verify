from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import database
import ocr_engine
import compliance

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
    contents = await file.read()
    raw_text = ocr_engine.extract_text(contents, file.content_type)
    fields = ocr_engine.parse_fields(raw_text)
    scores = compliance.score_all_countries(fields)
    best = compliance.best_match(scores)
    return {
        "extracted_fields": fields,
        "compliance": scores,
        "best_match": best
    }

@app.post("/debug-ocr")
async def debug_ocr(file: UploadFile = File(...)):
    contents = await file.read()
    raw_text = ocr_engine.extract_text(contents, file.content_type)
    return {"raw_text": raw_text}