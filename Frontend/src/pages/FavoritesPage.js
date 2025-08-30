import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import ApartmentCard from "../components/ApartmentCard";
import useAuth from "../hooks/useAuth";
import useFavorites from "../hooks/useFavorites";
import useApartments from "../hooks/useApartments";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const { favorites, onToggleFavorite } = useFavorites(user);
  const { apartments, loading: aptsLoading } = useApartments();

  const loading = authLoading || aptsLoading;

  const favApartments = useMemo(
    () => apartments.filter((ap) => favorites.includes(ap.id)),
    [apartments, favorites]
  );

  return (
    <Layout>
      <div className="min-h-screen bg-white px-4 sm:px-6 py-6 sm:py-8" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-right">דירות שאהבתי</h1>
            <p className="text-sm text-gray-500 text-right mt-1">
              {loading ? "" : `נמצאו ${favApartments.length} דירות במועדפים`}
            </p>
          </div>

          {loading ? (
  <div className="py-16 text-center text-gray-500">טוען…</div>
) : favApartments.length === 0 ? (
  !user ? (
    <div className="bg-white rounded-2xl shadow p-6 sm:p-8 text-center">
      <p className="text-gray-700 mb-3">כדי לשמור דירות למועדפים, יש להתחבר/להירשם.</p>
      <Link to="/login" className="inline-block bg-[#5171b7] hover:bg-[#3f5ea4] text-white px-4 py-2 rounded-lg shadow">
        התחברות
      </Link>
    </div>
  ) : (
    <div className="bg-white rounded-2xl shadow p-6 sm:p-8 text-center">
      <p className="text-gray-700 mb-3">אין עדיין דירות במועדפים.</p>
      <Link to="/search" className="inline-block bg-[#5171b7] hover:bg-[#3f5ea4] text-white px-4 py-2 rounded-lg shadow">
        חפשו דירות
      </Link>
    </div>
  )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
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
      </div>
    </Layout>
  );
}
