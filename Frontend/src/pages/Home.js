import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import Layout from "../components/Layout";
import ApartmentCard from "../components/ApartmentCard";
import useAuth from "../hooks/useAuth";
import useApartments from "../hooks/useApartments";
import useFavorites from "../hooks/useFavorites";

const SORTS = [
  { value: "price-asc", label: "מחיר: מהנמוך לגבוה" },
  { value: "price-desc", label: "מחיר: מהגבוה לנמוך" },
  { value: "newest", label: "זמן פרסום: מהחדש לישן" },
  { value: "oldest", label: "זמן פרסום: מהישן לחדש" },
];

const ROOMS = [
  { value: "", label: "הכל" },
  { value: "2", label: "2 חדרים" },
  { value: "3", label: "3 חדרים" },
  { value: "4", label: "4 חדרים" },
  { value: "5plus", label: "5+" },
];

function toNumber(n) {
  const x = typeof n === "string" ? Number(n.replace(/[^\d.-]/g, "")) : Number(n);
  return Number.isFinite(x) ? x : null;
}

function getDateValue(ap) {
  const d =
    ap.createdAt || ap.created_at ||
    ap.postedAt  || ap.posted_at  ||
    ap.scrapedAt || ap.scraped_at ||
    ap.timestamp;

  if (!d) return null;
  if (typeof d?.toMillis === "function") return d.toMillis();
  const dt = new Date(d).getTime();
  return Number.isFinite(dt) ? dt : null;
}

const Home = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { apartments, loading: aptsLoading } = useApartments();
  const { favorites, onToggleFavorite } = useFavorites(user);

  const [sortBy, setSortBy] = useState("newest");
  const [roomsFilter, setRoomsFilter] = useState("");

  const loading = authLoading || aptsLoading;

  const clearFilters = () => {
    setSortBy("newest");
    setRoomsFilter("");
  };

  const filteredAndSortedApartments = useMemo(() => {
    let arr = [...apartments];

    // סינון חדרים
    if (roomsFilter) {
      arr = arr.filter((ap) => {
        const r = toNumber(ap.rooms);
        if (!r) return false;
        if (roomsFilter === "5plus") return r >= 5;
        return r === Number(roomsFilter);
      });
    }

    // מיון
    switch (sortBy) {
      case "price-asc":
        arr.sort((a, b) => (toNumber(a.price) ?? Infinity) - (toNumber(b.price) ?? Infinity));
        break;
      case "price-desc":
        arr.sort((a, b) => (toNumber(b.price) ?? -Infinity) - (toNumber(a.price) ?? -Infinity));
        break;
      case "oldest":
        arr.sort((a, b) => (getDateValue(a) ?? Infinity) - (getDateValue(b) ?? Infinity));
        break;
      case "newest":
      default:
        arr.sort((a, b) => (getDateValue(b) ?? -Infinity) - (getDateValue(a) ?? -Infinity));
        break;
    }

    return arr;
  }, [apartments, sortBy, roomsFilter]);

  return (
    <Layout>
      <div className="min-h-screen bg-white font-sans text-brandText">
        <section className="max-w-4xl mx-auto text-center my-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
            מצאו דירה להשכרה בתל אביב
          </h2>
          <p className="text-lg text-gray-500 mb-10">
            חפשו, השוו ושמרו דירות שפורסמו בפייסבוק – בקלות ובנוחות.
          </p>
          <div
            onClick={() => navigate("/search")}
            className="cursor-pointer bg-gray-100 hover:bg-gray-200 transition rounded-full shadow-md max-w-md mx-auto px-8 py-4 flex items-center justify-center"
          >
            <span className="text-gray-700 font-medium ml-2">חפש את הדירה שלך</span>
            <FaSearch className="text-gray-500" />
          </div>
        </section>

        {/* מיון וסינון */}
        <section className="max-w-7xl mx-auto px-4 -mt-6 mb-4">
          <div className="flex items-center justify-start gap-3" dir="rtl">
             {/* מיון */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-gray-600">
                מיין לפי:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:border-gray-400"
              >
                {SORTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* חדרים */}
            <div className="flex items-center gap-2">
              <label htmlFor="rooms" className="text-sm text-gray-600">
                מספר חדרים:
              </label>
              <select
                id="rooms"
                value={roomsFilter}
                onChange={(e) => setRoomsFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:border-gray-400"
              >
                {ROOMS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

           

            {/* נקה הכל */}
            <button
              onClick={clearFilters}
              className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition"
              title="נקה את כל הסינונים והחזר לברירת המחדל"
            >
              נקה הכל
            </button>
          </div>
        </section>

        {/* תצוגת כל הדירות */}
        <section className="max-w-7xl mx-auto py-10 px-4">
          {loading ? (
            <div className="py-16 text-center text-gray-500">טוען…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
