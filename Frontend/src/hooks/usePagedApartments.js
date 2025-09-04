// src/hooks/usePagedApartments.js
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApartmentsPaged } from "../services/apartments";


export default function usePagedApartments({
  pageSize = 24,
  storageKey = "home-pages",
  orderByField = "indexed_at",
  orderDir = "desc", 
} = {}) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagesLoaded, setPagesLoaded] = useState(0);
  const guard = useRef(false);

  const loadPage = useCallback(
    async (cur = null, merge = true) => {
      const { items: page, cursor: next, hasMore: hm } =
        await fetchApartmentsPaged({ pageSize, cursor: cur, orderByField, orderDir });
      setItems(prev => (merge ? [...prev, ...page] : page));
      setCursor(next);
      setHasMore(hm);
      setPagesLoaded(prev => prev + 1);
      return { next, hm };
    },
    [pageSize, orderByField, orderDir]
  );

  useEffect(() => {
    (async () => {
      guard.current = true;
      setItems([]);
      setCursor(null);
      setHasMore(true);
      setPagesLoaded(0);
      setInitialLoading(true);
      try {
        const prefetch = Math.max(1, Number(sessionStorage.getItem(storageKey) || 1));
        let next = null;
        for (let i = 0; i < prefetch; i++) {
          const res = await fetchApartmentsPaged({
            pageSize,
            cursor: i ? next : null,
            orderByField,
            orderDir,
          });
          setItems(prev => (i ? [...prev, ...res.items] : res.items));
          next = res.cursor;
          setCursor(res.cursor);
          setHasMore(res.hasMore);
          setPagesLoaded(i + 1);
          if (!res.hasMore) break;
        }
      } finally {
        setInitialLoading(false);
        guard.current = false;
      }
    })();
  }, [pageSize, storageKey, orderByField, orderDir]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadPage(cursor, true);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, cursor, loadingMore, loadPage]);

  useEffect(() => {
    return () => {
      sessionStorage.setItem(storageKey, String(pagesLoaded || 1));
    };
  }, [pagesLoaded, storageKey]);

  return { items, hasMore, initialLoading, loadingMore, loadMore };
}
