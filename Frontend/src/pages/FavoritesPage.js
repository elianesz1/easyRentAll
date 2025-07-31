import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import Layout from "../components/Layout";
import ApartmentCard from "../components/ApartmentCard";

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        if (userData?.favorites) {
          setFavorites(userData.favorites);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (favorites.length === 0) {
        setApartments([]);
        return;
      }

      const snapshot = await getDocs(collection(db, "apartments"));
      const allApts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        images: doc.data().images || [],
      }));
      const filtered = allApts.filter(apt => favorites.includes(apt.id));
      setApartments(filtered);
    };

    fetchFavorites();
  }, [favorites]);

  const toggleFavorite = async (postId) => {
    if (!userId) return;
    const userRef = doc(db, "users", userId);
    try {
      await updateDoc(userRef, {
        favorites: arrayRemove(postId),
      });
      setFavorites(prev => prev.filter(id => id !== postId));
    } catch (error) {
      console.error("שגיאה בעדכון מועדפים:", error);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold mb-6 text-right">❤️ דירות שאהבתי</h2>
        {apartments.length === 0 ? (
          <p className="text-center text-gray-600">לא סומנו דירות אהובות עדיין.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {apartments.map((apartment) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                isFavorite={favorites.includes(apartment.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FavoritesPage;
