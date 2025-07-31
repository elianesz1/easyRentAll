import React from "react";
import {Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import SearchPage from "./pages/SearchPage";
import Home from "./pages/Home";
import FavoritesPage from "./pages/FavoritesPage";
import ApartmentPage from "./pages/ApartmentPage";
import SearchResultsPage from "./pages/SearchResultsPage";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route path="/search" element={<SearchPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/apartment/:id" element={<ApartmentPage />} />
        <Route path="/results" element={<SearchResultsPage />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes> 
  );
}

export default App;
