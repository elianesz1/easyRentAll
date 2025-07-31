
export default function NewGalleryPreview({ images, onImageClick }) {
  const displayImages = images.slice(0, 5);
  const extraCount = images.length - 5;

  const handleClick = (index) => {
    if (typeof onImageClick === "function") {
      onImageClick(index);
    } else {
      console.warn("onImageClick is not a function or missing");
    }
  };

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-xl overflow-hidden h-[400px]">
      {/* Big picture */}
      <div className="row-span-2 col-span-2">
        <img
          src={images[0]}
          alt="main"
          onClick={() => handleClick(0)}
          className="w-full h-full object-cover cursor-pointer rounded-xl"
        />
      </div>

      {/* Little pictures */}
      {displayImages.slice(1).map((img, index) => (
        <div key={index + 1} className="relative">
          <img
            src={img}
            alt={`thumb-${index + 1}`}
            onClick={() => handleClick(index + 1)}
            className="w-full h-full object-cover cursor-pointer rounded-xl"
          />

          {/* click for more pictures */}
          {index === 3 && extraCount > 0 && (
            <div
              onClick={() => handleClick(index + 1)}
              className="absolute inset-0 bg-black bg-opacity-50 text-white flex items-center justify-center text-xl font-semibold cursor-pointer rounded-xl"
            >
              +{extraCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
