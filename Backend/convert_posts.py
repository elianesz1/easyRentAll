import firebase_admin
from firebase_admin import credentials, firestore
import openai
import json
import time
import re
from datetime import datetime
import os
from dotenv import load_dotenv
import hashlib

print("🔁 Running NEW version of convert_posts.py")

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")


# === Firebase Initialization ===
cred = credentials.Certificate("serviceAccountKey.json")
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
    }

# === Safe JSON parse ===
#אולי צריך למחוק אותה נבדוק על פוסטים חדשים (מחקנו את השורה שהשתמשה בפונצקיה הזו)
def parse_gpt_output_safe(raw_text):
    try:
        print("RAW BEFORE PARSE:", repr(raw_text))

        # Step 1: Replace smart quotes and invisible characters
        raw_text = raw_text.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'").replace("`", "'")
        raw_text = re.sub(r'[\u200e\u200f\u202a\u202c\u202d\u202e\u2066\u2067\u2068\u2069]', '', raw_text)
        raw_text = re.sub(r'[\x00-\x1F]+', '', raw_text)

        # Step 2: Fix common escape sequence issues
        raw_text = raw_text.replace('\\"', '"')
        raw_text = raw_text.replace('\\\"', '"')
        raw_text = raw_text.replace('\\\\', '\\')

        # Step 3: Remove escaped currency symbols like "ש\"ח"
        raw_text = re.sub(r':\s*".*?ש\\\"ח"', lambda m: m.group(0).replace('ש\\"ח', ''), raw_text)

        # Step 4: Remove double quotes inside string values to avoid breaking the JSON
        raw_text = re.sub(
            r'(":[\s]*")([^"]*?)"([^"]*?)"([^"]*?)(")',
            lambda m: f'{m.group(1)}{m.group(2)}{m.group(3)}{m.group(4)}{m.group(5)}',
            raw_text
        )

        # Step 5: Add closing brace if missing
        if raw_text.count("{") > raw_text.count("}"):
            raw_text += "}"

        # Final attempt to parse the cleaned string as JSON
        return json.loads(raw_text)

    except Exception as e:
        print(f"❌ Cleaned JSON still failed: {e}")
        try:
            # Try to show where the parsing failed
            error_index = int(str(e).split("char")[1].strip().strip(")"))
            print("Offending character:", repr(raw_text[error_index-20:error_index+20]))
        except Exception:
            print("Couldn't extract error location.")
        return None
 
