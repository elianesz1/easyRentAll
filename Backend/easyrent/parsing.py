import json
import re
import unicodedata

def parse_gpt_output_safe(raw_text: str):
    """
    Best-effort sanitizer for mixed RTL/LTR JSON. Returns dict or None.
    """
    cleaned = unicodedata.normalize("NFC", raw_text)

    # Normalize quotes
    cleaned = (cleaned
        .replace("“", '"').replace("”", '"')
        .replace("„", '"')
        .replace("’", "'").replace("‘", "'")
        .replace("`", "'")
    )

    # Replace ASCII double-quotes inside Hebrew letters with U+05F4 (gershayim)
    cleaned = re.sub(r'(?<=[\u0590-\u05FF])"(?=[\u0590-\u05FF])', '\u05F4', cleaned)

    # Strip invisibles
    cleaned = cleaned.replace("\ufeff", "").replace("\u00a0", " ")
    for ch in ["\u200e", "\u200f", "\u200c", "\u200d"]:
        cleaned = cleaned.replace(ch, "")
    cleaned = re.sub(r"[\u202a-\u202e\u2066-\u2069]", "", cleaned)

    try:
        return json.loads(cleaned)
    except Exception as e:
        print(f"JSON decode failed: {e}")
        try:
            msg = str(e)
            if "char" in msg:
                idx = int(msg.split("char")[1].split(")")[0].strip())
                start = max(0, idx - 60)
                end = min(len(cleaned), idx + 60)
                snippet = cleaned[start:end]
                print("Around error (repr):", repr(snippet))
                print("Code points:", [hex(ord(c)) for c in snippet])
        except Exception:
            pass
        return None
