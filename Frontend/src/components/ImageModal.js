import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

export default function ImageModal({ isOpen, images, currentIndex, onClose, onNext, onPrev }) {
  if (!isOpen || !images.length) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center"
      onClick={onClose} 
    >
      {/* exit button */}
      <button
        className="absolute top-6 right-6 text-white text-2xl z-50"
        onClick={onClose}
      >
        <FaTimes />
      </button>

      {/* left arrow */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-6 text-white text-3xl z-40"
      >
        <FaChevronLeft />
      </button>

      {/* picture */}
      <div
        className="max-w-[90vw] max-h-[90vh] w-[700px] h-[500px] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()} 
      >
        <img
          src={images[currentIndex]}
          alt={`תמונה ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-xl"
        />
      </div>

      {/* right arrow */}
      <button
        onClick={(e) => {
          e.stopPropagation(); 
          onNext();
        }}
        className="absolute right-6 text-white text-3xl z-40"
      >
        <FaChevronRight />
      </button>
    </div>
  );
}
