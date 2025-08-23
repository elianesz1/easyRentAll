import { useEffect, useMemo, useState } from "react";
import { fetchAllApartments } from "../services/apartments";
import defaultPic from "../assets/defaultPic.png";

export default function useApartments() {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await fetchAllApartments();
      const norm = list.map(a => ({
        ...a,
        images: Array.isArray(a.images) && a.images.length ? a.images : [defaultPic],
      }));
      setApartments(norm);
      setLoading(false);
    })();
  }, []);

  const count = useMemo(() => apartments.length, [apartments]);
  return { apartments, loading, count };
}
