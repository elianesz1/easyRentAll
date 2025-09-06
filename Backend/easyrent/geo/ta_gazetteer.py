# -*- coding: utf-8 -*-
"""
ta_gazetteer.py
Gazetteer (seed) for Tel Aviv–Yafo neighborhoods:
- Deterministic street -> neighborhood
- Landmark -> neighborhood
- Ambiguous "long streets" list (never decide without disambiguation)
- Hebrew synonyms -> canonical EN
All keys are Hebrew unless noted.

Canonical neighborhoods MUST match your NEIGHBORHOOD_EN_TO_HE keys.
"""

# ======= Ambiguous long streets (never infer neighborhood from these alone) =======
AMBIGUOUS_LONG_STREETS: set[str] = {
    "בן יהודה", "דיזנגוף", "אבן גבירול", "אלנבי", "הרצל", "יפת",
    "הירקון", "שלמה (סלמה)", "שלום עליכם", "יהודה המכבי", "ויצמן",
    "נמיר", "דרך ההגנה", "דרך יפו", "לה גוארדיה", "המסגר", "דרך בגין",
    "שדרות ירושלים", "שדרות ח״ן", "דרך נמיר",
}

# ======= Landmarks -> Canonical EN neighborhood (strong signals) =======
LANDMARK_TO_NEI_EN: dict[str, str] = {
    # יפו
    "שוק הפשפשים": "Jaffa D",
    "מגדל השעון": "Jaffa D",
    "נמל יפו": "Jaffa D",
    "יפו העתיקה": "Old Jaffa",
    # לב העיר / מרכז
    "דיזנגוף סנטר": "Lev Tel Aviv (City Center)",
    "כיכר הבימה": "Lev Tel Aviv (City Center)",
    "שדרות רוטשילד": "Lev Tel Aviv (City Center)",
    "גן החשמל": "Lev Tel Aviv (City Center)",
    "כיכר רבין": "Lev Tel Aviv (City Center)",
    # כרם התימנים
    "שוק הכרמל": "Kerem HaTeimanim",
    # פלורנטין
    "שוק לוינסקי": "Florentin",
    # צפון ישן
    "חוף גורדון": "The Old North",
    "חוף פרישמן": "The Old North",
    "נורדאו": "The Old North",
    "מלון הילטון": "The Old North",
    # נמל/כוכב הצפון
    "נמל תל אביב": "Kochav HaTzafon",
    "תחנת רידינג": "Kochav HaTzafon",
    # הקריה/שרונה
    "עזריאלי": "HaKirya",
    "שרונה": "HaKirya",
}

# ======= Hebrew synonyms/aliases -> Canonical EN neighborhood =======
NEIGH_SYNONYMS_HE_TO_EN: dict[str, str] = {
    "לב תל אביב": "Lev Tel Aviv (City Center)",
    "לב העיר": "Lev Tel Aviv (City Center)",
    "מרכז תל אביב": "Lev Tel Aviv (City Center)",
    "הצפון הישן": "The Old North",
    "הצפון החדש": "The New North",
    "רמת החייל": "Ramat HaHayal",
    "שוק הכרמל": "Kerem HaTeimanim",
    "שוק לוינסקי": "Florentin",
    "גבעת עלייה": "Givat Aliya",
    "גבעת אנדרומדה": "Givat Andromeda",
    "יפה נוף": "Yafe Nof (Jaffa)",
    "הקריה": "HaKirya",
    "כוכב הצפון": "Kochav HaTzafon",
    "פארק צמרת": "Park Tzameret",
    "נווה צדק": "Neve Tzedek",
    "נווה שאנן": "Neve Shaanan",
    "נווה שרת": "Neve Sharett",
    "רמת אביב": "Ramat Aviv",
    "רמת אביב ג": "Ramat Aviv G",
    "שיכון דן": "Shikun Dan",
    "בבלי": "Shikun Bavli",
    "התקווה": "HaTikva",
    "יד אליהו": "Yad Eliyahu",
    "קריית מאיר": "Kiryat Meir",
    "מונטיפיורי": "Montefiore",
    "קריית המלאכה": "Kiryat HaMelekha",
    "קריית שלום": "Kiryat Shalom",
    "נווה עופר": "Neve Ofer",
    "צהלון": "Tzahal On",
}

