// pages/SearchResultsPage.js
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useLocation } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import ApartmentCard from "../components/ApartmentCard"; 
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";


const mapFeature = {
  "חיות מחמד": "pets_allowed",
  "מעלית": "has_elevator",
  "מרפסת": "has_balcony",
  "חניה": "has_parking",
  "תיווך": "has_broker",
  "ממד": "has_safe_room",
  "ממ\"ד": "has_safe_room"
};

const SearchResultsPage = () => {
  const location = useLocation();
  const { searchData } = location.state || {};
  const [results, setResults] = useState([]);
  const [favorites, setFavorites] = useState([]); 
  const [userId, setUserId] = useState(null);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      setUserId(user.uid);
      const userDoc = await getDocs(collection(db, "users"));
      const currentUser = userDoc.docs.find(doc => doc.id === user.uid);
      if (currentUser) {
        setFavorites(currentUser.data().favorites || []);
      }
    }
  });
  return () => unsubscribe();
}, []);


  useEffect(() => {
    if (searchData) {
      fetchAndFilterApartments();
    }
  }, [searchData]);

  const fetchAndFilterApartments = async () => {
    try {
      const snapshot = await getDocs(collection(db, "apartments"));
      const allApartments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const filtered = allApartments.filter((apt) => {
        // Neighborhood
        if (
          searchData.neighborhood &&
          apt.neighborhood?.toLowerCase() !== searchData.neighborhood.toLowerCase()
        ) return false;

        // Price
        if (searchData.priceMax && apt.price > searchData.priceMax) return false;

        // Rooms
        if (searchData.rooms && apt.rooms !== searchData.rooms) return false;

        // Entry Date
        if (searchData.entryDate && apt.available_from) {
          const userDate = new Date(searchData.entryDate);
          const aptDate = new Date(apt.available_from);
          if (aptDate > userDate) return false;
        }

        // Apartment Mode
        if (searchData.apartmentMode) {
          if (
            searchData.apartmentMode === "whole" && apt.property_type !== "apartment"
          ) return false;
          if (
            searchData.apartmentMode === "shared" && apt.property_type !== "shared"
          ) return false;
        }

        // Features
        if (searchData.features && searchData.features.length > 0) {
          for (let label of searchData.features) {
            const key = mapFeature[label];
            if (!apt[key]) return false;
          }
        }

        return true;
      });

      setResults(filtered);
    } catch (err) {
      console.error("שגיאה בטעינת הדירות:", err);
    }
  };

  const toggleFavorite = async (postId) => {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  const isFavorite = favorites.includes(postId);
  try {
    await updateDoc(userRef, {
      favorites: isFavorite ? arrayRemove(postId) : arrayUnion(postId),
    });
    setFavorites((prev) =>
      isFavorite ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  } catch (error) {
    console.error("שגיאה בעדכון מועדפים:", error);
  }
};


  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-6 py-8">
        <h1 className="text-2xl font-bold mb-6 text-right">תוצאות החיפוש</h1>

        {results.length === 0 ? (
          <p className="text-right text-gray-600">לא נמצאו דירות מתאימות.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {results.map((apartment) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                isFavorite={favorites.includes(apartment.id)}
                onToggleFavorite={() => toggleFavorite(apartment.id)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchResultsPage;
