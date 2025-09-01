import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta, timezone
from google.cloud.firestore_v1 import FieldFilter
import openai
import json
import time
import re
import os
from dotenv import load_dotenv
import hashlib
import unicodedata
from pathlib import Path  

print("Running convert_posts.py")

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
openai.api_key = api_key

# === Firebase Initialization ===
BASE_DIR = Path(__file__).resolve().parent
cred = credentials.Certificate(str(BASE_DIR / "serviceAccountKey.json")) 
# cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Function to clean the post text by removing time-related phrases
# This is to ensure that the text is more focused on the apartment details
def clean_post_text(raw_text):
    import re

    # Remove special characters that look strange
    raw_text = raw_text.strip().replace('\u200f', '').replace('\xa0', ' ')

    # Prepare patterns that usually appear at the beginning of a Facebook post
    # For example: "Shared with group", or "2 days", "5 hours", etc.
    time_pattern = r"\d+\s*(ימים|שעות|שניה|שניות|דקות)"
    start_keywords = [r"משותף עם: קבוצה ציבורית", time_pattern]

    # We will find the latest position of these patterns and remove everything before it
    min_start = 0
    for pattern in start_keywords:
        match = re.search(pattern, raw_text)
        if match:
            min_start = max(min_start, match.end()) # Keep the latest match

    # Cut the text to remove the beginning part that is not needed
    raw_text = raw_text[min_start:].lstrip(" ·\n")

    # These are common endings in Facebook posts, like likes, shares, and group info
    end_patterns = [
        r"\+\d[\d,\.₪ ]* · .*?TA.*?דירה עם.*?חדרי אמבטיה",
        r"תל אביב.*?TA.*?דירה עם.*?חדרי אמבטיה",
        r"הודעה\s*לייק\s*תגובה\s*שיתוף",
        r"כתיבת תגובה ציבורית.*$"
    ]

    # Find if any of these endings are inside the post
    # If yes – cut the post at that point
    for pattern in end_patterns:
        match = re.search(pattern, raw_text, re.DOTALL)
        if match:
            raw_text = raw_text[:match.start()]
            break

    return raw_text.strip() # Return the cleaned post

def generate_fingerprint(data):
    components = []

    if data.get("address"):
        components.append(f"address={data['address'].strip().lower()}")
    if data.get("rooms"):
        components.append(f"rooms={data['rooms']}")
    if data.get("price"):
        components.append(f"price={data['price']}")
    if data.get("available_from"):
        components.append(f"available_from={data['available_from']}")

    if not components:
        return None

    fingerprint_key = "|".join(components)
    return hashlib.md5(fingerprint_key.encode('utf-8')).hexdigest()

default_structure = {
    "title": "דירה למכירה",
    "description": "",
    "price": None,
    "rooms": None,
    "size": None,
    "neighborhood": None,
    "address": None,
    "floor": None,
    "property_type": None,
    "pets_allowed": None,
    "has_broker": None,
    "has_balcony": None,
    "has_safe_room": None,
    "has_parking": None,
    "has_elevator": None,
    "available_from": None,
    "facebook_url": None,
    "category": None,
    "rental_scope": None,
    "phone_number": None ,
    }

