import React, { useMemo } from "react";
import PropTypes from "prop-types";

function Thumb({
  url,
  alt,
  onClick,
  className = "",
  buildSrcForWidth,
  sizes = "(min-width:1024px) 25vw, 50vw",
}) {
  const srcSet = useMemo(() => {
    if (!buildSrcForWidth) return undefined;
    const widths = [320, 480, 640, 800];
    return widths.map((w) => `${buildSrcForWidth(url, w)} ${w}w`).join(", ");
  }, [url, buildSrcForWidth]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
      aria-label={alt}
    >
      <img
        src={srcSet ? buildSrcForWidth(url, 640) : url}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </button>
  );
}

/**
 * NewGalleryPreview
 * props:
 *  - images: string[] (חובה)
 *  - onImageClick: (index:number) => void (חובה)
 *  - buildSrcForWidth?: (url, width) => url  // אופציונלי, ל-srcset
 *  - sizes?: string                           // אופציונלי
 */
export default function NewGalleryPreview({
  images,
  onImageClick,
  buildSrcForWidth,
  sizes,
}) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  const shown = list.slice(0, 5);
  const more = list.length - shown.length;

  if (!list.length) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2 row-span-2 aspect-video rounded-xl bg-gray-100" />
        <div className="aspect-[4/3] rounded-xl bg-gray-100" />
        <div className="aspect-[4/3] rounded-xl bg-gray-100" />
        <div className="aspect-[4/3] rounded-xl bg-gray-100" />
        <div className="aspect-[4/3] rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* גדולה ראשית */}
      <Thumb
        url={shown[0]}
        alt="תמונה ראשית"
        onClick={() => onImageClick(0)}
        className="col-span-2 row-span-2 aspect-video"
        buildSrcForWidth={buildSrcForWidth}
        sizes={sizes}
      />
      {/* יתר התמונות */}
      {shown.slice(1).map((url, i) => {
        const absoluteIndex = i + 1; // כי חתכנו 1 ראשונה
        const isLastTile = i === shown.slice(1).length - 1 && more > 0;
        return (
          <div key={`${url}-${i}`} className="relative">
            <Thumb
              url={url}
              alt={`תמונה ${absoluteIndex + 1}`}
              onClick={() => onImageClick(absoluteIndex)}
              className="aspect-[4/3]"
              buildSrcForWidth={buildSrcForWidth}
              sizes={sizes}
            />
            {isLastTile && (
              <button
                type="button"
                onClick={() => onImageClick(absoluteIndex)}
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 text-white text-lg font-semibold"
                aria-label={`פתח עוד ${more} תמונות`}
              >
                +{more}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

NewGalleryPreview.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  onImageClick: PropTypes.func.isRequired,
  buildSrcForWidth: PropTypes.func,
  sizes: PropTypes.string,
};
