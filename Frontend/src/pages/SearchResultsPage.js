// src/pages/SearchResultsPage.js
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import ApartmentCard from "../components/ApartmentCard";

import useAuth from "../hooks/useAuth";
import useFavorites from "../hooks/useFavorites";
import useApartments from "../hooks/useApartments";

import { heToNeighborhood } from "../utils/neighborhoods";

// ---- helpers ----
const mapFeature = {
  "חיות מחמד": "pets_allowed",
  "מעלית": "has_elevator",
  "מרפסת": "has_balcony",
  "חניה": "has_parking",
  "תיווך": "has_broker",
  "ממד": "has_safe_room",
  'ממ"ד': "has_safe_room",
};

const toNumber = (n) => {
  const x = typeof n === "string" ? Number(n.replace(/[^\d.-]/g, "")) : Number(n);
  return Number.isFinite(x) ? x : null;
};

const getDateValue = (ap) => {
  const d =
    ap.createdAt || ap.created_at ||
    ap.postedAt  || ap.posted_at  ||
    ap.scrapedAt || ap.scraped_at ||
    ap.timestamp || ap.available_from;

  if (!d) return null;
  if (typeof d?.toMillis === "function") return d.toMillis();
  const ms = new Date(d).getTime();
  return Number.isFinite(ms) ? ms : null;
};

const fmtDate = (iso) => {
  try {
    const d = new Date(iso);
    if (!isFinite(d)) return null;
    return d.toLocaleDateString("he-IL");
  } catch { return null; }
};

const SORTS = [
  { value: "price-asc",  label: "מחיר: מהנמוך לגבוה" },
  { value: "price-desc", label: "מחיר: מהגבוה לנמוך" },
  { value: "newest",     label: "זמן פרסום: מהחדש לישן" },
  { value: "oldest",     label: "זמן פרסום: מהישן לחדש" },
];

