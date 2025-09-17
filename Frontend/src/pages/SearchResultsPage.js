import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import ApartmentCard from "../components/ApartmentCard";
import useAuth from "../hooks/useAuth";
import useFavorites from "../hooks/useFavorites";
import { encodeSearchParams, decodeSearchParams } from "../utils/searchParams";
import { formatDate } from "../utils/format";
import SortSelect from "../components/SortSelect";
import { applyFilters } from "../utils/searchEngine";
import usePagedApartments from "../hooks/usePagedApartments";
import useInfiniteObserver from "../hooks/useInfiniteObserver";
import { SORT_TO_ORDER } from "../utils/searchConfig";


export default function SearchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { filters: urlFilters, sortBy: urlSort } = decodeSearchParams(location.search);
  const { searchData: initialSearchData } = location.state || {};
  const [filters, setFilters] = useState(() => initialSearchData || urlFilters || {});
  const [sortBy, setSortBy] = useState(urlSort || "newest");
  const sortCfg = SORT_TO_ORDER[sortBy] || SORT_TO_ORDER["newest"];
  const {items,hasMore,initialLoading,loadingMore,loadMore,} = 
    usePagedApartments({orderByField: sortCfg.field, orderDir: sortCfg.dir, storageKey: null ,});
  const sentinelRef = useInfiniteObserver(() => {
  if (hasMore && !loadingMore && !initialLoading)
     loadMore(); }, { rootMargin: "300px" });

  const { user } = useAuth();
  const { favorites, onToggleFavorite } = useFavorites(user);

  useEffect(() => {
  sessionStorage.setItem("results-pages", "1");
}, []);

  // accept state from Search page (when navigating back)
  useEffect(() => {
    if (initialSearchData) setFilters(initialSearchData);
  }, [initialSearchData]);

  useEffect(() => {
    if (location.pathname !== "/results") return;
    const { search } = encodeSearchParams({ filters, sortBy });
    if (search === location.search) return;
    navigate({ pathname: location.pathname, search }, { replace: true, state: { searchData: filters } });
  }, [filters, sortBy, location.pathname, location.search, navigate]);

  const clientFiltered = useMemo(() => applyFilters(items, filters), [items, filters]);

  /* Chip actions */
  const removeNeighborhood = (he) =>
    setFilters((f) => ({ ...f, neighborhoodsHe: (f.neighborhoodsHe || []).filter((x) => x !== he) }));
  const clearRoomsMin = () => setFilters((f) => ({ ...f, roomsMin: "" }));
  const clearRoomsMax = () => setFilters((f) => ({ ...f, roomsMax: "" }));
  const clearDateFrom = () => setFilters((f) => ({ ...f, entryDateFrom: null }));
  const clearDateTo = () => setFilters((f) => ({ ...f, entryDateTo: null }));
  const clearPriceMax = () => setFilters((f) => ({ ...f, priceMax: "" }));
  const clearMode = () => setFilters((f) => ({ ...f, apartmentMode: "" }));
  const clearCategory = () => setFilters((f) => ({ ...f, category: "" }));
  const clearBrokerage = () => setFilters((f) => ({ ...f, brokerage: "" }));
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
      brokerage: "",
      featuresIncludeUnknown: false,
    }));

  /* Chips UI */
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
      chips.push({ key: "dfrom", label: `כניסה מ־ ${formatDate(filters.entryDateFrom)}`, onClose: clearDateFrom });
    if (filters.entryDateTo)
      chips.push({ key: "dto", label: `כניסה עד ${formatDate(filters.entryDateTo)}`, onClose: clearDateTo });
    if (filters.apartmentMode === "whole")
      chips.push({ key: "mode", label: "דירה שלמה", onClose: clearMode });
    else if (filters.apartmentMode === "shared")
      chips.push({ key: "mode", label: "דירה עם שותפים", onClose: clearMode });
    if (filters.brokerage === "with")
      chips.push({ key: "broker", label: "עם תיווך", onClose: clearBrokerage });
    else if (filters.brokerage === "without")
      chips.push({ key: "broker", label: "ללא תיווך", onClose: clearBrokerage });
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

  /* Render */
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 sm:px-6 py-6 sm:py-8" dir="rtl">
        <div className="max-w-7xl mx-auto flex justify-end mb-4">
          <button
            onClick={() => navigate("/search", { state: { searchData: filters } })}
            className="text-gray-800 hover:text-blue-600 text-base font-semibold transition"
          >
            ← חזור לחיפוש
          </button>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Title + count */}
          <h1 className="text-2xl font-bold text-right">תוצאות החיפוש</h1>
          
          {/* sort + filters */}
          <div className="flex items-center flex-wrap gap-2 mb-4">
            <div className="flex-1">
              <Chips />
            </div>
            <SortSelect id="home-sort" value={sortBy} onChange={setSortBy} className="flex flex-wrap items-center gap-2 md:gap-3" />
          </div>

          {initialLoading ? (
            <div className="py-16 text-center text-gray-500">טוען…</div>
          ) :  clientFiltered.length === 0 ? (
            <p className="text-right text-gray-600">לא נמצאו דירות מתאימות.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {clientFiltered.map((apartment) => (
                  <ApartmentCard
                    key={apartment.id}
                    apartment={apartment}
                    isFavorite={favorites.includes(apartment.id)}
                    onToggleFavorite={() => onToggleFavorite(apartment.id)}
                  />
                ))}
              </div>

             {loadingMore && <div className="mt-6 text-center text-gray-500">טוען…</div>}
             {hasMore && <div ref={sentinelRef} className="h-8" />}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
