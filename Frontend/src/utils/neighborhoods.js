// מפת שכונות מאנגלית לעברית
export const NEIGHBORHOOD_MAP = {
  "Old North": "הצפון הישן",
  "New North": "הצפון החדש",
  "Neve Tzedek": "נווה צדק",
  "Florentin": "פלורנטין",
  "Kerem HaTeimanim": "כרם התימנים",
  "Lev Tel Aviv": "לב תל אביב",
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
  "Bazel": "בזל",
};

// אנגלית -> עברית
export function neighborhoodToHe(en) {
  if (!en) return en;
  return NEIGHBORHOOD_MAP[en] ?? en;
}

const HE_TO_EN = Object.entries(NEIGHBORHOOD_MAP).reduce((acc, [en, he]) => {
  if (!acc[he]) acc[he] = en;
  return acc;
}, {});

// עברית → אנגלית
export const heToNeighborhood = (he) => HE_TO_EN[he] || he;