# --- neighborhoods mapping (single source of truth) ---
NEIGHBORHOOD_EN_TO_HE = {
    "Lev Ha'Ir (City Center)": "לב העיר",
    "Neve Tzedek": "נווה צדק",
    "Shabazi Quarter": "שכונת שבזי",
    "Kerem HaTeimanim": "כרם התימנים",
    "Kerem Yisrael": "כרם ישראל",
    "Ramat HaSharon Quarter": "שכונת רמת השרון",
    "Tel Nordau": "תל נורדאו",
    "Montefiore Quarter": "שכונת מונטיפיורי",
    "HaKirya & Sarona": "הקריה ושרונה",
    "Kiryat Meir": "קריית מאיר",
    "The Old North": "הצפון הישן",
    "The New North": "הצפון החדש",
    "Bavli": "שיכון בבלי",
    "Givat Amal B": "גבעת עמל ב'",
    "Park Tzameret": "פארק צמרת",
    "Florentin": "פלורנטין",
    "Neve Sha’anan": "נווה שאנן",
    "Shapira Quarter": "שכונת שפירא",
    "Kiryat Shalom": "קריית שלום",
    "Neve Ofer": "נווה עופר",
    "Givat Herzl": "גבעת הרצל",
    "Kiryat HaMelekha": "קריית המלאכה",
    "HaRakevet Quarter": "שכונת הרכבת",
    "Old Jaffa": "יפו העתיקה",
    "Jaffa A (Dekel)": "יפו א' (דקר)",
    "Jaffa G": "יפו ג'",
    "Jaffa D": "יפו ד'",
    "Ajami": "עג'מי",
    "Givat Aliyah": "גבעת עלייה",
    "Tzahalon": "צהלון",
    "Shikuney Chisachon": "שיכוני חיסכון",
    "Pardes Daka": "פרדס דכה",
    "Givat Andromeda": "גבעת אנדרומדה",
    "Manshiya": "מנשייה",
    "American Colony": "המושבה האמריקאית",
    "Yad Eliyahu": "יד אליהו",
    "HaTikva Quarter": "שכונת התקווה",
    "Kfar Shalem": "כפר שלם",
    "Bitzaron": "ביצרון",
    "Nachalat Yitzhak": "נחלת יצחק",
    "Ramat Yisrael": "רמת ישראל",
    "Beit Yaakov": "בית יעקב",
    "Neve Tzahal": "נווה צה\"ל",
    "Neve Kfir": "נווה כפיר",
    "Neve Barbur": "נווה בארבור",
    "Orot": "אורות",
    "Neve Eliezer": "נווה אליעזר",
    "Neve Chen": "נווה חן",
    "Nir Aviv": "ניר אביב",
    "Ramat HaTayasim": "רמת הטייסים",
    "Tel Haim": "תל חיים",
    "Shikun Amami G": "שיכון עממי ג'",
    "Ezra Quarter": "שכונת עזרא",
    "HaArgazim Quarter": "שכונת הארגזים",
    "Levana Quarter": "שכונת לבנה",
    "Yedidya Quarter": "שכונת ידידיה",
    "Ramat Aviv": "רמת אביב",
    "Neve Avivim": "נווה אביבים",
    "Ramat Aviv G": "רמת אביב ג'",
    "New Ramat Aviv": "רמת אביב החדשה",
    "Afeka": "אפקה",
    "Lamed Quarter": "שכונת למד",
    "Kochav HaTzafon": "כוכב הצפון",
    "Nofei Yam": "נופי ים",
    "Tzukey Aviv": "צוקי אביב",
    "Azorei Chen": "אזורי חן",
    "New Gimel": "גימל החדשה",
    "Ne’eman Towers": "מגדלי נאמן",
    "Sea & Sun": "סי אנד סאן",
    "Glilot": "גלילות",
    "University Quarter": "קריית האוניברסיטה",
    "Tel Baruch": "תל ברוך",
    "Maoz Aviv": "מעוז אביב",
    "Hadar Yosef": "הדר יוסף",
    "Neot Afeka": "נאות אפקה",
    "Revivim Quarter": "שכונת רביבים",
    "Tzahala": "צהלה",
    "HaMishtala": "המשתלה",
    "Neve Sharett": "נווה שרת",
    "Shikun Dan": "שיכון דן",
    "Yashgav": "ישגב",
    "Ramat HaChayal": "רמת החייל",
    "Kiryat Atidim": "קריית עתידים"
}

def delete_posts_by_status(statuses, batch_size=500):
    """
    Delete documents from 'posts' where status is in statuses.
    Runs in batches to respect Firestore limits.
    """
    total_deleted = 0
    while True:
        q = db.collection("posts").where(
            filter=FieldFilter("status", "in", statuses)
        ).limit(batch_size)

        docs = list(q.stream())
        if not docs:
            break

        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()

        total_deleted += len(docs)
        print(f"Deleted {len(docs)} posts this batch...")

    print(f"Done. Deleted {total_deleted} posts with statuses: {statuses}")

