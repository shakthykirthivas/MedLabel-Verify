import ocr_engine
import json

with open(r'C:\Users\chllm\.gemini\antigravity-ide\brain\f5c5db37-730f-4581-ba88-1ca9485a71e4\media__1782462936572.png', 'rb') as f:
    img = f.read()

text = ocr_engine.extract_text(img, 'image/png')
print('=== TEXT ===')
print(text)
print('=== FIELDS ===')
print(json.dumps(ocr_engine.parse_fields(text), indent=2))
