import re
import time
import json
from google.cloud.firestore_v1 import FieldFilter
from firebase_admin import firestore as _fs

from .firebase import db
from .cleaning import clean_post_text
from .gpt_extractor import extract_apartment_data
from .fingerprint import generate_fingerprint
from .neighborhoods import NEIGHBORHOOD_EN_TO_HE
from .config import ERROR_LOG_PATH
from datetime import datetime, time as dtime

# ---- Timezone setup (Windows-safe) ----
try:
    # Primary: stdlib zoneinfo with IANA tz database available
    from zoneinfo import ZoneInfo
    TZ_IL = ZoneInfo("Asia/Jerusalem")

    def local_noon(y: int, m: int, d: int):
        return datetime(y, m, d, 12, 0, tzinfo=TZ_IL)

except Exception:
    # Try loading tzdata (pip install tzdata)
    try:
        import tzdata  # noqa: F401
        from zoneinfo import ZoneInfo as _ZI
        TZ_IL = _ZI("Asia/Jerusalem")

        def local_noon(y: int, m: int, d: int):
            return datetime(y, m, d, 12, 0, tzinfo=TZ_IL)

    except Exception:
        # Fallback to pytz if available
        try:
            import pytz
            TZ_IL = pytz.timezone("Asia/Jerusalem")

            def local_noon(y: int, m: int, d: int):
                # pytz requires localize()
                return TZ_IL.localize(datetime(y, m, d, 12, 0))

        except Exception:
            # Last resort: fixed +03:00 (no DST awareness)
            from datetime import timezone, timedelta
            TZ_IL = timezone(timedelta(hours=3))

            def local_noon(y: int, m: int, d: int):
                return datetime(y, m, d, 12, 0, tzinfo=TZ_IL)
# ---- End TZ setup ----


def to_noon_timestamp(date_str: str):
    """
    Takes a date string in format YYYY-MM-DD
    and returns a datetime set to 12:00 noon in Asia/Jerusalem timezone.
    """
    if not date_str:
        return None
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d").date()
        return local_noon(d.year, d.month, d.day)
    except ValueError:
        return None
    
    
IMMEDIATE_RE = re.compile(r"(כניסה\s*מיידית|כניסה\s*מידית|מיידי|מידי|זמין\s*מיידית|פינוי\s*מיידי|ASAP|זמין\s*עכשיו)")

def upload_date_from_post_id_noon(post_id: str):
    """
    Extracts datetime at 12:00 (Asia/Jerusalem) from id formatted as ddmmyyyy_xxxx.
    Returns datetime or None if invalid.
    """
    raw = (post_id or "").split("_")[0]
    if len(raw) == 8 and raw.isdigit():
        y = int(raw[4:])
        m = int(raw[2:4])
        d = int(raw[0:2])
        return local_noon(y, m, d)
    return None

def today_noon_il():
    """ Today at 12:00 in Asia/Jerusalem """
    now_il = datetime.now(TZ_IL)
    return local_noon(now_il.year, now_il.month, now_il.day)


# Default apartment structure for consistency across documents
DEFAULT_APT = {
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
    "phone_number": None,
}

def _normalize_rooms_value(rooms_val, source_text: str):
    """
    Normalize 'rooms' to a float and support .5 values (e.g., 2.5, 3.5).
    If None, try to infer from Hebrew text patterns found in the post.
    """
    if rooms_val is None:
        t = source_text
        # Patterns: "4.5 חדר", "4,5 חדר", "4 וחצי", "חדר וחצי", plain integers like "3 חדרים"
        m = re.search(r'(\d+)\s*[.,]\s*5\s*חדר', t)
        if m:
            return float(m.group(1)) + 0.5
        m = re.search(r'(\d+)\s*ו\s*חצי(?:\s*חדר(?:ים)?)?', t)
        if m:
            return float(m.group(1)) + 0.5
        if re.search(r'חדר\s*ו\s*חצי', t):
            return 1.5
        m = re.search(r'(\d+)\s*חדר(?:ים)?', t)
        if m:
            return float(m.group(1))
        return None

    if isinstance(rooms_val, str):
        s = rooms_val.strip().replace(",", ".")
        s = re.sub(r'^(\d+)\s*ו\s*חצי$', lambda m: f"{m.group(1)}.5", s)
        s = re.sub(r'^חדר\s*ו\s*חצי$', "1.5", s)
        s = re.sub(r"[^0-9.]", "", s)
        try:
            return float(s) if s else None
        except ValueError:
            return None

    try:
        return float(rooms_val)
    except Exception:
        return None

def _save_error_log(post_id: str, post_text: str):
    """
    Append problematic posts to a local JSONL file for later review.
    Each line is a valid JSON object: {"id": "...", "text": "..."}.
    """
    with open(ERROR_LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps({"id": post_id, "text": post_text}, ensure_ascii=False) + "\n")

