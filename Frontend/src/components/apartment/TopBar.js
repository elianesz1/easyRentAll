import React from "react";
import { FaTrashAlt } from "react-icons/fa";
import PropTypes from "prop-types";

export default function TopBar({ isAdmin, editMode, onDelete, onBack }) {
  return (
    <div
      className={`flex items-center max-w-5xl mx-auto px-6 mt-6 ${
        isAdmin && editMode ? "justify-between" : "justify-end"
      }`}
    >
      {isAdmin && editMode && (
        <button
          onClick={onDelete}
          className="bg-red-600 text-white px-4 py-2 rounded-md shadow hover:bg-red-700"
        >
          מחק דירה <FaTrashAlt className="inline ms-2" />
        </button>
      )}

      <button
        onClick={onBack}
        className="text-gray-700 hover:text-blue-600 text-base font-semibold transition"
      >
        ← חזור
      </button>
    </div>
  );
}

TopBar.propTypes = {
  isAdmin: PropTypes.bool,
  editMode: PropTypes.bool,
  onDelete: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};
