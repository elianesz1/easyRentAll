import React, { useState } from "react";
import { FaHeart, FaRegHeart, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const placeholderImage = "https://via.placeholder.com/800x600?text=No+Image";

export default function ImageCarousel({ imageUrls = [], isFavorite = false, onToggleFavorite, height = "h-80" }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalImages = imageUrls.length || 1;

  const nextImage = () => {
    setCurrentIndex((currentIndex + 1) % totalImages);
  };

  const prevImage = () => {
    setCurrentIndex((currentIndex - 1 + totalImages) % totalImages);
  };

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden`}>
      {/* current picture */}
      <img
        src={imageUrls[currentIndex] || placeholderImage}
        alt={`תמונה ${currentIndex + 1}`}
        className="w-full h-full object-cover"
      />

      {/* favorite sign */}
      {onToggleFavorite && (
        <div
          className="absolute top-3 left-3 z-10 bg-white bg-opacity-70 rounded-full p-2 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        >
          {isFavorite ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-red-500 text-xl" />}
        </div>
      )}

      {/* Arrows */}
      {totalImages > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2"
          >
            <FaChevronLeft />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2"
          >
            <FaChevronRight />
          </button>
        </>
      )}

      {/* picturea counter */}
      {totalImages > 1 && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white text-xs px-3 py-1 rounded-full">
          {currentIndex + 1}/{totalImages}
        </div>
      )}
    </div>
  );
}
