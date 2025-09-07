import re

def clean_post_text(raw_text: str) -> str:
    """
    Remove FB boilerplate (timestamps, reactions UI, shared-with hints),
    and keep only the meaningful description text.
    """
    raw_text = raw_text.strip().replace('\u200f', '').replace('\xa0', ' ')

    time_pattern = r"\d+\s*(ימים|שעות|שניה|שניות|דקות)"
    start_keywords = [r"משותף עם: קבוצה ציבורית", time_pattern]
    min_start = 0
    for pattern in start_keywords:
        match = re.search(pattern, raw_text)
        if match:
            min_start = max(min_start, match.end())
    raw_text = raw_text[min_start:].lstrip(" ·\n")

    end_patterns = [
        r"\+\d[\d,\.₪ ]* · .*?TA.*?דירה עם.*?חדרי אמבטיה",
        r"תל אביב.*?TA.*?דירה עם.*?חדרי אמבטיה",
        r"הודעה\s*לייק\s*תגובה\s*שיתוף",
        r"כתיבת תגובה ציבורית.*$"
    ]
    for pattern in end_patterns:
        match = re.search(pattern, raw_text, re.DOTALL)
        if match:
            raw_text = raw_text[:match.start()]
            break
    
    # --- NEW: strip FB "write a comment" prompts & marketing footers ---
    fb_trailers = [
        r"שלחי את התגובה הראשונה שלך.*$",
        r"שלחו את התגובה הראשונה שלכם.*$",
        r"כתובי תגובה.*$",
        r"כתבו תגובה.*$",
        r"Write a comment.*$",
        r"Send the first reply.*$",
        r"למידע נוסף על נכס זה.*$",
        r"For more information about this property.*$",
        r"WhatsApp\s*:.*$",
        r"קבוצת .{0,40} רשת סוכנויות.*$",   # חתימות סוכנויות כלליות
    ]
    for pattern in fb_trailers:
        raw_text = re.sub(pattern, "", raw_text, flags=re.IGNORECASE | re.DOTALL).strip()

    # --- NEW: collapse duplicate lines/blocks (e.g., repeated translation) ---
    lines = [ln.strip(" ·•-—\u2022") for ln in raw_text.splitlines()]
    uniq = []
    seen = set()
    for ln in lines:
        if not ln:
            continue
        key = re.sub(r"\s+", " ", ln)
        if key not in seen:
            seen.add(key)
            uniq.append(ln)
    raw_text = "\n".join(uniq)

    # --- NEW: trim trailing dots/bullets ---
    raw_text = re.sub(r"[·•\.\s]+$", "", raw_text).strip()
    
    return raw_text.strip()
