
function toYmd(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (!isFinite(d)) return null;
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch {
    return null;
  }
}

export function encodeSearchParams({ filters = {}, sortBy } = {}) {
  const params = new URLSearchParams();
  if (sortBy) params.set("sort", String(sortBy));
  const {
    category,
    priceMax,
    neighborhoodsHe,
    roomsMin,
    roomsMax,
    entryDateFrom,
    entryDateTo,
    apartmentMode,
    features,
    featuresIncludeUnknown,
  } = filters;
  if (category) params.set("cat", String(category));
  if (priceMax !== "" && priceMax != null) params.set("priceMax", String(priceMax));
  if (Array.isArray(neighborhoodsHe) && neighborhoodsHe.length > 0) {
    neighborhoodsHe.forEach((n) => {
      if (n != null && n !== "") params.append("nh", String(n));
    });
  }
  if (roomsMin !== "" && roomsMin != null) params.set("rmin", String(roomsMin));
  if (roomsMax !== "" && roomsMax != null) params.set("rmax", String(roomsMax));
  const dFrom = toYmd(entryDateFrom);
  const dTo = toYmd(entryDateTo);
  if (dFrom) params.set("dfrom", dFrom);
  if (dTo) params.set("dto", dTo);
  if (apartmentMode) params.set("mode", String(apartmentMode));
  if (Array.isArray(features) && features.length > 0) {
    features.forEach((f) => {
      if (f != null && f !== "") params.append("f", String(f));
    });
  }
  if (featuresIncludeUnknown) params.set("fnull", "1");
  return { search: `?${params.toString()}`, params };
}

export function decodeSearchParams(search = "") {
  const sp = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const sortBy = sp.get("sort") || null;
  const category = sp.get("cat") || "";
  const priceMaxStr = sp.get("priceMax");
  const priceMax = priceMaxStr != null ? Number(priceMaxStr) : "";
  const neighborhoodsHe = sp.getAll("nh");
  const roomsMinStr = sp.get("rmin");
  const roomsMaxStr = sp.get("rmax");
  const roomsMin = roomsMinStr != null ? Number(roomsMinStr) : "";
  const roomsMax = roomsMaxStr != null ? Number(roomsMaxStr) : "";
  const entryDateFrom = sp.get("dfrom") || null;
  const entryDateTo = sp.get("dto") || null;
  const apartmentMode = sp.get("mode") || "";
  const features = sp.getAll("f");
  const featuresIncludeUnknown = sp.get("fnull") === "1";
  const filters = {
    category,
    priceMax,
    neighborhoodsHe,
    roomsMin,
    roomsMax,
    entryDateFrom,
    entryDateTo,
    apartmentMode,
    features,
    featuresIncludeUnknown,
  };

  return { filters, sortBy };
}