# Function to extract apartment data from a Facebook post
# This function uses OpenAI's GPT-4o-mini model to analyze the post text and extract relevant information
def extract_apartment_data(post_text):
    current_year = datetime.now().year

    prompt = f"""
You are a data extraction assistant specializing in Israeli real estate posts on Facebook.

TASK: Extract data from this Facebook post about apartments for rent in Tel Aviv.

CRITICAL INSTRUCTIONS:
1. Most Facebook posts ARE apartment listings unless they're clearly just brief comments.
2. For neighborhood field, ONLY use standard Tel Aviv neighborhood names in English (see list below).
3. Use the CURRENT YEAR ({current_year}) for all dates unless explicitly stated otherwise.
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

For apartment listings, provide this JSON structure:
{{
  "is_apartment": true,
  "category": "<שכירות|מכירה|סאבלט>",
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
  "facebook_url": "<facebook URL or null>"
}}

If the post is a short comment, question, or response without any clear apartment details (e.g., "כמה?", "אשמח לפרטים", "אפשר מחיר?", "נשמע טוב", "שיתוף") — then DO NOT attempt to extract fake apartment data.

In such cases, return ONLY:
{{"is_apartment": false}}

IMPORTANT FORMAT INSTRUCTIONS:
- Always return ONLY a valid JSON object.
- Do NOT wrap the response in ```json or any markdown.
- Ensure the JSON is always complete and includes all fields, even if their value is null or empty.
- If you cannot find a value, set it explicitly to null or an empty list.
- Make sure the JSON is valid and can be parsed correctly.
- Do not include any special characters like quotes ("), backslashes (\), or smart punctuation.
- Avoid writing any content in the "description" field — we will fill it ourselves from the original post.
- If a field contains currency symbols like "ש\"ח", "₪", or commas in numbers — remove them entirely.
- Do not escape any characters. Return clean JSON with plain UTF-8 text.

STANDARD TEL AVIV NEIGHBORHOODS (Use ONLY these in English):
- Old North
- New North
- Neve Tzedek
- Florentin
- Kerem HaTeimanim
- City Center
- Ramat Aviv
- Ramat Aviv Gimel
- Ramat HaHayal
- Bavli
- Yad Eliyahu
- Neve Shaanan
- Shapira
- Kfar Shalem
- Hatikva
- Bitzaron
- Montefiore
- Ajami
- Jaffa D
- Jaffa G
- Old Jaffa
- Neve Ofer
- Tel Kabir
- Neve Avivim
- Givat Amal
- Hadar Yosef
- Neve Sharett
- Tel Baruch
- North Tel Baruch
- Ma'oz Aviv
- Neve Golan
- Neve Chen
- Ganei Tzahala
- Tzahala
- Azorei Chen
- Migdal Neve Tzedek
- Gan Meir
- Bazel

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

⚠️ Output MUST be valid JSON. Even one incorrect quote or unescaped character will break it.

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
        parsed_data = json.loads(result_text)

        if parsed_data is None:
            print(f"JSON parsing failed:\n{result_text[:500]}")
            return None # Stop if the result is not valid

        # Start from an empty/default apartment structure
        full_data = default_structure.copy()

        # Add the data we got from GPT to the default structure
        full_data.update(parsed_data)

        # Ensure category default if missing (robustness)
        if full_data.get("is_apartment") and not full_data.get("category"):
            full_data["category"] = "שכירות"

        # Check if the address includes the same name as the neighborhood (in Hebrew)
        # If yes – remove the address to avoid repeating it
        if full_data.get("address") and full_data.get("neighborhood"):
            hebrew_neighborhoods = {
                "Old North": "הצפון הישן",
                "New North": "הצפון החדש",
                "Neve Tzedek": "נווה צדק",
                "Florentin": "פלורנטין",
                "Kerem HaTeimanim": "כרם התימנים",
                "City Center": "לב תל אביב",
                "Ramat Aviv": "רמת אביב",
                "Ramat Aviv Gimel": "רמת אביב ג'",
                "Ramat HaHayal": "רמת החייל",
                "Bavli": "בבלי",
                "Yad Eliyahu": "יד אליהו",
                "Neve Shaanan": "נווה שאנן",
                "Shapira": "שפירא",
                "Kfar Shalem": "כפר שלם",
                "Hatikva": "התקווה",
                "Bitzaron": "ביצרון",
                "Montefiore": "מונטיפיורי",
                "Ajami": "עג'מי",
                "Jaffa D": "יפו ד'",
                "Jaffa G": "יפו ג'",
                "Old Jaffa": "יפו העתיקה",
                "Neve Ofer": "נווה עופר",
                "Tel Kabir": "תל כביר",
                "Neve Avivim": "נווה אביבים",
                "Givat Amal": "גבעת עמל",
                "Hadar Yosef": "הדר יוסף",
                "Neve Sharett": "נווה שרת",
                "Tel Baruch": "תל ברוך",
                "North Tel Baruch": "תל ברוך צפון",
                "Ma'oz Aviv": "מעוז אביב",
                "Neve Golan": "נווה גולן",
                "Neve Chen": "נווה חן",
                "Ganei Tzahala": "גני צהלה",
                "Tzahala": "צהלה",
                "Azorei Chen": "אזורי חן",
                "Migdal Neve Tzedek": "מגדל נווה צדק",
                "Gan Meir": "גן מאיר",
                "Bazel": "בזל"
            }
            # If address contains the Hebrew name of the neighborhood, we remove it
            hebrew_neighborhood = hebrew_neighborhoods.get(full_data["neighborhood"])
            if hebrew_neighborhood and hebrew_neighborhood in full_data["address"]:
                full_data["address"] = None

        return full_data # Return the final clean apartment data

    except Exception as e:
        # If something goes wrong (like internet or API error), print the error
        print(f"API Error: {e}")
        return None
    
# === Main process: fetch, extract and upload ===
# Get all posts from the "posts" collection where status is "new" or "error"
posts_ref = db.collection("posts")
new_posts = posts_ref.where("status", "in", ["new", "error"]).stream()

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
            print("✗ Not an apartment listing.")
            posts_ref.document(post_id).update({"status": "skipped"})
            continue
        
       # If the category is "החלפה" (home exchange) – skip it
        if data.get("category") == "החלפה":
            print("✗ Home exchange (החלפה) — skipping.")
            posts_ref.document(post_id).update({"status": "skipped_exchange"})
            continue

         # Remove the "is_apartment" key before saving to database
        if "is_apartment" in data:
            del data["is_apartment"]

         # Add extra info before saving
        data["id"] = post_id # Add the post ID
        data["images"] = post.get("images", []) # Add the list of images (if any)
        data["description"] = clean_post_text(post_text) # Clean and add the description

        # יצירת fingerprint לפי שדות קיימים
        fingerprint = generate_fingerprint(data)

        if not fingerprint:
            print(f"✗ Could not generate fingerprint for post {post_id} – skipping.")
            posts_ref.document(post_id).update({"status": "incomplete"})
            continue

        # בדיקת כפילות
        existing = db.collection("apartments").where("fingerprint", "==", fingerprint).get()
        if existing:
            print(f"✗ Duplicate apartment (fingerprint match) – skipping.")
            posts_ref.document(post_id).update({"status": "duplicate"})
            continue

        #  Add the fingerprint to the data
        data["fingerprint"] = fingerprint

        # Check if all important fields are present
        # We need at least price, address, and rooms to consider it a valid apartment post
        important_fields = ["address", "rooms", "price"]
        filled_fields = [f for f in important_fields if data.get(f)]

        if len(filled_fields) == 0:
            print(f"✗ Skipping post {post_id} – no important fields present.")
            posts_ref.document(post_id).update({"status": "incomplete"})  # סטטוס חדש אם תרצי לעבור עליהם בעתיד
            continue

        # Save the full apartment data to the "apartments" collection
        db.collection("apartments").document(post_id).set(data)

        # Mark the original post as processed
        posts_ref.document(post_id).update({"status": "processed"})
        processed += 1 # Count how many were saved
        print(f"Apartment saved: {post_id}")

    except Exception as e:
        # If something went wrong while saving – print error and mark as error
        print(f"Error processing {post_id}: {e}")
        posts_ref.document(post_id).update({"status": "error"})

    time.sleep(0.5)  # Wait half a second before the next post (to avoid overload)

# Print how many apartments we saved at the end
print(f"\n Done! {processed} apartments saved.")