def try_parse_date_from_id(doc_id: str):
    """Fallback: parse ddmmyyyy_* pattern to datetime (UTC). Returns None if not matched."""
    m = re.match(r"(\d{2})(\d{2})(\d{4})_", doc_id)
    if not m:
        return None
    d, mth, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
    try:
        return datetime(y, mth, d, tzinfo=timezone.utc)
    except Exception:
        return None
    
def prune_older_than_days(collection_name: str, timestamp_field: str, days: int):
    """Delete docs older than N days by the given timestamp_field. Batches to avoid limits.
       If timestamp_field missing, optionally fallback to ID-date (ddmmyyyy_)."""
    now_utc = datetime.now(timezone.utc)
    cutoff = now_utc - timedelta(days=days)
    total_deleted = 0

    # prune_older_than_days:
    q = db.collection(collection_name).where(
        filter=FieldFilter(timestamp_field, "<", cutoff)
    ).limit(500)

    while True:
        docs = list(q.stream())
        if not docs:
            break
        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()
        total_deleted += len(docs)

    # Pass 2 (optional): delete by ID date fallback if field missing
    # We fetch a page, filter client-side; do NOT scan massive collections repeatedly.
    # If your collections are large, consider adding a Cloud Function or backfill indexed_at once.
    q_missing = db.collection(collection_name).limit(500)
    scanned = 0
    while True:
        docs = list(q_missing.stream())
        if not docs:
            break
        to_delete = []
        for doc in docs:
            data = doc.to_dict()
            if timestamp_field not in data:
                ts_from_id = try_parse_date_from_id(doc.id)
                if ts_from_id and ts_from_id < cutoff:
                    to_delete.append(doc.reference)
        if not to_delete:
            break
        batch = db.batch()
        for ref in to_delete:
            batch.delete(ref)
        batch.commit()
        total_deleted += len(to_delete)
        scanned += len(docs)
        if len(docs) < 500:
            break  # reached end

    print(f"Pruned {total_deleted} docs from '{collection_name}' older than {days} days (cutoff: {cutoff.isoformat()}).")

# === Safe JSON parse ===
def parse_gpt_output_safe(raw_text: str):
    # 1) Unicode normalization (removes odd combinations/compatibility forms)
    cleaned = unicodedata.normalize("NFC", raw_text)

    # 2) Convert smart quotes to standard ASCII quotes/apostrophes.
    #    This ensures JSON uses plain `"` for keys/values delimiters.
    cleaned = (cleaned
        .replace("“", '"').replace("”", '"')
        .replace("„", '"')
        .replace("’", "'").replace("‘", "'")
        .replace("`", "'")
    )

    # 2b) Replace problematic ASCII double-quote occurring *inside* Hebrew words
    #     with Hebrew gershayim U+05F4. This keeps JSON valid and preserves meaning.
    #     Pattern: a `"` that is between two Hebrew letters U+0590–U+05FF.
    cleaned = re.sub(r'(?<=[\u0590-\u05FF])"(?=[\u0590-\u05FF])', '\u05F4', cleaned)

    # 3) Strip common invisible characters that often sneak into LTR/RTL text
    cleaned = cleaned.replace("\ufeff", "")   # BOM
    cleaned = cleaned.replace("\u00a0", " ")  # NBSP -> regular space
    # LRM/RLM/ZWJ/ZWNJ
    for ch in ["\u200e", "\u200f", "\u200c", "\u200d"]:
        cleaned = cleaned.replace(ch, "")
    # Directional isolates/embeddings: LRE/RLE/PDF/LRO/RLO & LRI/RLI/FSI/PDI
    cleaned = re.sub(r"[\u202a-\u202e\u2066-\u2069]", "", cleaned)

    # 4) Try to parse as JSON
    try:
        return json.loads(cleaned)
    except Exception as e:
        # Helpful diagnostics: show where parsing choked.
        print(f"JSON decode failed: {e}")
        try:
            msg = str(e)
            # Extract the character index (if provided by the exception message)
            if "char" in msg:
                idx = int(msg.split("char")[1].split(")")[0].strip())
                start = max(0, idx - 60)
                end = min(len(cleaned), idx + 60)
                snippet = cleaned[start:end]
                print("Around error (repr):", repr(snippet))
                print("Code points:", [hex(ord(c)) for c in snippet])
        except Exception:
            # Best-effort diagnostics only—ignore secondary errors
            pass
        return None
 
