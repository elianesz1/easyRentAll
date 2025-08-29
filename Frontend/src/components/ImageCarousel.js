import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

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

  useEffect(() => {
    if (len === 0) return;
    if (index >= len) setIndex(0);
  }, [len, index]);

  useEffect(() => {
    const onKey = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(document.activeElement)) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") containerRef.current.blur();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  const srcSetFor = useMemo(() => {
    if (!buildSrcForWidth) return null;
    const widths = [320, 480, 640, 800, 1024, 1280];
    return (url) => widths.map((w) => `${buildSrcForWidth(url, w)} ${w}w`).join(", ");
  }, [buildSrcForWidth]);

  if (!len) {
    return (
      <div className={`relative aspect-[4/3] w-full overflow-hidden bg-gray-100 ${className}`} />
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative group aspect-[4/3] w-full overflow-hidden rounded-2xl touch-pan-y ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="גלריית תמונות"
    >
      {imageUrls.map((url, i) => (
        <img
          key={`${url}-${i}`}
          src={srcSetFor ? buildSrcForWidth(url, 800) : url}
          srcSet={srcSetFor ? srcSetFor(url) : undefined}
          sizes={srcSetFor ? sizes : undefined}
          alt={`תמונה ${i + 1}`}
          className={`absolute inset-0 h-full w-full object-cover select-none transition-opacity duration-300 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          loading={i === index ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
        />
      ))}

      {len > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="תמונה קודמת"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10
                       w-8 h-8 sm:w-9 sm:h-9 rounded-full
                       bg-white/80 text-gray-800 shadow-sm
                       opacity-70 md:opacity-0 md:group-hover:opacity-100
                       transition active:scale-95 flex items-center justify-center focus:outline-none"
          >
            <span className="text-[18px] sm:text-[20px] leading-none">‹</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="תמונה הבאה"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10
                       w-8 h-8 sm:w-9 sm:h-9 rounded-full
                       bg-white/80 text-gray-800 shadow-sm
                       opacity-70 md:opacity-0 md:group-hover:opacity-100
                       transition active:scale-95 flex items-center justify-center focus:outline-none"
          >
            <span className="text-[18px] sm:text-[20px] leading-none">›</span>
          </button>

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
