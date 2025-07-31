import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import {
  FaDog, FaFileContract, FaSun, FaParking, FaMapMarkerAlt,FaHome, FaUsers, FaCalendarAlt
} from "react-icons/fa";
import{FaElevator} from "react-icons/fa6";
import Layout from "../components/Layout";

const SearchPage = () => {
  const [priceMax, setPriceMax] = useState(12000);
  const [selectedRooms, setSelectedRooms] = useState("");
  const [entryDate, setEntryDate] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [apartmentMode, setApartmentMode] = useState("");

  const navigate = useNavigate();

  const neighborhoods = [
    { value: "פלורנטין", label: "פלורנטין" },
    { value: "נוה צדק", label: "נוה צדק" },
    { value: "רוטשילד", label: "רוטשילד" },
    { value: "הצפון הישן", label: "הצפון הישן" },
    { value: "יד אליהו", label: "יד אליהו" },
    { value: "רמת אביב", label: "רמת אביב" },
    { value: "התקווה", label: "התקווה" },
    { value: "יפו", label: "יפו" },
  ];

  const roomOptions = Array.from({ length: 9 }, (_, i) => {
    const value = 1 + i * 0.5;
    return { value, label: value.toString() };
  });

  const toggleFeature = (feature) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const renderFeatureButton = (feature, icon) => (
    <button
      key={feature}
      onClick={() => toggleFeature(feature)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition
        ${selectedFeatures.includes(feature)
          ? "border-[#5171b7] text-[#5171b7] bg-white"
          : "border-gray-300 text-gray-600 hover:border-gray-400"}`}
    >
      {icon}
      {feature}
    </button>
  );

  const handleSearch = () => {
    const searchData = {
      neighborhood: selectedNeighborhood,
      priceMax,
      rooms: selectedRooms,
      entryDate,
      apartmentMode,
      features: selectedFeatures,
    };
    console.log("🔎 searchData from SearchPage:", searchData);
    navigate("/results", { state: { searchData } });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-right text-gray-800">חיפוש </h1>

          {/* neighborhoods */}
          <div className="mb-6">
            <label className="block text-right font-semibold mb-2">שכונה</label>
            <Select
              options={neighborhoods}
              value={neighborhoods.find((n) => n.value === selectedNeighborhood)}
              onChange={(option) => setSelectedNeighborhood(option?.value || "")}
              placeholder="בחר שכונה"
              isClearable
              styles={{
                control: (base) => ({ ...base, direction: "rtl", textAlign: "right" }),
                menu: (base) => ({ ...base, zIndex: 9999, direction: "rtl" }),
              }}
            />
          </div>

          {/* Price */}
          <div className="mb-6">
            <label className="block text-right font-semibold mb-2">טווח מחירים</label>
            <div className="flex justify-end mb-1 text-sm text-gray-700">₪{priceMax.toLocaleString()}</div>
            <input
              type="range"
              min="1000"
              max="20000"
              step="100"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-[#5171b7]"
            />
          </div>

          {/* Number of rooms */}
          <div className="mb-6">
            <label className="block text-right font-semibold mb-2">מספר חדרים</label>
            <Select
              options={roomOptions}
              value={roomOptions.find((r) => r.value === selectedRooms)}
              onChange={(option) => setSelectedRooms(option?.value || "")}
              placeholder="בחר מספר חדרים"
              isClearable
              styles={{
                control: (base) => ({ ...base, direction: "rtl", textAlign: "right" }),
                menu: (base) => ({ ...base, zIndex: 9999, direction: "rtl" }),
              }}
            />
          </div>

          {/* Entery Date */}
          <div className="mb-6">
            <label className="block text-right font-semibold mb-2">תאריך כניסה</label>
            <div className="relative">
              {!entryDate && (
                <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />
              )}
              <DatePicker
                selected={entryDate}
                onChange={(date) => setEntryDate(date)}
                placeholderText="בחר תאריך"
                className="w-full border border-gray-300 rounded-lg px-10 py-2 text-right"
                dateFormat="dd/MM/yyyy"
                isClearable
              />
            </div>
          </div>

          {/* Apartment type */}
          <div className="mb-8">
            <label className="block text-right font-semibold mb-3 text-lg">מבנה הדירה</label>
            <div className="flex justify-end gap-4 flex-row-reverse">
              {[
                { label: "שלמה", value: "whole", icon: <FaHome className="text-2xl" /> },
                { label: "דירה עם שותפים", value: "shared", icon: <FaUsers className="text-2xl" /> },
              ].map(({ label, value, icon }) => (
                <button
                  key={value}
                  onClick={() => setApartmentMode(value)}
                  className={`w-32 h-24 rounded-xl border-2 flex flex-col items-center justify-center transition
                    ${apartmentMode === value
                      ? "border-[#5171b7] text-[#5171b7]"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"}`}
                >
                  {icon}
                  <span className="mt-2 text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* More features */}
          <div className="mb-10">
            <label className="block text-right font-semibold mb-2">מסנני חיפוש נוספים</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {renderFeatureButton("חיות מחמד", <FaDog />)}
              {renderFeatureButton("מעלית", <FaElevator />)}
              {renderFeatureButton("מרפסת", <FaSun />)}
              {renderFeatureButton("חניה", <FaParking />)}
              {renderFeatureButton("תיווך", <FaFileContract />)}
              {renderFeatureButton("ממ" + "ד", <FaMapMarkerAlt />)}
            </div>
          </div>

          {/* Show Results button */}
          <button
            onClick={handleSearch}
            className="w-full bg-[#5171b7] hover:bg-[#3f5ea4] text-white text-lg py-3 rounded-xl shadow transition"
          >
            הצג תוצאות
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;
