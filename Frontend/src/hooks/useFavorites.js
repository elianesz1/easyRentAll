import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-hot-toast";

export default function useFavorites(user) {
  const uid = user?.uid ?? null;
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (!uid) {
      setFavorites([]);
      return;
    }
    const colRef = collection(db, "users", uid, "favorites");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        setFavorites(snap.docs.map((d) => d.id));
      },
      (err) => {
        console.error("favorites onSnapshot error:", err);
      }
    );
    return () => unsub();
  }, [uid]);

  const onToggleFavorite = async (aptId) => {
    if (!aptId) return;

    if (!uid) {
      toast("כדי לשמור דירות במועדפים יש להתחבר", { icon: "🔒" });
      return false;
    }

    const ref = doc(db, "users", uid, "favorites", aptId);
    const exists = favorites.includes(aptId);

    try {
      if (exists) {
        await deleteDoc(ref);
        setFavorites((prev) => prev.filter((x) => x !== aptId));
      } else {
        await setDoc(ref, { createdAt: serverTimestamp() });
        setFavorites((prev) => (prev.includes(aptId) ? prev : [...prev, aptId]));
      }
      return true;
    } catch (err) {
      toast.error('אירעה שגיאה');
      return false;
    }
  };

  return { favorites, onToggleFavorite };
}
