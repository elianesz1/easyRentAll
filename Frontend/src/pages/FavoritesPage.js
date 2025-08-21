import React, { useMemo } from "react";
import { Link } from "react-router-dom";

import Layout from "../components/Layout";
import ApartmentCard from "../components/ApartmentCard";

import useAuth from "../hooks/useAuth";
import useFavorites from "../hooks/useFavorites";
import useApartments from "../hooks/useApartments";

const FavoritesPage = () => {
  const { user, loading: authLoading, isLoggedIn } = useAuth();
  const { favorites, onToggleFavorite } = useFavorites(user);
  const { apartments, loading: aptsLoading } = useApartments();

  const loading = authLoading || aptsLoading;

  const favApartments = useMemo(
    () => apartments.filter((ap) => favorites.includes(ap.id)),
    [apartments, favorites]
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold mb-6 text-right">❤️ דירות שאהבתי</h2>

        {/* אם המשתמש לא מחובר */}
        {!loading && !isLoggedIn && (
          <div className="py-16 text-center text-gray-600">
            כדי לשמור ולראות דירות שאהבת צריך להתחבר.{" "}
            <Link to="/login" className="text-indigo-600 hover:underline">
              התחברות
            </Link>
          </div>
        )}

        {/* טעינה */}
        {loading && (
          <div className="py-16 text-center text-gray-500">טוען…</div>
        )}

        {/* מחובר ואין מועדפים */}
        {!loading && isLoggedIn && favApartments.length === 0 && (
          <div className="py-16 text-center text-gray-600">
            לא סומנו דירות אהובות עדיין.{" "}
          </div>
        )}

        {/* רשימת מועדפים */}
        {!loading && isLoggedIn && favApartments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favApartments.map((apartment) => (
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
    </Layout>
  );
};

export default FavoritesPage;