def process_posts_stream(statuses=("new", "error")) -> int:
    """
    Stream posts with the given statuses, extract structured data via GPT,
    and upsert valid listings into 'apartments'. Returns the number of saved apartments.
    """
    posts_ref = db.collection("posts")
    new_posts = posts_ref.where(
        filter=FieldFilter("status", "in", list(statuses))
    ).stream()

    processed = 0

    for doc in new_posts:
        post = doc.to_dict()
        post_id = post.get("id")
        post_text = (post.get("text") or "").strip()

        print(f"\nProcessing post {post_id}...")

        # === NEW RULE: skip posts with no contactName ===
        # If contactName is missing or null, we don't want to process this post.
        if not post.get("contactName"):
            print(f"Skipping post {post_id} – missing contactName")
            posts_ref.document(post_id).update({"status": "skipped"})
            continue

        # Guard: no text
        if not post_text:
            print("Skipping empty post.")
            continue

        # Guard: very short comment-like messages (not real listings)
        if len(post_text) < 50 and re.search(r"(כמה|מחיר|פרטים|אשמח|אפשר|למה|נשמע|מעניין|שיתוף|\?)", post_text):
            print("Skipping likely comment.")
            posts_ref.document(post_id).update({"status": "skipped"})
            continue

        # Extract data with GPT
        data = extract_apartment_data(post_text)
        if data is None:
            print("Skipping post due to parsing failure.")
            posts_ref.document(post_id).update({"status": "error"})
            _save_error_log(post_id, post_text)
            continue

        try:
            # Not an apartment listing
            if data.get("is_apartment") is False:
                print("Not an apartment listing.")
                posts_ref.document(post_id).update({"status": "skipped"})
                continue

            # Home exchange: skip
            if data.get("category") == "החלפה":
                print("Home exchange — skipping.")
                posts_ref.document(post_id).update({"status": "skipped_exchange"})
                continue

            # Merge GPT output into default structure
            full_data = DEFAULT_APT.copy()
            full_data.update(data)

            # Normalize rooms (support half-rooms)
            full_data["rooms"] = _normalize_rooms_value(full_data.get("rooms"), post_text)

            # Ensure sensible defaults
            if full_data.get("category") is None and data.get("is_apartment"):
                full_data["category"] = "שכירות"
            if "phone_number" not in full_data and data.get("is_apartment"):
                full_data["phone_number"] = None
            if not full_data.get("rental_scope") and data.get("is_apartment"):
                full_data["rental_scope"] = "דירה שלמה"

            # Remove address if it redundantly contains the neighborhood name (Hebrew)
            if full_data.get("address") and full_data.get("neighborhood"):
                heb_name = NEIGHBORHOOD_EN_TO_HE.get(full_data["neighborhood"])
                if heb_name and isinstance(full_data["address"], str) and heb_name in full_data["address"]:
                    full_data["address"] = None

            # Enrich with source metadata
            full_data["id"] = post_id
            full_data["images"] = post.get("images", [])
            full_data["description"] = clean_post_text(post_text)
            full_data["contactId"] = post.get("contactId")
            full_data["contactName"] = post.get("contactName")

            # Convert neighborhood (EN → HE) before saving
            if full_data.get("neighborhood"):
                full_data["neighborhood"] = NEIGHBORHOOD_EN_TO_HE.get(
                    full_data["neighborhood"], full_data["neighborhood"]
                )
            
            # === NEW: available_from -> Timestamp@12:00 with "immediate" fallback ===
            af_raw = full_data.get("available_from")

            # keep existing datetime as-is
            af_dt = af_raw if isinstance(af_raw, datetime) else None

            if isinstance(af_raw, str) and af_raw.strip():
                # Try parsing the given date
                af_dt = to_noon_timestamp(af_raw.strip())
                if not af_dt and IMMEDIATE_RE.search(post_text):
                    # If parsing failed but text says "immediate", use upload date or today
                    af_dt = upload_date_from_post_id_noon(post_id) or today_noon_il()
            elif not af_raw:
                # Empty/None -> "immediate" heuristic
                if IMMEDIATE_RE.search(post_text):
                    af_dt = upload_date_from_post_id_noon(post_id) or today_noon_il()

            # only set if we actually computed something
            if af_dt is not None:
                full_data["available_from"] = af_dt

            # Derive upload_date from ID prefix: ddmmyyyy_XXXX → yyyy-mm-dd
            raw_date = (post_id or "").split("_")[0]
            if len(raw_date) == 8 and raw_date.isdigit():
                full_data["upload_date"] = f"{raw_date[4:]}-{raw_date[2:4]}-{raw_date[0:2]}"
            else:
                full_data["upload_date"] = None

            # Fingerprint (used for duplicate detection)
            fingerprint = generate_fingerprint(full_data)
            if not fingerprint:
                print(f"Could not generate fingerprint for post {post_id} – skipping.")
                posts_ref.document(post_id).update({"status": "incomplete"})
                continue
            full_data["fingerprint"] = fingerprint

            # Duplicate check by fingerprint
            existing = db.collection("apartments").where(
                filter=FieldFilter("fingerprint", "==", fingerprint)
            ).get()
            if existing:
                print("Duplicate apartment — skipping.")
                posts_ref.document(post_id).update({"status": "duplicate"})
                continue

            # Minimal completeness gate: require at least one of (address, rooms, price)
            if not any(full_data.get(f) for f in ("address", "rooms", "price")):
                print(f"Skipping post {post_id} – no important fields present.")
                posts_ref.document(post_id).update({"status": "incomplete"})
                continue

            # Save apartment with proper server timestamp
            db.collection("apartments").document(post_id).set({
                **full_data,
                "indexed_at": _fs.SERVER_TIMESTAMP
            })

            # Mark source post as processed (also server timestamp)
            posts_ref.document(post_id).update({
                "status": "processed",
                "indexed_at": _fs.SERVER_TIMESTAMP
            })

            processed += 1
            print(f"Apartment saved: {post_id}")

        except Exception as e:
            print(f"Error processing {post_id}: {e}")
            posts_ref.document(post_id).update({
                "status": "error",
                "indexed_at": _fs.SERVER_TIMESTAMP
            })

        # Soft throttle to avoid resource bursts
        time.sleep(0.5)

    return processed
