import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, arrayUnion, arrayRemove, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import Layout from "../components/Layout";
import ApartmentCard from "../components/ApartmentCard";

//Default apartment picture
const placeholderImages = [
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
];

const Home = () => {
  const [apartments, setApartments] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

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
  const fetchApartments = async () => {
    try {
      const snapshot = await getDocs(collection(db, "apartments"));  
      const data = snapshot.docs.map((doc) => {
        const apt = doc.data();
        return {
          id: doc.id,
          title: apt.title || "",
          description: apt.description || "",
          price: apt.price,
          rooms: apt.rooms,
          size: apt.size,
          images: apt.images && Array.isArray(apt.images) && apt.images.length > 0
            ? apt.images : placeholderImages,
        };
      });
      setApartments(data);
    } catch (err) {
      console.error("שגיאה בשליפת דירות:", err);
    }
  };
  fetchApartments();
}, []);


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
      <div className="min-h-screen bg-white font-sans text-brandText">
        {/* Search */}
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
            <span className="text-gray-700 font-medium ml-2">
              חפש את הדירה שלך
            </span>
            <FaSearch className="text-gray-500" />
          </div>
        </section>

        {/* The apartments */}
        <section className="max-w-7xl mx-auto py-14 px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {apartments.map((apartment) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                isFavorite={favorites.includes(apartment.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Home;
