import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import Layout from "../components/Layout";
import ApartmentCard from "../components/ApartmentCard";
import useAuth from "../hooks/useAuth";
import useFavorites from "../hooks/useFavorites";
import { SORTS, roomOptions, SORT_TO_ORDER} from "../utils/searchConfig";
import usePagedApartments from "../hooks/usePagedApartments";
import useInfiniteObserver from "../hooks/useInfiniteObserver";
import SortSelect from "../components/SortSelect";


const ROOMS_UI = [
  { value: "", label: "הכל" },
  ...roomOptions,
  { value: "5plus", label: "5+ חדרים" },
];

const SORT_STORAGE_KEY = "home-sort";
const ROOMS_STORAGE_KEY = "home-rooms";

const Home = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [sortBy, setSortBy] = useState(() => {
    try {
      const saved = localStorage.getItem(SORT_STORAGE_KEY);
      const valid = SORTS.some(s => s.value === saved);
      return valid ? saved : "newest";
    } catch { return "newest"; }
  });
  useEffect(() => {
    try { localStorage.setItem(SORT_STORAGE_KEY, sortBy); } catch {}
  }, [sortBy]);

  const sortCfg = SORT_TO_ORDER[sortBy] || SORT_TO_ORDER["newest"];

  const {
    items: apartments,
    hasMore,
    initialLoading,
    loadingMore,
    loadMore,
  } = usePagedApartments({
    orderByField: sortCfg.field,
    orderDir: sortCfg.dir,
    storageKey: "home-pages",
  });

  const validRoomValues = new Set(ROOMS_UI.map(o => String(o.value)));
  const [roomsFilter, setRoomsFilter] = useState(() => {
    try {
      const saved = localStorage.getItem(ROOMS_STORAGE_KEY);
      return (saved && validRoomValues.has(saved)) ? saved : "";
    } catch { return ""; }
  });
  useEffect(() => {
    try { localStorage.setItem(ROOMS_STORAGE_KEY, roomsFilter); } catch {}
  }, [roomsFilter]);

  const { favorites, onToggleFavorite } = useFavorites(user);

  const filtered = useMemo(() => {
    let arr = apartments;
    if (roomsFilter) {
      arr = arr.filter((ap) => {
        const r = ap.rooms;
        if (r == null) return false;
        if (roomsFilter === "5plus") return r >= 5;
        return r === Number(roomsFilter);
      });
    }
    return arr;
  }, [apartments, roomsFilter]);

  const sentinelRef = useInfiniteObserver(() => {
    if (hasMore && !loadingMore && !initialLoading) loadMore();
  });

  const loading = authLoading || initialLoading;

  return (
    <Layout>
      <div className="min-h-screen bg-white font-sans text-brandText" dir="rtl">
        <section className="max-w-4xl mx-auto text-center my-10 sm:my-16 px-4">
          <h2 className="text-2xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            מצאו את הדירה שלכם בתל אביב!
          </h2>
          <p className="text-base sm:text-lg text-gray-500 mb-8 sm:mb-10">
            חפשו, השוו ושמרו דירות שפורסמו בפייסבוק – בקלות ובנוחות.
          </p>
          <div
            onClick={() => navigate("/search")}
            className="cursor-pointer bg-gray-100 hover:bg-gray-200 transition rounded-full shadow-md w-full sm:max-w-md mx-auto px-6 sm:px-8 py-3 sm:py-4 flex items-center justify-center"
          >
            <span className="text-gray-700 font-medium ml-2">חפש/י את הדירה שלך</span>
            <FaSearch className="text-gray-500" />
          </div>
        </section>

        {/* Sort & filter */}
        <section className="max-w-7xl mx-auto -mt-4 sm:-mt-6 mb-4 px-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* SORT */}
            <SortSelect id="home-sort" value={sortBy} onChange={setSortBy} className="flex flex-wrap items-center gap-2 md:gap-3" />
            {/* rooms */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <label htmlFor="rooms" className="text-sm text-gray-600">מספר חדרים:</label>
              <select
                id="rooms"
                value={roomsFilter}
                onChange={(e) => setRoomsFilter(e.target.value)}
                className="min-w-[120px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:border-gray-400"
              >
                {ROOMS_UI.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="max-w-7xl mx-auto py-8 sm:py-10 px-4">
          {loading ? (
            <div className="py-16 text-center text-gray-500">טוען…</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {filtered.map((apartment) => (
                  <ApartmentCard
                    key={apartment.id}
                    apartment={apartment}
                    isFavorite={favorites.includes(apartment.id)}
                    onToggleFavorite={() => onToggleFavorite(apartment.id)}
                  />
                ))}
              </div>

              {loadingMore && <div className="py-6 text-center text-gray-500">טוען עוד…</div>}
              {hasMore && <div ref={sentinelRef} className="h-8" />}

              {!hasMore && !loadingMore && filtered.length > 0 && (
                <div className="py-6 text-center text-gray-400 text-sm">עברת על כל הדירות! אל דאגה, האתר מתעדכן לעיתים תכופות והדירה שלך כבר תגיע! </div>
              )}
            </>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Home;
