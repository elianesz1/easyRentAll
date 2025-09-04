import { useEffect, useState } from "react";
import { fetchSearchApartments } from "../services/apartments";

export default function useSearchApartments({ filters = {}, sortField = "indexed_at", sortDir = "desc" } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSearchApartments({ filters, sortField, sortDir })
      .then((res) => { if (!cancelled) setItems(res); })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });

  }, [JSON.stringify(filters), sortField, sortDir]);

  return { items, loading, error };
}