# ======= Streets -> Canonical EN neighborhood (anchor streets; exact match or with number) =======
# חשוב: אלו עוגנים בטוחים יחסית. הרחיבי בהדרגה.
STREET_TO_NEI_EN: dict[str, str] = {
    # --- יפו / Jaffa ---
    "יהודה הימית": "Tzahal On",
    "אבו נבוט": "Tzahal On",
    "מעפילי אגוז": "Tzahal On",
    "שלבים": "Tzahal On",
    "בית אשל": "Tzahal On",
    "עולי ציון": "Jaffa D",
    "רזיאל": "Jaffa D",
    "נחום גולדמן": "Jaffa D",
    "אילת": "Jaffa D",
    "יפת 241": "Givat Aliya",   # דוגמת קצה דרומי
    "עלי עלייה": "Givat Aliya",
    "יפה נוף": "Yafe Nof (Jaffa)",
    "יפו העתיקה": "Old Jaffa",  # אם מופיע כשם רחוב/כיכר
    # --- פלורנטין / דרום-מרכז ---
    "לוינסקי": "Florentin",
    "ויטל": "Florentin",
    "פרנקל": "Florentin",
    "בר יוחאי": "Florentin",
    "הרצל 90": "Florentin",     # עוגן באזור פלורנטין (כתווך)
    "קויניגסברג": "Florentin",
    "חבשוש": "Florentin",
    # --- כרם התימנים / נחלת בנימין / לב העיר ---
    "קרליבך": "Lev Tel Aviv (City Center)",
    "שמרלינג": "Lev Tel Aviv (City Center)",
    "בוגרשוב": "Lev Tel Aviv (City Center)",
    "שדרות רוטשילד": "Lev Tel Aviv (City Center)",
    "אחד העם": "Lev Tel Aviv (City Center)",
    "לילינבלום": "Lev Tel Aviv (City Center)",
    "נחלת בנימין": "Nachalat Binyamin",
    "הכרמל": "Kerem HaTeimanim",
    "הילל הזקן": "Kerem HaTeimanim",
    "יפה נוף (כרם)": "Kerem HaTeimanim",  # לעתים מופיע כפול; שמרי רק אם בטוח
    # --- נווה צדק ---
    "שבזי": "Neve Tzedek",
    "שלוש": "Neve Tzedek",
    "אהרון שלוש": "Neve Tzedek",
    "אמזלג": "Neve Tzedek",
    "עזרא הסופר": "Neve Tzedek",
    # --- הצפון הישן / החוף ---
    "בן גוריון": "The Old North",
    "ז'בוטינסקי": "The Old North",
    "ארלוזורוב": "The Old North",
    "אוסישקין": "The Old North",
    "ירמיהו": "The Old North",
    "יהושע בן נון": "The Old North",
    "דוד המלך": "The Old North",
    "אורי": "The Old North",
    # --- נמל/כוכב הצפון ---
    "יורדי הסירה": "Kochav HaTzafon",
    "רוקח (קטע נמל)": "Kochav HaTzafon",
    "שמעון התרסי": "Kochav HaTzafon",
    # --- הצפון החדש / רמת אביב / צפון ---
    "יהודה המכבי (קטע מזרחי)": "The New North",
    "הברזל": "Ramat HaHayal",
    "ראול ולנברג": "Ramat HaHayal",
    "שטרית": "Ramat HaHayal",
    "איינשטיין": "Ramat Aviv",
    "ברודצקי": "Ramat Aviv",
    "חליוה": "Ramat Aviv",
    "דולב": "Neve Avivim",
    "קהילת ורשה": "Neve Sharett",
    "אהוד": "Neot Afeka",
    "משה סנה": "Neot Afeka",
    "אבא אחימאיר": "Lamed",
    "חנה רובינא": "Afeka",
    "רות": "Afeka",
    "החייל": "Ramat HaHayal",
    "תל ברוך": "Tel Baruch",
    # --- פארק צמרת / בבלי / צמרת ---
    "יצחק שדה": "Park Tzameret",   # גבולי; השאירי אם מתאים לך
    "אבן גבירול 170+": "Park Tzameret",  # עוגן צפוני מאוד
    "בבלי": "Shikun Bavli",
    "ברודסקי (בבלי)": "Shikun Bavli",
    # --- מונטיפיורי / אזור התעשייה הישן ---
    "דרך מנחם בגין 80-132": "Montefiore",
    "תובל": "Montefiore",
    "המלאכה": "Montefiore",
    "פלוגת הכותל": "Montefiore",
        # --- מזרח/דרום-מזרח ---
    "הברון הירש": "HaTikva",
    'האצ"ל': "HaTikva",
    "נחלת יצחק": "Nachalat Yitzhak",
    "דרך הטייסים": "Ramat HaTayasim",
    "גולומב": "Yad Eliyahu",
    "הגליל": "Yad Eliyahu",
    "לה גארדיה": "Yad Eliyahu",
    "מבצע קדש": "Yad Eliyahu",
    "המסגר 60+": "HaKirya",
    "שאול המלך": "HaKirya",
    "מרמורק": "HaKirya",
    "חשמונאים 90+": "HaKirya",
    "דרך ההגנה 70+": "Kfar Shalem",
    "שלום שבזי (שכ׳)": "Kfar Shalem",
    "הלח״י": "Shapira",
    "מסילת וולפסון": "Shapira",
    "לוינסקי (מזרחה לעליה)": "Shapira",
    "סעדיה גאון": "Neve Shaanan",
    "נווה שאנן": "Neve Shaanan",
    "השומר": "Neve Shaanan",
    "הפנחס": "Kiryat Shalom",
    "מעפילי אגוז (דרומי)": "Kiryat Shalom",
    "אבו כביר": "Abu Kabir",
    "דרך בן-צבי 90+": "Neve Ofer",
    "מררכז באבו-כביר": "Abu Kabir",
    "מתחם נגה": "Tzahal On",
    "נגה": "Tzahal On",
}
