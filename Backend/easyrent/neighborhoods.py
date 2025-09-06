# Single source of truth for neighborhood mapping (EN -> HE).
# Use these EN keys in the prompt; store HE in Firestore after EN->HE conversion.
NEIGHBORHOOD_EN_TO_HE = {
    # --- Core Tel Aviv & Center ---
    "Lev Tel Aviv (City Center)": "לב תל אביב",
    "The Old North": "הצפון הישן",
    "The New North": "הצפון החדש",
    "Park Tzameret": "פארק צמרת",
    "Kiryat Meir": "קריית מאיר",
    "Montefiore": "מונטיפיורי",
    "Nordia": "נורדיה",
    "Nachalat Binyamin": "נחלת בנימין",
    "Kerem HaTeimanim": "כרם התימנים",
    "Tel Nordau": "תל נורדאו",
    "Tel Haim": "תל חיים",
    "Tel Baruch": "תל ברוך",
    "Kochav HaTzafon": "כוכב הצפון",
    "HaKirya": "הקריה",

    # --- Old Jaffa & South Tel Aviv / Yafo blocks ---
    "Jaffa A": "יפו א",
    "Givat Andromeda": "גבעת אנדרומדה",
    "Givat Aliya": "גבעת עלייה",
    "Yafe Nof (Jaffa)": "יפה נוף",
    "Jaffa G": "יפו ג'",
    "Jaffa D": "יפו ד'",
    "Old Jaffa": "יפו העתיקה",
    "Manshiya (Jaffa)": "מנשייה (יפו)",
    "Neve Shalom": "נווה שלום",
    "Sakanat Al-Turki": "סכנת א-תורכי",
    "Pardes Daka": "פרדס דכה",
    "Tzahal On": "צהלון",
    "Shikuney Chisachon": "שיכוני חיסכון",

    # --- South / East Tel Aviv ---
    "Florentin": "פלורנטין",
    "Shapira": "שפירא",
    "HaArgazim": "הארגזים",
    "HaTikva": "התקווה",
    "Yad Eliyahu": "יד אליהו",
    "Kiryat Shalom": "קריית שלום",
    "Kiryat HaMelekha": "קריית המלאכה",
    "Neve Shaanan": "נווה שאנן",
    "Ezra": "עזרא",
    "Revivim": "רביבים",
    "Abu Kabir": "אבו כביר",
    "Givat Herzl": "גבעת הרצל",
    "HaMishtala": "המשתלה",  # (לעיתים משויך לצפון־מזרח)

    # --- Neve* blocks ---
    "Neve Tzedek": "נווה צדק",
    "Neve Ofer": "נווה עופר",
    "Neve Barbur": "נווה ברבור",
    "Neve Chen": "נווה חן",
    "Neve Kfir": "נווה כפיר",
    "Neve Eliezer": "נווה אליעזר",
    "Neve Sharett": "נווה שרת",
    "Neve Avivim": "נווה אביבים",
    "Neve Tzahal": "נווה צה\"ל",

    # --- Ramat* blocks ---
    "Ramat Aviv": "רמת אביב",
    "Ramat Aviv G": "רמת אביב ג'",
    "Ramat HaHayal": "רמת החייל",
    "Ramat HaTayasim": "רמת הטייסים",
    "Ramat Yisrael": "רמת ישראל",

    # --- Afeka & Northern clusters ---
    "Afeka": "אפקה",
    "Neot Afeka": "נאות אפקה",
    "Maoz Aviv": "מעוז אביב",
    "Lamed": "למד",
    "Nofei Yam": "נופי ים",
    "Azorei Hen": "אזורי חן",
    "Shikun Dan": "שיכון דן",
    "Shikun Bavli": "שיכון בבלי",
    "Shikun Tzameret": "שיכון צמרת",
    "Kiryat Shaul": "קריית שאול",
    "Tzahala": "צהלה",

    # --- Misc / Commercial / Industrial named areas (still used in listings) ---
    "Merkaz Ba'alei Melacha": "מרכז בעלי מלאכה",
    "Merkaz Miskhari": "מרכז מסחרי",

    # --- Smaller/less common labels (keep if you see them in posts) ---
    "Bitzaron": "ביצרון",
    "Nachalat Yitzhak": "נחלת יצחק",
    "Kfar Shalem": "כפר שלם",
    "Yedidya": "ידידיה",
    "Ahuva": "אחווה",
    "Givat Amal B": "גבעת עמל ב'",
    "Ohel Moshe": "אוהל משה",

    # --- (Optional/rare—keep only if you truly encounter them in posts) ---
    "Ofek HaYam": "אופק הים",
    "Orot": "אורות",
    "Yarkon Industrial Zone": "אזור תעשייה עבר הירקון",
    "Kerem Yisrael": "כרם ישראל",
    "Kerem Moshe": "כרם משה",
    "Shpak": "שפאק",
    "Pakidei Apak": "פקידי אפ\"ק",
}