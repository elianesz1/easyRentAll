from datetime import datetime
from openai import OpenAI
from .config import OPENAI_API_KEY, OPENAI_MODEL, OPENAI_TEMPERATURE, OPENAI_MAX_TOKENS
from .parsing import parse_gpt_output_safe

client = OpenAI(api_key=OPENAI_API_KEY)

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
        return parse_gpt_output_safe(result_text)
    except Exception as e:
        print(f"API Error: {e}")
        return None