# Function to extract apartment data from a Facebook post
# This function uses OpenAI's GPT-4o-mini model to analyze the post text and extract relevant information
def extract_apartment_data(post_text):
    current_year = datetime.now().year

    prompt = fr"""
You are a data extraction assistant specializing in Israeli real estate posts on Facebook.

TASK: Extract data from this Facebook post about apartments for rent in Tel Aviv.

CRITICAL INSTRUCTIONS:
1. Most Facebook posts ARE apartment listings unless they're clearly just brief comments.
2. For neighborhood field, ONLY use standard Tel Aviv neighborhood names in English (see list below).
3. Dates: Only if the post explicitly states a start date, return it in YYYY-MM-DD. 
   - If the date is given without a year, use the CURRENT YEAR ({current_year}).
   - If there is NO explicit date, set "available_from" to null. Never invent or default to Jan 1.
4. For address field:
   - KEEP THE STREET NAME IN HEBREW even if there is no building number
   - Extract only the basic street information (name and number if available)
   - REMOVE marketing/descriptive terms like: 'יוקרתי', 'מדהים', 'מושלם', 'מהממת', 'נדיר', 'מיוחד', 'נהדר', 'מטופח', etc.
   - Extract locations even when preceded by 'ברחוב', 'באזור', etc.
5. If a post contains text with apartment details and comments, focus ONLY on the apartment details.
6. Notice that the parameters title, description, and address are in Hebrew.

CATEGORY CLASSIFICATION (MANDATORY):
- Return a Hebrew value in "category" with EXACTLY one of:
  - "שכירות"  → regular rental (e.g., "להשכרה", monthly rent, deposit)
  - "מכירה"   → for sale (e.g., "למכירה", asking price, deal/transaction)
  - "סאבלט"   → sublet / temporary rental (e.g., "סאבלט", "השכרה זמנית", clear start/end dates for weeks/months)
  - "החלפה"  → home exchange / swap (e.g., "דירה להחלפה", "החלפת דירה", "מחליפים דירה", "home exchange", "house swap")
- Prefer "סאבלט" when the stay is clearly temporary even if "להשכרה" appears.
- If the post is about exchanging apartments (swap) and not about price/rent/sale, choose "החלפה".
- If unclear, choose "שכירות" (NOT null).

RENTAL SCOPE CLASSIFICATION (MANDATORY):
- Classify whether the listing is for a whole apartment or for a roommate/room in a shared apartment.
- Return a Hebrew value in "rental_scope" with EXACTLY one of:
  - "דירה שלמה" → the entire unit is for rent/sale/sublet (e.g., "דירה שלמה", "דירת 3 חדרים להשכרה", "יחידה עצמאית", entire apartment).
  - "שותפים"     → looking for a roommate / room in shared apartment (e.g., "מחפשים שותף/ה", "חדר פנוי", "שכירות לחדר", "דירת שותפים", "Roommate", "Shared apartment").
- Hints for "שותפים": mentions of שותף/שותפה/שותפים, חדר פנוי, שכר דירה לחדר, כניסה לחדר, דירת שותפים, מחפשים לדירה קיימת.
- Hints for "דירה שלמה": ניסוחים כלליים של דירה להשכרה/סאבלט/מכירה ללא בקשה מפורשת לשותף; יחידת דיור/סטודיו/דירת 2–4 חדרים; אין אזכור לחדר פנוי בדירת שותפים.
- If "category" is "מכירה", set "rental_scope" to "דירה שלמה".
- If unclear, prefer "דירה שלמה".

PHONE NUMBER EXTRACTION (MANDATORY):
- Detect if the post text contains a phone number.
- Accept Israeli formats (e.g., 050-1234567, 0521234567, 054 7654321).
- Accept international formats with +972 as well (e.g., +972-50-1234567).
- Normalize to digits only (e.g., "0521234567").
- If multiple phone numbers appear, return the first one.
- If none appear, set "phone_number" to null.

For apartment listings, provide this JSON structure:
{{
  "is_apartment": true,
  "category": "<שכירות|מכירה|סאבלט>",
  "phone_number": "<digits only or null>",
  "rental_scope": "<דירה שלמה|דירת שותפים>",
  "title": "<Hebrew title - first meaningful phrase>",
  "description": "<leave empty, we will fill it from the original post text>",
  "price": <number or null>,
  "rooms": <number or null>,
  "size": <number or null>,
  "neighborhood": "<English neighborhood name from the list below>",
  "address": "<ONLY the Hebrew street name/location, NO marketing terms>",
  "floor": <number or null>,
  "property_type": "<English: apartment, duplex, penthouse, studio, etc>",
  "pets_allowed": <boolean or null>,
  "has_broker": <boolean or null>,
  "has_balcony": <boolean or null>,
  "has_safe_room": <boolean or null>,
  "has_parking": <boolean or null>,
  "has_elevator": <boolean or null>,
  "available_from": "<YYYY-MM-DD with current year {current_year}>",
  "facebook_url": "<facebook URL or null>",
}}

If the post is a short comment, question, or response without any clear apartment details (e.g., "כמה?", "אשמח לפרטים", "אפשר מחיר?", "נשמע טוב", "שיתוף") — then DO NOT attempt to extract fake apartment data.

In such cases, return ONLY:
{{"is_apartment": false}}

IMPORTANT FORMAT INSTRUCTIONS:
- Always return ONLY a valid JSON object.
- Do NOT wrap the response in ```json or any markdown.
- Ensure the JSON is always complete and includes all fields, even if their value is null or empty.
- If you cannot find a value, set it explicitly to null.
- For "available_from": if no explicit date appears in the text, set null.
- Make sure the JSON is valid and can be parsed correctly.
- Do not include any special characters like quotes ("), backslashes (\), or smart punctuation.
- Avoid writing any content in the "description" field — we will fill it ourselves from the original post.
- If a field contains currency symbols like "ש\"ח", "₪", or commas in numbers — remove them entirely.
- Do not escape any characters. Return clean JSON with plain UTF-8 text.
+ Never use the ASCII double quote (") inside any string value. 
+ If the text would normally include quotes (e.g., Hebrew abbreviations like ממ״ד), use the Hebrew gershayim character U+05F4 (״) or a single quote (').
+ The JSON itself must remain valid (inner quotes must not break JSON).
- For "rooms": if the text mentions half a room (e.g., 4.5, 4 וחצי), return a decimal with .5 (e.g., 4.5). Never round.
- Valid values for "rooms" include integers and .5 only (1, 1.5, 2, 2.5, ...). Use a dot as the decimal separator.



STANDARD TEL AVIV NEIGHBORHOODS (Use ONLY these in English):
- Lev Ha'Ir (City Center)
- Neve Tzedek
- Shabazi Quarter
- Kerem HaTeimanim
- Kerem Yisrael
- Ramat HaSharon Quarter
- Tel Nordau
- Montefiore Quarter
- HaKirya & Sarona
- Kiryat Meir
- The Old North
- The New North
- Bavli
- Givat Amal B
- Park Tzameret
- Florentin
- Neve Sha’anan
- Shapira Quarter
- Kiryat Shalom
- Neve Ofer
- Givat Herzl
- Kiryat HaMelekha
- HaRakevet Quarter
- Old Jaffa
- Jaffa A (Dekel)
- Jaffa G
- Jaffa D
- Ajami
- Givat Aliyah
- Tzahalon
- Shikuney Chisachon
- Pardes Daka
- Givat Andromeda
- Manshiya
- American Colony
- Yad Eliyahu
- HaTikva Quarter
- Kfar Shalem
- Bitzaron
- Nachalat Yitzhak
- Ramat Yisrael
- Beit Yaakov
- Neve Tzahal
- Neve Kfir
- Neve Barbur
- Orot
- Neve Eliezer
- Neve Chen
- Nir Aviv
- Ramat HaTayasim
- Tel Haim
- Shikun Amami G
- Ezra Quarter
- HaArgazim Quarter
- Levana Quarter
- Yedidya Quarter
- Ramat Aviv
- Neve Avivim
- Ramat Aviv G
- New Ramat Aviv
- Afeka
- Lamed Quarter
- Kochav HaTzafon
- Nofei Yam
- Tzukey Aviv
- Azorei Chen
- New Gimel
- Ne’eman Towers
- Sea & Sun
- Glilot
- University Quarter
- Tel Baruch
- Maoz Aviv
- Hadar Yosef
- Neot Afeka
- Revivim Quarter
- Tzahala
- HaMishtala
- Neve Sharett
- Shikun Dan
- Yashgav
- Ramat HaChayal
- Kiryat Atidim


FEATURES TRANSLATION:
- מעלית → elevator
- חניה → parking
- מרפסת → balcony
- ריהוט → furnished
- מחסן → storage
- סורגים → bars
- ממ״ד → safe_room
- דוד שמש → solar_heater
- מיזוג → air_conditioning
- גג → roof
- מרפסת שמש → sun_balcony

 Output MUST be valid JSON. Even one incorrect quote or unescaped character will break it.

TEXT TO ANALYZE:
{post_text}
"""

    try:
        # Send request to OpenAI to extract information from the post
        response = openai.chat.completions.create(
            model="gpt-4o-mini", # This is the AI model we use
            messages=[
                # System message tells the AI to return only clean JSON
                {"role": "system", "content": "Return ONLY a valid JSON. No explanations, no markdown."},
                # User message includes the prompt + the post text we want to analyze
                {"role": "user", "content": prompt}
            ],
            temperature=0.1, # Low temperature = more accurate, less creative
            max_tokens=3000 # Max length of the response from the model
        )
        # Get the model response and remove spaces at the start and end
        result_text = response.choices[0].message.content.strip()

        # Print the full raw response from GPT for debugging
        print(" FULL GPT OUTPUT:")
        print(result_text)

        # Try to clean and convert the result from text into a Python dictionary
        parsed_data = parse_gpt_output_safe(result_text)
        if parsed_data is None:
            print(f"JSON parsing failed:\n{result_text[:500]}")
            return None

        # Start from an empty/default apartment structure
        full_data = default_structure.copy()

        # Add the data we got from GPT to the default structure
        full_data.update(parsed_data)

        # --- Normalize rooms (.5 support) ---
        def normalize_rooms_value(rooms_val, source_text: str):
            if rooms_val is None:
                # fallback: נסה לחלץ מהטקסט (4.5 / 4,5 / 4 וחצי / חדר וחצי)
                t = source_text
                # 4.5 / 4,5
                m = re.search(r'(\d+)\s*[.,]\s*5\s*חדר', t)
                if m: return float(m.group(1)) + 0.5
                # 4 וחצי (עם או בלי "חדרים")
                m = re.search(r'(\d+)\s*ו\s*חצי(?:\s*חדר(?:ים)?)?', t)
                if m: return float(m.group(1)) + 0.5
                # חדר וחצי
                if re.search(r'חדר\s*ו\s*חצי', t):
                    return 1.5
                # מספר שלם רגיל (למקרה שאין .5)
                m = re.search(r'(\d+)\s*חדר(?:ים)?', t)
                if m: return float(m.group(1))
                return None

            # אם המודל החזיר מחרוזת
            if isinstance(rooms_val, str):
                s = rooms_val.strip()
                # הפוך פסיקים לנקודה (4,5 -> 4.5)
                s = s.replace(",", ".")
                # 4 וחצי -> 4.5
                s = re.sub(r'^(\d+)\s*ו\s*חצי$', lambda m: f"{m.group(1)}.5", s)
                s = re.sub(r'^חדר\s*ו\s*חצי$', "1.5", s)
                # השאר מספרים ונקודה בלבד
                s = re.sub(r"[^0-9.]", "", s)
                try:
                    return float(s) if s else None
                except ValueError:
                    return None

            # אם כבר מספר
            try:
                return float(rooms_val)
            except Exception:
                return None

        rooms_norm = normalize_rooms_value(full_data.get("rooms"), post_text)
        full_data["rooms"] = rooms_norm

        # --- Normalize available_from: null if no explicit date was mentioned ---
        if full_data.get("available_from"):
            af = full_data["available_from"]
            # If the date is exactly Jan 1 (default), check if it was explicitly mentioned
            if re.fullmatch(r"\d{4}-01-01", str(af)):
                # If no explicit date words in the post, set to None
                has_explicit_date = re.search(
                    r"(כניסה|זמינות|מתאריך|(\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?)|(\d{4}-\d{2}-\d{2})|Immediate|מיידי|מיידית)",
                    post_text
                )
                if not has_explicit_date:
                    full_data["available_from"] = None
        else:
            # If no date was found, ensure it's None
            full_data["available_from"] = None

        # Ensure category default if missing (robustness)
        if full_data.get("is_apartment") and not full_data.get("category"):
            full_data["category"] = "שכירות"

        if full_data.get("is_apartment") and "phone_number" not in full_data:
            full_data["phone_number"] = None

        if full_data.get("is_apartment") and not full_data.get("rental_scope"):
            # If sale → whole apt; else default to whole apt unless clearly roommate
            full_data["rental_scope"] = "דירה שלמה" if full_data.get("category") == "מכירה" else "דירה שלמה"

        # Check if the address includes the same name as the neighborhood (in Hebrew)
        # Remove address if it repeats the neighborhood name (Hebrew)
        if full_data.get("address") and full_data.get("neighborhood"):
            heb_name = NEIGHBORHOOD_EN_TO_HE.get(full_data["neighborhood"])
            if heb_name and heb_name in full_data["address"]:
                full_data["address"] = None

        return full_data # Return the final clean apartment data

    except Exception as e:
        # If something goes wrong (like internet or API error), print the error
        print(f"API Error: {e}")
        return None
    
