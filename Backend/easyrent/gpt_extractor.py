# -*- coding: utf-8 -*-
"""
Extractor for EasyRent: robust neighborhood detection for Tel Aviv–Yafo.
- Builds a strict prompt with canonical neighborhoods.
- Injects street/landmark maps into the prompt (readable to the LLM).
- Applies deterministic post-processing guardrails to fix/override the model.
"""

from datetime import datetime
from openai import OpenAI
from .config import OPENAI_API_KEY, OPENAI_MODEL, OPENAI_TEMPERATURE, OPENAI_MAX_TOKENS
from .parsing import parse_gpt_output_safe
from .neighborhoods import NEIGHBORHOOD_EN_TO_HE  # canonical EN->HE mapping (single source of truth)

# Gazetteer seed (anchor data for deterministic neighborhood decisions)
from easyrent.geo.ta_gazetteer import (
    AMBIGUOUS_LONG_STREETS,
    LANDMARK_TO_NEI_EN,
    NEIGH_SYNONYMS_HE_TO_EN,
    STREET_TO_NEI_EN,
)

import re
from typing import Optional


# ---------- Deterministic helpers ----------

def _norm_he(s: Optional[str]) -> str:
    """Normalize Hebrew-ish text: collapse whitespace and strip."""
    return re.sub(r'\s+', ' ', s or '').strip()


def deterministic_neighborhood(address: Optional[str], full_text: Optional[str]) -> Optional[str]:
    """
    Deterministically choose a canonical EN neighborhood when possible.
    Precedence: Street > Landmark > Explicit Hebrew neighborhood > (Ambiguous street? return None).
    Returns a canonical EN neighborhood (key in NEIGHBORHOOD_EN_TO_HE) or None.
    """
    addr = _norm_he(address)
    t = _norm_he(full_text)

    # 1) Street (exact name, optionally followed by a number) — strongest signal
    for street, nei in STREET_TO_NEI_EN.items():
        # Matches: start|space|comma + street + (optional number) + end|space|comma
        if re.search(rf'(?:^|[\s,]){re.escape(street)}(?:[\s,]\d+)?(?:$|[\s,])', addr):
            return nei

    # 2) Landmark (strong, but weaker than a concrete street address)
    for lm, nei in LANDMARK_TO_NEI_EN.items():
        if lm in t or lm in addr:
            return nei

    # 3) Explicit Hebrew neighborhood tokens in text/address
    for he, en in NEIGH_SYNONYMS_HE_TO_EN.items():
        if he in t or he in addr:
            return en

    # 4) Ambiguous long streets without disambiguation → do not infer
    for amb in AMBIGUOUS_LONG_STREETS:
        if amb in addr and not any(lm in t for lm in LANDMARK_TO_NEI_EN):
            return None

    return None


# ---------- OpenAI client ----------

client = OpenAI(api_key=OPENAI_API_KEY)


# ---------- Main extraction ----------

