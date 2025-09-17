import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import NewGalleryPreview from "../../components/NewGalleryPreview";
import ImageModal from "../../components/ImageModal";

export default function Gallery({ editMode, images = [], imageUrls = [], onRemoveImage }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openModal = useCallback((i) => {
    setCurrentIndex(i);
    setIsModalOpen(true);
  }, []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const handleNext = useCallback(
    () => setCurrentIndex((i) => (i + 1) % imageUrls.length),
    [imageUrls.length]
  );
  const handlePrev = useCallback(
    () => setCurrentIndex((i) => (i - 1 + imageUrls.length) % imageUrls.length),
    [imageUrls.length]
  );

  if (!editMode) {
    return images && images.length > 0 ? (
      <>
        <NewGalleryPreview images={imageUrls} onImageClick={openModal} />
        <ImageModal
          isOpen={isModalOpen}
          images={imageUrls}
          startIndex={currentIndex}
          onClose={closeModal}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      </>
    ) : (
      <p className="text-gray-500 text-sm italic">לא פורסמו תמונות</p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {(images || []).map((url) => (
        <div key={url} className="relative">
          <img src={url} alt="apartment" className="w-full h-40 object-cover rounded-lg" />
          <button
            onClick={() => onRemoveImage?.(url)}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow hover:bg-red-700"
            title="מחק תמונה"
            type="button"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

Gallery.propTypes = {
  editMode: PropTypes.bool,
  images: PropTypes.arrayOf(PropTypes.string),
  imageUrls: PropTypes.arrayOf(PropTypes.string),
  onRemoveImage: PropTypes.func,
};
