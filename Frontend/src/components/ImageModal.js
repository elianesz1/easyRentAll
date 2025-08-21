import React, { useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";

export default function ImageModal({
  isOpen,
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  buildSrcForWidth, // אופציונלי
  sizes = "(min-width:1280px) 70vw, 90vw", // אופציונלי
}) {
  const backdropRef = useRef(null);

  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  const index = Number.isFinite(currentIndex) ? currentIndex : 0;

  // טיפול במקלדת
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowRight") onNext?.();
      else if (e.key === "ArrowLeft") onPrev?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, onNext, onPrev]);

  // מניעת גלילה ברקע כשפתוח
  useEffect(() => {
    if (!isOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  const srcSetFor = useMemo(() => {
    if (!buildSrcForWidth) return undefined;
    const widths = [640, 960, 1280, 1600, 1920];
    return (url) => widths.map((w) => `${buildSrcForWidth(url, w)} ${w}w`).join(", ");
  }, [buildSrcForWidth]);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose?.();
      }}
    >
      <div className="relative max-w-6xl w-full">
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="סגור"
          className="absolute -top-10 right-0 md:-top-12 text-white/90 hover:text-white text-3xl"
        >
          ×
        </button>

        {/* Prev/Next */}
        {list.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev?.();
              }}
              aria-label="תמונה קודמת"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:scale-105 transition"

            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext?.();
              }}
              aria-label="תמונה הבאה"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:scale-105 transition"

            >
              ›
            </button>
          </>
        )}

        {/* Image */}
        <div
          className="mx-auto overflow-hidden rounded-2xl bg-black"
          onClick={(e) => e.stopPropagation()}
        >
          {list.map((url, i) => (
            <img
              key={`${url}-${i}`}
              src={srcSetFor ? buildSrcForWidth(url, 1280) : url}
              srcSet={srcSetFor ? srcSetFor(url) : undefined}
              sizes={srcSetFor ? sizes : undefined}
              alt={`תמונה ${i + 1}`}
              className={`max-h-[80vh] w-auto mx-auto transition-opacity duration-300 ${
                i === index ? "opacity-100" : "opacity-0 absolute"
              }`}
              loading={i === index ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
            />
          ))}
        </div>

        {/* Counter */}
        {list.length > 1 && (
          <div className="mt-3 text-center text-white/90 text-sm">
            {index + 1}/{list.length}
          </div>
        )}
      </div>
    </div>
  );
}

ImageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentIndex: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  buildSrcForWidth: PropTypes.func,
  sizes: PropTypes.string,
};
