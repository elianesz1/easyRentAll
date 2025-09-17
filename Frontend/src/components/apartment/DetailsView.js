import React from "react";
import PropTypes from "prop-types";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { formatPrice, formatDate } from "../../utils/format";

function BoolIcon({ v }) {
  return v === true ? (
    <FaCheckCircle className="inline text-green-500" />
  ) : v === false ? (
    <FaTimesCircle className="inline text-gray-400" />
  ) : (
    <span>לא צוין</span>
  );
}

export default function DetailsView({ apartment, isForSell }) {
  return (
    <section className="bg-gray-50 rounded-2xl shadow px-6 py-6 text-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <strong>תאריך העלאה:</strong>{" "}
          {apartment.upload_date ? formatDate(apartment.upload_date) : "לא צוין"}
        </div>
        <div>
          <strong>מפרסם:</strong> {apartment.contactName || "לא צוין"}
        </div>

        <div>
          <strong>קטגוריה:</strong> {apartment.category || "לא צוין"}
        </div>
        {!isForSell && (
          <div>
            <strong>סוג השכרה:</strong>{" "}
            {apartment.rental_scope
              ? apartment.rental_scope === "שותפים"
                ? "דירת שותפים"
                : apartment.rental_scope
              : "לא צוין"}
          </div>
        )}

        <div>
          <strong>כתובת:</strong> {apartment.address || "לא צוין"}
        </div>
        <div>
          <strong>מחיר:</strong>{" "}
          {apartment.price ? formatPrice(apartment.price) : "לא צוין"}
        </div>

        <div>
          <strong>שכונה:</strong> {apartment.neighborhood || "לא צוין"}
        </div>
        <div>
          <strong>תאריך כניסה:</strong>{" "}
          {formatDate(apartment.available_from) ?? "לא צוין"}
        </div>

        <div>
          <strong>מספר חדרים:</strong> {apartment.rooms ?? "לא צוין"}
        </div>
        <div>
          <strong>שטח:</strong> {apartment.size ? `${apartment.size} מ"ר` : "לא צוין"}
        </div>

        <div>
          <strong>קומה:</strong>{" "}
          {apartment.floor === 0 ? "קרקע" : apartment.floor ?? "לא צוין"}
        </div>
        <div>
          <strong>מרפסת:</strong> <BoolIcon v={apartment.has_balcony} />
        </div>

        <div>
          <strong>חיות מחמד:</strong> <BoolIcon v={apartment.pets_allowed} />
        </div>
        <div>
          <strong>מעלית:</strong> <BoolIcon v={apartment.has_elevator} />
        </div>

        <div>
          <strong>ממ״ד:</strong> <BoolIcon v={apartment.has_safe_room} />
        </div>
        <div>
          <strong>חניה:</strong> <BoolIcon v={apartment.has_parking} />
        </div>

        <div>
          <strong>מתווך:</strong> <BoolIcon v={apartment.has_broker} />
        </div>
      </div>

      {apartment.description && apartment.description.trim() && (
        <>
          <hr className="my-6 border-gray-200" />
          <h2 className="text-right text-base md:text-lg font-semibold text-gray-800 mb-2">
            הפוסט המקורי מהפייסבוק
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line break-words">
            {(apartment.description || "").replace(/\\n/g, "\n")}
          </p>
        </>
      )}
    </section>
  );
}

DetailsView.propTypes = {
  apartment: PropTypes.object.isRequired,
  isForSell: PropTypes.bool,
};
