import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import ApartmentCard from "../components/ApartmentCard";
import useAuth from "../hooks/useAuth";
import useFavorites from "../hooks/useFavorites";
import useApartments from "../hooks/useApartments";
import { SORTS, sortComparators, mapFeature } from "../utils/searchConfig";
import { encodeSearchParams, decodeSearchParams } from "../utils/searchParams";

const toNumber = (n) => {
  const x = typeof n === "string" ? Number(n.replace(/[^\d.-]/g, "")) : Number(n);
  return Number.isFinite(x) ? x : null;
};

const fmtDate = (iso) => {
  try {
    const d = new Date(iso);
    if (!isFinite(d)) return null;
    return d.toLocaleDateString("he-IL");
  } catch {
    return null;
  }
};

export default function SearchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { filters: urlFilters, sortBy: urlSort } = decodeSearchParams(location.search);
  const { searchData: initialSearchData } = location.state || {};
  const [filters, setFilters] = useState(() => initialSearchData || urlFilters || {});
  const { user } = useAuth();
  const { favorites, onToggleFavorite } = useFavorites(user);
  const { apartments, loading } = useApartments();
  const [sortBy, setSortBy] = useState(urlSort || "newest");
  
  useEffect(() => {
    if (initialSearchData) setFilters(initialSearchData);
  }, [initialSearchData]);

 useEffect(() => {
   if (location.pathname !== "/results") return;
   const { search } = encodeSearchParams({ filters, sortBy });
   if (search === location.search) return;
   navigate({ pathname: location.pathname, search }, { replace: true, state: { searchData: filters } });
 }, [filters, sortBy, location.pathname, location.search, navigate]);

  const filtered = useMemo(() => {
    const s = filters || {};
    const heList = Array.isArray(s.neighborhoodsHe) ? s.neighborhoodsHe : [];
    const rMin = s.roomsMin !== "" && s.roomsMin != null ? Number(s.roomsMin) : null;
    const rMax = s.roomsMax !== "" && s.roomsMax != null ? Number(s.roomsMax) : null;
    const dFrom = s.entryDateFrom ? new Date(s.entryDateFrom) : null;
    const dTo = s.entryDateTo ? new Date(s.entryDateTo) : null;
    const allowUnknown = !!s.featuresIncludeUnknown;

    return apartments.filter((apt) => {
      if (s.category && apt.category !== s.category) return false;

      if (heList.length > 0) {
        const heName = (apt.neighborhood || "").trim();
        if (!heList.includes(heName)) return false;
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
          if (dTo && aptDate > dTo) return false;
        }
      }

      if (s.apartmentMode && s.category === "שכירות") {
        const scope = (apt.rental_scope || "").trim();
        if (s.apartmentMode === "whole" && scope !== "דירה שלמה") return false;
        if (s.apartmentMode === "shared" && scope !== "שותף") return false;
      }

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
  }, [apartments, filters]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort(sortComparators[sortBy] ?? sortComparators["newest"]);
    return arr;
  }, [filtered, sortBy]);

  const removeNeighborhood = (he) =>
    setFilters((f) => ({ ...f, neighborhoodsHe: (f.neighborhoodsHe || []).filter((x) => x !== he) }));
  const clearRoomsMin = () => setFilters((f) => ({ ...f, roomsMin: "" }));
  const clearRoomsMax = () => setFilters((f) => ({ ...f, roomsMax: "" }));
  const clearDateFrom = () => setFilters((f) => ({ ...f, entryDateFrom: null }));
  const clearDateTo = () => setFilters((f) => ({ ...f, entryDateTo: null }));
  const clearPriceMax = () => setFilters((f) => ({ ...f, priceMax: "" }));
  const clearMode = () => setFilters((f) => ({ ...f, apartmentMode: "" }));
  const clearCategory = () => setFilters((f) => ({ ...f, category: "" }));
  const removeFeature = (label) =>
    setFilters((f) => ({ ...f, features: (f.features || []).filter((x) => x !== label) }));

  const clearAll = () =>
    setFilters((f) => ({
      category: f.category || "",
      priceMax: "",
      neighborhoodsHe: [],
      roomsMin: "",
      roomsMax: "",
      entryDateFrom: null,
      entryDateTo: null,
      apartmentMode: "",
      features: [],
    }));

  const Chips = () => {
    const chips = [];
    if (filters.category)
      chips.push({ key: "category", label: `סוג עסקה: ${filters.category}`, onClose: clearCategory });

    (filters.neighborhoodsHe || []).forEach((he) =>
      chips.push({ key: `n-${he}`, label: `שכונה: ${he}`, onClose: () => removeNeighborhood(he) })
    );
    if (filters.priceMax)
      chips.push({ key: "priceMax", label: `עד ₪${Number(filters.priceMax).toLocaleString("he-IL")}`, onClose: clearPriceMax });
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
    if (filters.featuresIncludeUnknown) {
      chips.push({
        key: "fnull",
        label: "כולל דירות ללא ציון",
        onClose: () => setFilters((f) => ({ ...f, featuresIncludeUnknown: false })),
      });
    }

    (filters.features || []).forEach((label) =>
      chips.push({ key: `f-${label}`, label, onClose: () => removeFeature(label) })
    );

    if (chips.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 justify-start">
        {chips.map((c) => (
          <span
            key={c.key}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-s sm:text-[15px] text-gray-700"
          >
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
          className="ms-2 rounded-full border border-red-300 bg-white px-3 py-1 text-xs sm:text-[13px] font-medium text-red-600 hover:bg-red-50"
          title="נקה את כל המסננים"
        >
          נקה הכל
        </button>
      </div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 sm:px-6 py-6 sm:py-8" dir="rtl">
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
          {/* Title + count aprtments */}
          <h1 className="text-2xl font-bold text-right">תוצאות החיפוש</h1>
          <p className="text-sm text-gray-500 text-right mt-1 mb-3">
            {!loading ? `נמצאו ${sorted.length} דירות` : ""}
          </p>

          {/* sort + filters */}
          <div className="flex items-center flex-wrap gap-2 mb-4">
            <div className="flex-1">
              <Chips />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-gray-600">מיין לפי:</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-m shadow-sm hover:border-gray-400"
              >
                {SORTS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-500">טוען…</div>
          ) : sorted.length === 0 ? (
            <p className="text-right text-gray-600">לא נמצאו דירות מתאימות.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
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

