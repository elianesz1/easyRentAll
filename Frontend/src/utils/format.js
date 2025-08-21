export const formatPrice = (n) =>
  typeof n === "number" ? `${n.toLocaleString("he-IL")} ₪` : n || "";

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("he-IL") : "";
