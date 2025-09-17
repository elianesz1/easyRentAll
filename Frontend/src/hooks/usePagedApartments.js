import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApartmentsPaged } from "../services/apartments";
import { PAGE_SIZE } from "../utils/searchConfig";
import { mergeUniqueById } from "../utils/searchEngine";

export default function usePagedApartments({
  pageSize = PAGE_SIZE,
  storageKey = null,
  orderByField = "indexed_at",
  orderDir = "desc", 
} = {}) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagesLoaded, setPagesLoaded] = useState(0);
  const key = `${pageSize}|${orderByField}|${orderDir}`;
  const initKeyRef = useRef(null);
  const inFlightRef = useRef(false);

  const loadPage = useCallback(
    async (cur = null, merge = true) => {
      const { items: page, cursor: next, hasMore: hm } =
        await fetchApartmentsPaged({ pageSize, cursor: cur, orderByField, orderDir });
      setItems(prev => (merge ? mergeUniqueById(prev, page) : page));
      setCursor(next);
      setHasMore(hm);
      setPagesLoaded(prev => prev + 1);
      return { next, hm };
    },
    [pageSize, orderByField, orderDir]
  );

  useEffect(() => {
    if (initKeyRef.current === key) return; 
    initKeyRef.current = key;
    (async () => {
      setItems([]);
      setCursor(null);
      setHasMore(true);
      setPagesLoaded(0);
      setInitialLoading(true);
      try {
       const prefetch = (typeof storageKey === "string" && storageKey.length > 0)
          ? Math.max(1, Number(sessionStorage.getItem(storageKey) || 1))
             : 1;
        let next = null;
        for (let i = 0; i < prefetch; i++) {
          const res = await fetchApartmentsPaged({
            pageSize,
            cursor: i ? next : null,
            orderByField,
            orderDir,
          });
          setItems(prev => (i ? mergeUniqueById(prev, res.items) : res.items));
          next = res.cursor;
          setCursor(res.cursor);
          setHasMore(res.hasMore);
          setPagesLoaded(i + 1);
          if (!res.hasMore) break;
        }
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [key, storageKey]);

    const loadMore = useCallback(async () => {
     if (!hasMore || !cursor || loadingMore || initialLoading || inFlightRef.current) return;
      inFlightRef.current = true;
    setLoadingMore(true);
    try {
      await loadPage(cursor, true);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, cursor, loadingMore, initialLoading, loadPage]);

  useEffect(() => {
    return () => {
      if (typeof storageKey === "string" && storageKey.length > 0) {
     sessionStorage.setItem(storageKey, String(pagesLoaded || 1));
   }
    };
  }, [pagesLoaded, storageKey]);

  return { items, hasMore, initialLoading, loadingMore, loadMore };
}
