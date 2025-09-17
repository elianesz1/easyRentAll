export const formatPrice = (n) =>
  typeof n === "number" ? `${n.toLocaleString("he-IL")} ₪` : n || "";

export function formatDate(v, locale = "he-IL") {
  if (v == null) return null;
  const d =
    typeof v?.toDate === "function" ? v.toDate() :  
    v instanceof Date ? v :
    (typeof v === "string" && !isNaN(Date.parse(v))) ? new Date(v) :
    null;
  return d ? d.toLocaleDateString(locale) : null;
}