# ---------- PRUNE old docs BEFORE processing ----------
# מוחק מסמכים ב-posts וב-apartments שגילם מעל 10 ימים.
# נסמך על שדה indexed_at; אם אין, ננסה לחלץ תאריך מה-ID בפורמט ddmmyyyy_XXXX.
prune_older_than_days("posts", "indexed_at", 14)
prune_older_than_days("apartments", "indexed_at", 14)

# === Main process: fetch, extract and upload ===
# Get all posts from the "posts" collection where status is "new" or "error"
posts_ref = db.collection("posts")
new_posts = posts_ref.where(
    filter=firestore.FieldFilter("status", "in", ["new", "error"])
).stream()

# Counter to keep track of how many posts were saved
processed = 0

# Loop over each post from the database
for doc in new_posts:
    post = doc.to_dict() # Convert Firestore document to a dictionary
    post_id = post["id"] # Get the post ID
    post_text = post.get("text", "").strip() # Get the post text, default to empty string if not found

    print(f"\n Processing post {post_id}...") # Print which post we are working on

    # If the post text is empty, skip it
    if not post_text:
        print("Skipping empty post.")
        continue

    # If the post text is too short and contains common comment phrases, skip it
    if len(post_text) < 50 and re.search(r"(כמה|מחיר|פרטים|אשמח|אפשר|למה|נשמע|מעניין|שיתוף|\?)", post_text):
        print("Skipping likely comment.") # It's probably not a real apartment post
        posts_ref.document(post_id).update({"status": "skipped"}) # Mark it as skipped
        continue
    
    # Try to extract apartment data using GPT
    data = extract_apartment_data(post_text)

    # If GPT could not return valid data – mark it as error and save the post to error log
    if data is None:
        print("Skipping post due to parsing failure.")
        posts_ref.document(post_id).update({"status": "error"}) # Mark post as error

        # Save the bad post to a local file so we can look at it later
        with open("error_log.jsonl", "a", encoding="utf-8") as log_file:
            log_entry = {
                "id": post_id,
                "text": post_text
            }
            log_file.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
        continue

    try:
        # If GPT says this is NOT an apartment post – skip it
        if data.get("is_apartment") is False:
            print("Not an apartment listing.")
            posts_ref.document(post_id).update({"status": "skipped"})
            continue
        
       # If the category is "החלפה" (home exchange) – skip it
        if data.get("category") == "החלפה":
            print("Home exchange (החלפה) — skipping.")
            posts_ref.document(post_id).update({"status": "skipped_exchange"})
            continue

         # Remove the "is_apartment" key before saving to database
        if "is_apartment" in data:
            del data["is_apartment"]

         # Add extra info before saving
        data["id"] = post_id # Add the post ID
        data["images"] = post.get("images", []) # Add the list of images (if any)
        data["description"] = clean_post_text(post_text) # Clean and add the description
        data["contactId"] = post.get("contactId")
        data["contactName"] = post.get("contactName")
        
        # normalize neighborhood to Hebrew before saving
        if data.get("neighborhood"):
            data["neighborhood"] = NEIGHBORHOOD_EN_TO_HE.get(data["neighborhood"], data["neighborhood"])

        raw_date = post_id.split("_")[0]   # למשל "25082025"
        if len(raw_date) == 8 and raw_date.isdigit():
            data["upload_date"] = f"{raw_date[4:]}-{raw_date[2:4]}-{raw_date[0:2]}"
        else:
            data["upload_date"] = None

        # יצירת fingerprint לפי שדות קיימים
        fingerprint = generate_fingerprint(data)

        if not fingerprint:
            print(f"Could not generate fingerprint for post {post_id} – skipping.")
            posts_ref.document(post_id).update({"status": "incomplete"})
            continue

        # בדיקת כפילות
        # duplicate check:
        existing = db.collection("apartments").where(
            filter=FieldFilter("fingerprint", "==", fingerprint)
        ).get()
        if existing:
            print(f"Duplicate apartment (fingerprint match) – skipping.")
            posts_ref.document(post_id).update({"status": "duplicate"})
            continue

        #  Add the fingerprint to the data
        data["fingerprint"] = fingerprint

        # Check if all important fields are present
        # We need at least price, address, and rooms to consider it a valid apartment post
        important_fields = ["address", "rooms", "price"]
        filled_fields = [f for f in important_fields if data.get(f)]

        if len(filled_fields) == 0:
            print(f"Skipping post {post_id} – no important fields present.")
            posts_ref.document(post_id).update({"status": "incomplete"})  # סטטוס חדש אם תרצי לעבור עליהם בעתיד
            continue

        # save apartment (+ stamp indexed_at)
        db.collection("apartments").document(post_id).set({
            **data,
            "indexed_at": firestore.SERVER_TIMESTAMP
        })

        # mark source post as processed (+ stamp indexed_at)
        posts_ref.document(post_id).update({"status": "processed", "indexed_at": firestore.SERVER_TIMESTAMP})
        processed += 1 # Count how many were saved
        print(f"Apartment saved: {post_id}")

    except Exception as e:
        # If something went wrong while saving – print error and mark as error
        print(f"Error processing {post_id}: {e}")
        posts_ref.document(post_id).update({"status": "error", "indexed_at": firestore.SERVER_TIMESTAMP})

    time.sleep(0.5)  # Wait half a second before the next post (to avoid overload)

# Print how many apartments we saved at the end
print(f"\n Done! {processed} apartments saved.")

# --- Cleanup: delete skipped/duplicate posts ---
delete_posts_by_status(["skipped", "duplicate"])