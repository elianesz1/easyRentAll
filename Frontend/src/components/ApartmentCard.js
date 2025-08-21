import React from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart, FaTrashAlt } from "react-icons/fa";
import ImageCarousel from "./ImageCarousel";
import defaultPic from "../assets/defaultPic.png";
import { formatPrice } from "../utils/format";
import PropTypes from "prop-types";
import { useAdmin } from "../contexts/AdminContext";
import { deleteApartment } from "../services/apartments";

export default function ApartmentCard({ apartment, isFavorite, onToggleFavorite }) {
  const navigate = useNavigate();
  const { isAdmin, editMode } = useAdmin();

  if (!apartment) return null;

  const {
    id,
    title,
    description,
    images: rawImages = [],
    price,
    rooms,
  } = apartment;

  // תמונות נקיות
  const images = Array.isArray(rawImages) ? rawImages.filter(Boolean) : [];
  const hasImages = images.length > 0;

  const goToDetails = () => navigate(`/apartment/${id}`);

  const handleDelete = async (e) => {
    e.stopPropagation();
    const ok = window.confirm("למחוק את הדירה הזו? לא ניתן לבטל.");
    if (!ok) return;
    try {
      await deleteApartment(id);
    } catch (err) {
      console.error("מחיקת דירה נכשלה:", err);
      alert("אירעה שגיאה במחיקה. בדקי הרשאות וכללים.");
    }
  };

  return (
    <div
      onClick={goToDetails}
      className="bg-white rounded-2xl shadow-soft overflow-hidden relative flex flex-col cursor-pointer transform transition-transform transition-shadow duration-300 hover:scale-105 hover:shadow-lg"
    >
      {/* כפתור מועדפים */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(id);
        }}
        className="absolute top-4 left-4 z-10 text-red-500 text-2xl bg-white rounded-full p-2 shadow-sm hover:scale-110 transition"
        aria-label={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
        title={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
      >
        {isFavorite ? <FaHeart /> : <FaRegHeart />}
      </button>

      {/* כפתור מחיקה - רק לאדמין ובמצב עריכה */}
      {isAdmin && editMode && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-4 z-10 text-white bg-red-600 hover:bg-red-700 rounded-md px-3 py-1 flex items-center gap-2 text-sm shadow"
          title="מחק דירה"
        >
          <FaTrashAlt className="text-xs" />
          מחיקה
        </button>
      )}

      {/* אזור התמונות */}
      {hasImages ? (
        <ImageCarousel imageUrls={images} />
      ) : (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            src={defaultPic}
            alt="תמונת ברירת מחדל"
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
          <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
            1/1
          </span>
        </div>
      )}

      {/* פרטי הדירה */}
      <div className="p-5 flex flex-col flex-grow">
        <h4 className="text-lg font-bold mb-1">{title || "ללא כותרת"}</h4>

        <p className="text-gray-500 text-sm mb-4 leading-relaxed line-clamp-3">
          {description
            ? description.replace(/\\n/g, " ").replace(/\n/g, " ")
            : "אין תיאור זמין."}
        </p>

        <p className="text-gray-700 text-sm">
          חדרים: {rooms ?? "לא צוין"} · מחיר:{" "}
          {typeof price === "number" ? formatPrice(price) : price || "לא צוין"}
        </p>
      </div>
    </div>
  );
}

ApartmentCard.propTypes = {
  apartment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    rooms: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
  isFavorite: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
};
