import React from "react";
import PropTypes from "prop-types";
import FavoriteButton from "../FavoriteButton";

export default function TitleFavorite({ title, isFavorite, onFavClick }) {
  return (
    <div className="flex items-center justify-between my-4">
      <h1 className="text-xl md:text-2xl font-bold leading-tight text-gray-900">
        {title}
      </h1>
     <FavoriteButton
      isFavorite={!!isFavorite}
      onClick={onFavClick}
    />
    </div>
  );
}

TitleFavorite.propTypes = {
  title: PropTypes.string,
  isFavorite: PropTypes.bool,
  onFavClick: PropTypes.func.isRequired,
};
