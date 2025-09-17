import { FaHeart, FaRegHeart } from "react-icons/fa";
export default function FavoriteButton({ isFavorite, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-red-500 text-2xl bg-white/90 rounded-full p-2 shadow-sm hover:scale-110 transition"
      aria-label={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
      title={title || (isFavorite ? "הסר ממועדפים" : "הוסף למועדפים")}
    >
      {isFavorite ? <FaHeart /> : <FaRegHeart />}
    </button>
  );
}
