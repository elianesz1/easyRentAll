import { useEffect, useRef } from "react";

export default function useInfiniteObserver(onVisible, { root = null, rootMargin = "0px", threshold = 0.1 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onVisible?.();
    }, { root, rootMargin, threshold });

    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible, root, rootMargin, threshold]);

  return ref;
}
