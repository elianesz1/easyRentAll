import { useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import ImageCarousel from "./ImageCarousel";

export default function ApartmentCard({ apartment, isFavorite, onToggleFavorite }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/apartment/${apartment.id}`)}
      className="bg-white rounded-2xl shadow-soft overflow-hidden relative flex flex-col cursor-pointer transform transition-transform transition-shadow duration-300 hover:scale-105 hover:shadow-lg"
    >
      {/* favorite sign */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(apartment.id);
        }}
        className="absolute top-4 left-4 z-10 text-red-500 text-2xl cursor-pointer bg-white rounded-full p-2 shadow-sm"
      >
        {isFavorite ? <FaHeart /> : <FaRegHeart />}
      </div>

      {/* Image Carousel */}
      <ImageCarousel imageUrls={apartment.images || []} />

      {/* Apartments Details */}
      <div className="p-5 flex flex-col flex-grow">
        <h4 className="text-lg font-bold mb-1">{apartment.title || "ללא כותרת"}</h4>

        <p className="text-gray-500 text-sm mb-4 leading-relaxed">
          {apartment.description
            ? apartment.description.replace(/\\n/g, " ").replace(/\n/g, " ").slice(0, 80) + "..."
            : "אין תיאור זמין."}
        </p>

        <p className="text-gray-700 text-sm">
          חדרים: {apartment.rooms ?? "לא צוין"} · מחיר: {apartment.price ? `${apartment.price} ש"ח` : "לא צוין"}
        </p>
      </div>
    </div>
  );
}