export default function SearchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchData: initialSearchData } = location.state || {};

  const { user } = useAuth();
  const { favorites, onToggleFavorite } = useFavorites(user);
  const { apartments, loading } = useApartments();

  // פילטרים חיים
  const [filters, setFilters] = useState(() => initialSearchData || {});

  // --- sortBy from URL (persist between navigations) ---
  const searchParams = new URLSearchParams(location.search);
  const initialSortFromUrl = searchParams.get("sort") || "newest";
  const [sortBy, setSortBy] = useState(initialSortFromUrl);

  // כשנכנסים עם state חדש – נטען לפילטרים
  useEffect(() => {
    if (initialSearchData) setFilters(initialSearchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearchData]);

  // בכל שינוי sortBy – נעדכן את ה־URL (replace שלא יוסיף היסטוריה מיותרת)
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    sp.set("sort", sortBy);
    navigate({ pathname: location.pathname, search: `?${sp.toString()}` }, { replace: true, state: { searchData: filters } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  // --- סינון לפי filters ---
  const filtered = useMemo(() => {
    const s = filters || {};
    const heList = Array.isArray(s.neighborhoodsHe) ? s.neighborhoodsHe : [];
    const enList = heList.map((he) => heToNeighborhood(he).toLowerCase());

    const rMin = s.roomsMin !== "" && s.roomsMin != null ? Number(s.roomsMin) : null;
    const rMax = s.roomsMax !== "" && s.roomsMax != null ? Number(s.roomsMax) : null;

    const dFrom = s.entryDateFrom ? new Date(s.entryDateFrom) : null;
    const dTo   = s.entryDateTo   ? new Date(s.entryDateTo)   : null;

    return apartments.filter((apt) => {
      if (enList.length > 0) {
        const a = (apt.neighborhood || "").toLowerCase();
        if (!enList.includes(a)) return false;
      }

      if (s.priceMax) {
        const p = toNumber(apt.price);
        if (p != null && p > Number(s.priceMax)) return false;
      }

      if (rMin != null || rMax != null) {
        const r = toNumber(apt.rooms);
        if (r == null) return false;
        if (rMin != null && r < rMin) return false;
        if (rMax != null && r > rMax) return false;
      }

      if ((dFrom || dTo) && apt.available_from) {
        const aptDate = new Date(apt.available_from);
        if (isFinite(aptDate)) {
          if (dFrom && aptDate < dFrom) return false;
          if (dTo   && aptDate > dTo)   return false;
        }
      }

      if (s.apartmentMode) {
        if (s.apartmentMode === "whole"  && apt.property_type !== "apartment") return false;
        if (s.apartmentMode === "shared" && apt.property_type !== "shared")    return false;
      }

      if (Array.isArray(s.features) && s.features.length > 0) {
        for (let label of s.features) {
          const key = mapFeature[label];
          if (!key) continue;
          if (!apt[key]) return false;
        }
      }

      return true;
    });
  }, [apartments, filters]);

  // --- מיון ---
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "price-asc":
        arr.sort((a, b) => (toNumber(a.price) ?? Infinity)    - (toNumber(b.price) ?? Infinity));
        break;
      case "price-desc":
        arr.sort((a, b) => (toNumber(b.price) ?? -Infinity)    - (toNumber(a.price) ?? -Infinity));
        break;
      case "oldest":
        arr.sort((a, b) => (getDateValue(a) ?? Infinity)       - (getDateValue(b) ?? Infinity));
        break;
      case "newest":
      default:
        arr.sort((a, b) => (getDateValue(b) ?? -Infinity)      - (getDateValue(a) ?? -Infinity));
        break;
    }
    return arr;
  }, [filtered, sortBy]);

  // ---- פעולות להסרת פילטרים (בשורת הצ'יפים) ----
  const removeNeighborhood = (he) =>
    setFilters((f) => ({ ...f, neighborhoodsHe: (f.neighborhoodsHe || []).filter((x) => x !== he) }));
  const clearRoomsMin   = () => setFilters((f) => ({ ...f, roomsMin: "" }));
  const clearRoomsMax   = () => setFilters((f) => ({ ...f, roomsMax: "" }));
  const clearDateFrom   = () => setFilters((f) => ({ ...f, entryDateFrom: null }));
  const clearDateTo     = () => setFilters((f) => ({ ...f, entryDateTo: null }));
  const clearPriceMax   = () => setFilters((f) => ({ ...f, priceMax: "" }));
  const clearMode       = () => setFilters((f) => ({ ...f, apartmentMode: "" }));
  const removeFeature   = (label) =>
    setFilters((f) => ({ ...f, features: (f.features || []).filter((x) => x !== label) }));
  const clearAll = () =>
    setFilters({
      priceMax: "",
      neighborhoodsHe: [],
      roomsMin: "",
      roomsMax: "",
      entryDateFrom: null,
      entryDateTo: null,
      apartmentMode: "",
      features: [],
    });

  const Chips = () => {
    const chips = [];
    (filters.neighborhoodsHe || []).forEach((he) =>
      chips.push({ key: `n-${he}`, label: `שכונה: ${he}`, onClose: () => removeNeighborhood(he) })
    );
    if (filters.priceMax)
      chips.push({ key: "priceMax", label: `עד ₪${Number(filters.priceMax).toLocaleString()}`, onClose: clearPriceMax });
    if (filters.roomsMin !== "" && filters.roomsMin != null)
      chips.push({ key: "rmin", label: `מינ' חדרים: ${filters.roomsMin}`, onClose: clearRoomsMin });
    if (filters.roomsMax !== "" && filters.roomsMax != null)
      chips.push({ key: "rmax", label: `מקס' חדרים: ${filters.roomsMax}`, onClose: clearRoomsMax });
    if (filters.entryDateFrom)
      chips.push({ key: "dfrom", label: `כניסה מ־ ${fmtDate(filters.entryDateFrom)}`, onClose: clearDateFrom });
    if (filters.entryDateTo)
      chips.push({ key: "dto", label: `כניסה עד ${fmtDate(filters.entryDateTo)}`, onClose: clearDateTo });
    if (filters.apartmentMode === "whole")
      chips.push({ key: "mode", label: "דירה שלמה", onClose: clearMode });
    else if (filters.apartmentMode === "shared")
      chips.push({ key: "mode", label: "דירה עם שותפים", onClose: clearMode });
    (filters.features || []).forEach((label) =>
      chips.push({ key: `f-${label}`, label, onClose: () => removeFeature(label) })
    );
    if (chips.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 justify-end mb-3">
        {chips.map((c) => (
          <span key={c.key} className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700">
            {c.label}
            <button
              type="button"
              onClick={c.onClose}
              className="rounded-full border border-gray-300 px-1 leading-none text-gray-500 hover:bg-gray-100"
              aria-label={`הסר ${c.label}`}
              title={`הסר ${c.label}`}
            >
              ✕
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={clearAll}
          className="ms-2 rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          title="נקה את כל המסננים"
        >
          נקה הכל
        </button>
      </div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-6 py-8" dir="rtl">
        {/* back to search */}
        <div className="max-w-7xl mx-auto flex justify-end mb-4">
          <button
            onClick={() => navigate("/search", { state: { searchData: filters } })}
            className="text-gray-800 hover:text-blue-600 text-base font-semibold transition"
          >
            ← חזור לחיפוש
          </button>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* toolbar: sort + count */}
          <div className="max-w-7xl mx-auto">
            {/* כותרת */}
            <h1 className="text-2xl font-bold text-right">
              תוצאות החיפוש
            </h1>
            <p className="text-sm text-gray-500 text-right mt-1 mb-3">
              {(!loading && sorted.length >= 0) ? `נמצאו ${sorted.length} דירות` : ""}
            </p>

            {/* מיון בצד ימין */}
              <div className="flex items-center gap-2 mb-6">
                <label htmlFor="sort" className="text-sm text-gray-600">מיין לפי:</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:border-gray-400"
                >
                  {SORTS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
          </div>

          {/* chips */}
          <Chips />

          {loading ? (
            <div className="py-16 text-center text-gray-500">טוען…</div>
          ) : sorted.length === 0 ? (
            <p className="text-right text-gray-600">לא נמצאו דירות מתאימות.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {sorted.map((apartment) => (
                <ApartmentCard
                  key={apartment.id}
                  apartment={apartment}
                  isFavorite={favorites.includes(apartment.id)}
                  onToggleFavorite={() => onToggleFavorite(apartment.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
