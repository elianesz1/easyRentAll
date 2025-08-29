import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";

export default function ImageModal({
  isOpen,
  images = [],
  startIndex = 0,
  onClose,
}) {
  const list = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const safe = Math.min(Math.max(startIndex, 0), Math.max(list.length - 1, 0));
    setIndex(safe);
    setLoaded(false);
  }, [isOpen, startIndex, list.length]);

  const hasMany = list.length > 1;
  const goNext = () => setIndex((i) => (i + 1) % list.length);
  const goPrev = () => setIndex((i) => (i - 1 + list.length) % list.length);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowRight" && hasMany) goNext();   // מקשי מקלדת: ימין = הבא
      else if (e.key === "ArrowLeft" && hasMany) goPrev();    // שמאל = קודם
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, hasMany]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const onTouchStart = (e) => (touchStartX.current = e.touches?.[0]?.clientX ?? null);
  const onTouchEnd = (e) => {
    if (!hasMany || touchStartX.current == null) return;
    const dx = e.changedTouches?.[0]?.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 40) {
      if (dx > 0) goPrev(); 
      else goNext();        
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/75 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {hasMany && (
        <>
          <button
            type="button"
            aria-label="תמונה קודמת"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/90 text-gray-800 text-2xl leading-none shadow z-20 pointer-events-auto hover:scale-105 transition"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="תמונה הבאה"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/90 text-gray-800 text-2xl leading-none shadow z-20 pointer-events-auto hover:scale-105 transition"
          >
            ›
          </button>
        </>
      )}

      <div
        className="relative max-w-[92vw] max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {list[index] && (
          <img
            key={list[index]}         
            src={list[index]}
            alt=""
            draggable={false}
            onLoad={() => setLoaded(true)}
            className={`max-w-[92vw] max-h-[85vh] object-contain rounded-2xl select-none
                        transition-opacity duration-300 ease-in-out
                        ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        )}

        {hasMany && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-sm bg-black/45 px-2 py-0.5 rounded">
            {index + 1}/{list.length}
          </div>
        )}

        <button
          type="button"
          aria-label="סגור"
          onClick={(e) => { e.stopPropagation(); onClose?.(); }}
          className="absolute top-2 right-2 text-white/95 text-3xl leading-none hover:text-white"
        >
          ×
        </button>
      </div>
    </div>,
    document.body
  );
}

ImageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  startIndex: PropTypes.number,
  onClose: PropTypes.func.isRequired,
};
