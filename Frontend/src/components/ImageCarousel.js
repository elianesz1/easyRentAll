import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

/**
 * ImageCarousel
 * props:
 *  - imageUrls: string[]  (חובה)
 *  - initialIndex?: number = 0
 *  - className?: string
 *  - onIndexChange?: (i:number) => void
 *  - sizes?: string  (ברירת מחדל טובה לגריד כרטיסים)
 *  - buildSrcForWidth?: (url:string, width:number) => string
 *      פונקציה אופציונלית לבניית URL לרוחבים שונים (למשל Firebase Storage עם resize).
 *      אם לא מספקים – נטען את ה-src הרגיל בלי srcSet.
 */
export default function ImageCarousel({
  imageUrls,
  initialIndex = 0,
  className = "",
  onIndexChange,
  sizes = "(min-width:1280px) 320px, (min-width:768px) 50vw, 100vw",
  buildSrcForWidth,
}) {
  const [index, setIndex] = useState(
    Number.isFinite(initialIndex) ? initialIndex : 0
  );
  const len = imageUrls?.length || 0;

  const containerRef = useRef(null);
  const touchStartX = useRef(null);

  // שמירה על אינדקס בטווח
  useEffect(() => {
    if (len === 0) return;
    if (index >= len) setIndex(0);
  }, [len, index]);

  // אירועי מקלדת
  useEffect(() => {
    const onKey = (e) => {
      if (!containerRef.current) return;
      // נוודא שהפוקוס במכולה/בתוכה כדי לא "לחטוף" מכל העמוד
      if (!containerRef.current.contains(document.activeElement)) return;

      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") containerRef.current.blur();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, len]);

  const next = () => {
    if (!len) return;
    const i = (index + 1) % len;
    setIndex(i);
    onIndexChange?.(i);
  };

  const prev = () => {
    if (!len) return;
    const i = (index - 1 + len) % len;
    setIndex(i);
    onIndexChange?.(i);
  };

  // Swipe במובייל
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      dx < 0 ? next() : prev();
      touchStartX.current = null;
    }
  };
  const onTouchEnd = () => (touchStartX.current = null);

  // בניית srcSet אופציונלית
  const srcSetFor = useMemo(() => {
    if (!buildSrcForWidth) return null;
    // רוחבים נפוצים לתמונות כרטיס/גלריה
    const widths = [320, 480, 640, 800, 1024, 1280];
    return (url) => widths.map((w) => `${buildSrcForWidth(url, w)} ${w}w`).join(", ");
  }, [buildSrcForWidth]);

  if (!len) {
    // אין תמונות – הרכיב יכול להיות מוסתר ע״י ההורה ולהציג תמונת default במקום
    return (
      <div
        className={`relative aspect-[4/3] w-full overflow-hidden bg-gray-100 ${className}`}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="גלריית תמונות"
    >
      {/* התמונות – ממוקמות זו על זו עם מעבר שקיפות */}
      {imageUrls.map((url, i) => (
        <img
          key={`${url}-${i}`}
          src={srcSetFor ? buildSrcForWidth(url, 800) : url}
          srcSet={srcSetFor ? srcSetFor(url) : undefined}
          sizes={srcSetFor ? sizes : undefined}
          alt={`תמונה ${i + 1}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          loading={i === index ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
        />
      ))}

      {/* חצים */}
      {len > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="תמונה קודמת"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:scale-105 transition"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="תמונה הבאה"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:scale-105 transition"

          >
            ›
          </button>

          {/* מונה 1/N */}
          <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
            {index + 1}/{len}
          </span>
        </>
      )}
    </div>
  );
}

ImageCarousel.propTypes = {
  imageUrls: PropTypes.arrayOf(PropTypes.string).isRequired,
  initialIndex: PropTypes.number,
  className: PropTypes.string,
  onIndexChange: PropTypes.func,
  sizes: PropTypes.string,
  buildSrcForWidth: PropTypes.func,
};
