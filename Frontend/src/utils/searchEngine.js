import { mapFeature } from "./searchConfig";

export const dayKey = (d) =>
  d ? d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() : null;

export const toJsDate = (raw) => {
  if (!raw) return null;
  if (typeof raw?.toDate === "function") return raw.toDate();
  const d = new Date(raw);
  return Number.isFinite(d?.getTime?.()) ? d : null;
};

export const mergeUniqueById = (prev, next) => {
  const map = new Map(prev.map((a) => [a.id, a]));
  for (const item of next) {
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return Array.from(map.values());
};

export function applyFilters(apartments, filters) {
  const s = filters || {};
  const allowUnknown = !!s.featuresIncludeUnknown;

  const heList = Array.isArray(s.neighborhoodsHe) ? s.neighborhoodsHe : [];
  const rMin = s.roomsMin !== "" && s.roomsMin != null ? Number(s.roomsMin) : null;
  const rMax = s.roomsMax !== "" && s.roomsMax != null ? Number(s.roomsMax) : null;

  const dFrom = s.entryDateFrom ? new Date(s.entryDateFrom) : null;
  const dTo = s.entryDateTo ? new Date(s.entryDateTo) : null;
  const fromKey = dFrom ? dayKey(dFrom) : null;
  const toKey = dTo ? dayKey(dTo) : null;

  return apartments.filter((apt) => {
    if (s.category && apt.category !== s.category) return false;

    // Neighborhood
    if (heList.length > 0) {
      const heName = (apt.neighborhood || "").trim();
      if (!heList.includes(heName)) return false;
    }

    // Price 
    if (s.priceMax) {
      const p = apt.price;
      if (p == null || p > Number(s.priceMax)) return false;
    }

    // Rooms 
    if (rMin != null || rMax != null) {
      const r = apt.rooms;
      if (r == null) return false;
      if (rMin != null && r < rMin) return false;
      if (rMax != null && r > rMax) return false;
    }

    // Entry date range 
    if (dFrom || dTo) {
      const dd = toJsDate(apt.available_from);
      if (!dd) {
        if (!allowUnknown) return false;
      } else {
        const k = dayKey(dd);
        if (fromKey && k < fromKey) return false;
        if (toKey && k > toKey) return false;
      }
    }

    // Rental scope for rent/sublet only
      const scope = (apt.rental_scope || "").trim(); 
      if (s.apartmentMode === "whole") {
        if (allowUnknown ? scope && scope !== "דירה שלמה" : scope !== "דירה שלמה") return false;
      } else if (s.apartmentMode === "shared") {
        if (allowUnknown ? scope && scope !== "שותפים" : scope !== "שותפים") return false;
    }

    // Brokerage
    if (s.brokerage) {
      const v = apt.has_broker; 
      if (s.brokerage === "with") {
        if (allowUnknown ? v === false : v !== true) return false;
      } else if (s.brokerage === "without") {
        if (allowUnknown ? v === true : v !== false) return false;
      }
    }

    // Boolean features
    if (Array.isArray(s.features) && s.features.length > 0) {
      for (let label of s.features) {
        const key = mapFeature(label);
        if (!key) continue;
        const val = apt[key]; 
        if (allowUnknown) {
          if (val === false) return false; 
        } else {
          if (val !== true) return false; 
        }
      }
    }

    return true;
  });
}

/* Client-side sorting */
export function applySort(apartments, sortBy) {
  const arr = [...apartments];
  switch (sortBy) {
    case "price-asc":
      arr.sort(
        (a, b) =>
          (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY)
      );
      break;
    case "price-desc":
      arr.sort(
        (a, b) =>
          (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY)
      );
      break;
    case "oldest":
      arr.sort((a, b) => {
        const am = a.indexed_at?.toMillis?.() ?? 0;
        const bm = b.indexed_at?.toMillis?.() ?? 0;
        return am - bm;
      });
      break;
    case "newest":
    default:
      arr.sort((a, b) => {
        const am = a.indexed_at?.toMillis?.() ?? 0;
        const bm = b.indexed_at?.toMillis?.() ?? 0;
        return bm - am;
      });
  }
  return arr;
}
