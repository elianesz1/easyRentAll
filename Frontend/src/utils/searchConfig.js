import { cmpNewest, cmpOldest } from "./postDate";

//FEATURES
export const FEATURE_KEYS = {
  "חיות מחמד": "pets_allowed",
  "מעלית": "has_elevator",
  "מרפסת": "has_balcony",
  "חניה": "has_parking",
  "תיווך": "has_broker",
  "ממד": "has_safe_room",
  'ממ"ד': "has_safe_room",
};


export function mapFeature(label) {
    return FEATURE_KEYS[label] ?? null;}


//ROOMS
export const ROOMS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5];

export const roomOptions = ROOMS.map((n) => ({
value: String(n),
label: `${n} חדר${n > 1 ? "ים" : ""}`,
}));


// SORTS 
export const SORTS = [
{ value: "price-asc", label: "מחיר: מהנמוך לגבוה" },
{ value: "price-desc", label: "מחיר: מהגבוה לנמוך" },
{ value: "newest", label: "זמן פרסום: מהחדש לישן" },
{ value: "oldest", label: "זמן פרסום: מהישן לחדש" },
];


function getPostDate(apartment) {
return (apartment.upload_date);
}


export const sortComparators = {
"price-asc": (a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY),
"price-desc": (a, b) => (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY),
newest: cmpNewest,
oldest: cmpOldest,
};

export function displayLabelForValue(value, options) {
const item = options.find((o) => o.value === value);
return item ? item.label : "";
}