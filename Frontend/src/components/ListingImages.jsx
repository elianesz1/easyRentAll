import useListingImages from "../hooks/useListingImages";
import ImageWithFallback from "./ImageWithFallback";

export default function ListingImages({ images, variant = "card", onOpenModal }) {
  const list = useListingImages(images);
  const count = list.length;

  if (variant === "card") {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
        <ImageWithFallback src={list[0].src} alt="תמונה ראשית" className="h-full w-full object-cover" />
        <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
          {`1/${count}`}
        </span>
      </div>
    );
  }

  if (variant === "detail") {
    const head = list.slice(0, 5);
    const more = count - head.length;

    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="col-span-2 row-span-2 aspect-video overflow-hidden rounded-xl">
          <ImageWithFallback src={head[0]?.src} alt="ראשית" className="h-full w-full object-cover" onClick={onOpenModal} />
        </div>
        {head.slice(1).map((img, i) => (
          <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <ImageWithFallback src={img.src} alt={`תמונה ${i + 2}`} className="h-full w-full object-cover" onClick={onOpenModal} />
            {i === head.slice(1).length - 1 && more > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-lg font-semibold select-none">
                +{more}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
  return null;
}
