import sys
sys.path.append(r"c:\Users\chllm\Downloads\MedLabel-Verify 2\MedLabel-Verify\backend")
from ocr_engine import _ocr_image, parse_fields

with open(r"C:\Users\chllm\.gemini\antigravity-ide\brain\acb51d92-6a0f-454a-9711-c441e3382495\media__1781763797940.png", "rb") as f:
    img_bytes = f.read()

text = _ocr_image(img_bytes)
print("--- RAW TESSERACT OUTPUT ---")
print(repr(text))
print("----------------------------")
print("PARSED Rx Only:", parse_fields(text)["Rx Only"])
