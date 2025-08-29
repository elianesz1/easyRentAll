import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import Layout from "../components/Layout";
import ApartmentCard from "../components/ApartmentCard";
import useAuth from "../hooks/useAuth";
import useApartments from "../hooks/useApartments";
import useFavorites from "../hooks/useFavorites";
import { SORTS, sortComparators, roomOptions } from "../utils/searchConfig";

function toNumber(n) {
  const x = typeof n === "string" ? Number(n.replace(/[^\d.-]/g, "")) : Number(n);
  return Number.isFinite(x) ? x : null;
}

const ROOMS = [
  { value: "", label: "הכל" },
  ...roomOptions
    .filter((o) => parseFloat(o.value) < 5)
    .map(({ value, label }) => ({
      value: String(value),
      label: value === "1" ? "חדר" : value === "1.5" ? "חדר וחצי" : label,
    })),
  { value: "5plus", label: "5+ חדרים" },
];

const Home = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { apartments, loading: aptsLoading } = useApartments();
  const { favorites, onToggleFavorite } = useFavorites(user);
  const [sortBy, setSortBy] = useState("newest");
  const [roomsFilter, setRoomsFilter] = useState("");
  const loading = authLoading || aptsLoading;

  const filteredAndSortedApartments = useMemo(() => {
    let arr = [...apartments];

    // rooms filter
    if (roomsFilter) {
      arr = arr.filter((ap) => {
        const r = toNumber(ap.rooms);
        if (r == null) return false;
        if (roomsFilter === "5plus") return r >= 5;
        return r === Number(roomsFilter);
      });
    }

    // Sort
    arr.sort(sortComparators[sortBy] ?? sortComparators["newest"]);

    return arr;
  }, [apartments, sortBy, roomsFilter]);

  return (
    <Layout>
      <div className="min-h-screen bg-white font-sans text-brandText" dir="rtl">
        <section className="max-w-4xl mx-auto text-center my-10 sm:my-16 px-4">
          <h2 className="text-2xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            מצאו דירה להשכרה בתל אביב
          </h2>
          <p className="text-base sm:text-lg text-gray-500 mb-8 sm:mb-10">
            חפשו, השוו ושמרו דירות שפורסמו בפייסבוק – בקלות ובנוחות.
          </p>
          <div
            onClick={() => navigate("/search")}
            className="cursor-pointer bg-gray-100 hover:bg-gray-200 transition rounded-full shadow-md w-full sm:max-w-md mx-auto px-6 sm:px-8 py-3 sm:py-4 flex items-center justify-center"
          >
            <span className="text-gray-700 font-medium ml-2">חפש את הדירה שלך</span>
            <FaSearch className="text-gray-500" />
          </div>
        </section>

        {/* Sort & filter */}
        <section className="max-w-7xl mx-auto px-4 -mt-4 sm:-mt-6 mb-4">
          <div className="flex flex-wrap items-center justify-start gap-3">
            {/* Sort */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <label htmlFor="sort" className="text-sm text-gray-600">
                מיין לפי:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="min-w-[120px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:border-gray-400"
              >
                {SORTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Room's filter */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <label htmlFor="rooms" className="text-sm text-gray-600">
                מספר חדרים:
              </label>
              <select
                id="rooms"
                value={roomsFilter}
                onChange={(e) => setRoomsFilter(e.target.value)}
                className="min-w-[120px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:border-gray-400"
              >
                {ROOMS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* All apartments*/}
        <section className="max-w-7xl mx-auto py-8 sm:py-10 px-4">
          {loading ? (
            <div className="py-16 text-center text-gray-500">טוען…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {filteredAndSortedApartments.map((apartment) => (
                <ApartmentCard
                  key={apartment.id}
                  apartment={apartment}
                  isFavorite={favorites.includes(apartment.id)}
                  onToggleFavorite={() => onToggleFavorite(apartment.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Home;
