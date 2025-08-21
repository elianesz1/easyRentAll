import { useEffect, useState, useCallback } from "react";
import { fetchUserFavorites, toggleFavorite } from "../services/apartments";

export default function useFavorites(user) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (!user) { setFavorites([]); return; }
    (async () => setFavorites(await fetchUserFavorites(user.uid)))();
  }, [user]);

  const onToggleFavorite = useCallback(async (aptId) => {
    if (!user) return;
    const isFav = favorites.includes(aptId);
    await toggleFavorite(user.uid, aptId, isFav);
    setFavorites(prev => isFav ? prev.filter(id => id !== aptId) : [...prev, aptId]);
  }, [user, favorites]);

  return { favorites, onToggleFavorite };
}
