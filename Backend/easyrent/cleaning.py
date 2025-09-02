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

    return raw_text.strip()