def extract_apartment_data(post_text: str):
    """
    Call the LLM with a strict prompt to extract structured apartment data.
    Neighborhood must be one of the canonical English names (or null if uncertain).
    The canonical list is injected dynamically from NEIGHBORHOOD_EN_TO_HE (single source of truth).
    """
    current_year = datetime.now().year

    # A) Canonical EN neighborhood list (shown to the model, must match your NEIGHBORHOOD_EN_TO_HE keys)
    canonical_list = "- " + "\n- ".join(sorted(NEIGHBORHOOD_EN_TO_HE.keys()))

    # B) Gazetteer blocks injected into the prompt (human-readable to the model)
    street_map_block   = "\n".join([f"- {k} → {v}" for k, v in STREET_TO_NEI_EN.items()])
    landmark_map_block = "\n".join([f"- {k} → {v}" for k, v in LANDMARK_TO_NEI_EN.items()])
    ambiguous_block    = "- " + "\n- ".join(sorted(AMBIGUOUS_LONG_STREETS))

    # C) Prompt (strict). Note the doubled {{ }} inside f-string for literal JSON braces.
    prompt = f"""
You are a data extraction assistant specializing in Israeli real estate posts on Facebook.

TASK: Extract data from this Facebook post about apartments for rent in Tel Aviv.

CRITICAL INSTRUCTIONS:
1) Most Facebook posts ARE apartment listings unless they're clearly just brief comments.
2) For the "neighborhood" field, you MUST return either:
   - EXACTLY one canonical Tel Aviv neighborhood name (from the list below; strict spelling), OR
   - null if you are not 100% certain. Never invent or approximate.
3) Dates: Only if the post explicitly states a start date, return it in YYYY-MM-DD.
   - If date has no year, use the CURRENT YEAR ({current_year}).
   - If there is NO explicit date, set "available_from": null (never guess).
4) Address:
   - KEEP THE STREET NAME IN HEBREW (name + number if available).
   - Strip marketing adjectives (e.g., 'יוקרתי', 'מדהים', 'מושלם', 'מטופח', ...).
   - Extract even if preceded by 'ברחוב', 'באזור', etc.
5) If the post mixes listing + comments, focus ONLY on the listing details.
6) Fields title, description, and address are in Hebrew.

NEIGHBORHOOD DETERMINATION (STRICT):
A) EXPLICIT MENTIONS (highest priority)
   - If the text explicitly says "בשכונת ___" / "שכונת ___" / "באזור ___" about a Tel Aviv neighborhood,
     map it EXACTLY to a canonical English name from the list below.
   - If there is no clear 1:1 match to the canonical list → neighborhood = null.
   - Examples:
     "בשכונת נווה צדק" → "Neve Tzedek"
     "שכונת פלורנטין" → "Florentin"
     "באזור הצפון הישן" → "The Old North"

B) LANDMARK/STREET MAPPING (use ONLY if there is NO explicit neighborhood)
   JAFFA & SOUTH (landmarks → canonical EN):
   - "שוק הפשפשים" / "Flea Market" / "מגדל השעון" / "Clock Tower" → "Jaffa D"
   - "שוק לוינסקי" / "Levinsky Market" / "רחוב לוינסקי" → "Florentin"

   JAFFA NEIGHBORHOODS (explicit cues → canonical EN):
   - "יפו א" / "שכונת דקר" → "Jaffa A"
   - "גבעת אנדרומדה" → "Givat Andromeda"
   - "גבעת עלייה" → "Givat Aliya"
   - "יפה נוף" → "Yafe Nof (Jaffa)"
   - "יפו ג" → "Jaffa G"
   - "יפו ד" → "Jaffa D"
   - "יפו העתיקה" / "העיר העתיקה" → "Old Jaffa"
   - "מנשייה" / "מנשייה (יפו)" → "Manshiya (Jaffa)"
   - "נווה שלום" → "Neve Shalom"
   - "סכנת א-תורכי" → "Sakanat Al-Turki"
   - "פרדס דכה" → "Pardes Daka"
   - "צהלון" → "Tzahal On"
   - "שיכוני חיסכון" → "Shikuney Chisachon"

   CENTER:
   - "שוק הכרמל" / "Carmel Market" → "Kerem HaTeimanim"
   - "נחלת בנימין" (המדרחוב) → "Nachalat Binyamin"
   - "שדרות רוטשילד" / "רוטשילד" / "גן החשמל" / "הבימה" / "דיזנגוף סנטר" → "Lev Tel Aviv (City Center)"

   OLD NORTH vs CITY CENTER (disambiguation):
   - If mentions "אבן גבירול" together with "ז'בוטינסקי" OR "בן-גוריון" OR "ארלוזורוב" (north of Dizengoff)
     OR mentions beaches/landmarks "גורדון" / "פרישמן" / "הילטון" / "נורדאו" in a northern context
     → "The Old North".
   - If mentions "דיזנגוף סנטר", "כיכר רבין", "בוגרשוב" without clear northern cues
     → "Lev Tel Aviv (City Center)".

   FAR NORTH:
   - "נמל תל אביב" / "Reading" / "רידינג" → "Kochav HaTzafon"
   - "חוף תל ברוך" → "Tel Baruch"

   OTHER:
   - "עזריאלי" / "שרונה" / "תחנת השלום" → "HaKirya"
   - "שוק התקווה" → "HaTikva"
   - "רמת החייל" / "אסותא רמת החייל" → "Ramat HaHayal"

C) VALIDATION & AMBIGUITY
   - Use ONLY names from the canonical list below (strict spelling).
   - Do NOT output "Lev Ha'Ir", "Center", "City Center" unless exactly "Lev Tel Aviv (City Center)".
   - If multiple areas are mentioned and they conflict, prefer EXPLICIT neighborhood text (A).
   - If still uncertain after A–B, set "neighborhood": null.
   - Do NOT infer from long multi-neighborhood streets (e.g., "בן יהודה") without a disambiguating landmark.

OUT-OF-SCOPE CITIES (MANDATORY RULE):
- If the listing is clearly outside Tel Aviv–Yafo (e.g., בת-ים, חולון, גבעתיים, רמת-גן, or any other city),
  you MUST treat it as not relevant.
- In such cases, return ONLY: {{"is_apartment": false}}
- Do NOT set "is_apartment": true and neighborhood=null for these cases.
- We only want apartments in Tel Aviv–Yafo itself.


NEIGHBORHOOD RULES (STRICT ADD-ON):
- If the address contains a Hebrew street that exactly matches the injected STREET→NEIGHBORHOOD map,
  you MUST return that canonical neighborhood.
- If the text contains a known landmark from the injected LANDMARK→NEIGHBORHOOD map, you MUST return that neighborhood.
- Streets in AMBIGUOUS_LONG_STREETS must NOT determine a neighborhood unless a disambiguating landmark is present.
- Prefer STREET/LANDMARK matches over old Jaffa block labels (A/G/D) unless the post explicitly says "יפו ד/ג/א".
- If uncertain after applying the above, set "neighborhood": null (never guess).
- If both a STREET rule and a LANDMARK rule match, prefer the STREET result.


INJECTED STREET MAP (Heb → Canonical EN; exact match only):
{street_map_block}

INJECTED LANDMARK MAP (Heb → Canonical EN):
{landmark_map_block}

AMBIGUOUS LONG STREETS (never infer without landmark):
{ambiguous_block}

CATEGORY (MANDATORY):
- Return a Hebrew value in "category" with EXACTLY one of:
  "שכירות", "מכירה", "סאבלט", "החלפה"
- STRICT SUBLET RULE: Only set "סאבלט" if the post explicitly contains one of:
  "סאבלט", "תת-השכרה", "השכרה זמנית", "sublet". Otherwise prefer "שכירות".
- If unclear, default to "שכירות".

RENTAL SCOPE (MANDATORY):
- "דירה שלמה" or "שותפים" (If "מכירה" → "דירה שלמה").

PHONE NUMBER (MANDATORY):
- Detect Israeli numbers (050/052/054… and +972 variants).
- Normalize to digits only (e.g., "0521234567"). If none → null.

MANDATORY FALLBACK & NORMALIZATION RULES:
- If the post says "סטודיו", set "rooms": 1 (never null).
- If the post describes "יחידת דיור" or "גלריה" as a single unit → rooms=1.
- If the text contains the word "נדל״ן" or a company name → "has_broker": true.
- Normalize property_type strictly:
  * "דירת גן" → "apartment" and set "has_garden": true
  * "סטודיו" → "apartment" (rooms=1)
  * "פנטהאוז" → "penthouse"
  * "דופלקס" → "duplex"
- If no explicit price → "price": null.
- If no explicit address but a neighborhood is given → copy the neighborhood into "address".
- If no explicit available_from → "available_from": null.
- Always include ALL fields, with null where information is missing.

OUTPUT JSON (complete object, no markdown):
{{
  "is_apartment": true,
  "category": "<שכירות|מכירה|סאבלט>",
  "phone_number": "<digits only or null>",
  "rental_scope": "<דירה שלמה|שותפים>",
  "title": "<Hebrew>",
  "description": "",
  "price": <number or null>,
  "rooms": <number or null>,
  "size": <number or null>,
  "neighborhood": "<canonical English or null>",
  "address": "<Hebrew street only>",
  "floor": <number or null>,
  "property_type": "<English>",
  "pets_allowed": <boolean or null>,
  "has_broker": <boolean or null>,
  "has_balcony": <boolean or null>,
  "has_safe_room": <boolean or null>,
  "has_parking": <boolean or null>,
  "has_elevator": <boolean or null>,
  "available_from": "<YYYY-MM-DD or null>",
  "facebook_url": "<url or null>"
}}

COMMENT/QUESTION POSTS (no listing details):
Return ONLY: {{"is_apartment": false}}

FORMAT RULES:
- Return ONLY a valid JSON object (no markdown).
- Include ALL fields; unknown → null.
- For "available_from": if not explicit → null (never guess).
- Remove currency symbols/commas from numbers.
- Use standard JSON quotes; if you need quotes inside Hebrew text, prefer U+05F4 (״) but DO NOT break JSON.
- "rooms" may be integer or .5 (e.g., 2.5). Never round.

STANDARD TEL AVIV NEIGHBORHOODS (canonical; use ONLY these):
{canonical_list}

TEXT TO ANALYZE:
{post_text}
"""

    try:
        resp = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Return ONLY a valid JSON. No explanations, no markdown."},
                {"role": "user", "content": prompt}
            ],
            temperature=OPENAI_TEMPERATURE,
            max_tokens=OPENAI_MAX_TOKENS
        )
        result_text = resp.choices[0].message.content.strip()
        print(" FULL GPT OUTPUT:")
        print(result_text)

        # ---- Post-processing guardrails (deterministic override + canonical check) ----
        result = parse_gpt_output_safe(result_text)

        # 1) Deterministic override from street/landmark/synonym rules
        override = deterministic_neighborhood(result.get("address"), post_text)
        if override:
            result["neighborhood"] = override

        # 2) If the model returned a non-canonical neighborhood, null it out
        if result.get("neighborhood") not in NEIGHBORHOOD_EN_TO_HE:
            result["neighborhood"] = None

        return result

    except Exception as e:
        print(f"API Error: {e}")
        return None