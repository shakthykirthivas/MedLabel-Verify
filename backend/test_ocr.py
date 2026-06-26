import ocr_engine
import json

image_path = r"C:/Users/chllm/.gemini/antigravity-ide/brain/85998868-8f4e-4e08-a41b-7da660ce09ed/media__1782292428475.png"
with open(image_path, "rb") as f:
    img_bytes = f.read()

raw_text = ocr_engine.extract_text(img_bytes, "image/png")
print("=== RAW TEXT ===")
print(raw_text)
print("=== PARSED FIELDS ===")
fields = ocr_engine.parse_fields(raw_text)
print(json.dumps(fields, indent=2))
