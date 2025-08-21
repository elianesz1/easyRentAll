import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import {
  FaDog, FaFileContract, FaSun, FaParking, FaMapMarkerAlt, FaHome, FaUsers, FaCalendarAlt
} from "react-icons/fa";
import { FaElevator } from "react-icons/fa6";
import Layout from "../components/Layout";
import { NEIGHBORHOOD_MAP } from "../utils/neighborhoods";

const neighborhoodsHeOptions = Object.values(NEIGHBORHOOD_MAP)
  .sort((a, b) => a.localeCompare(b, "he"))
  .map((he) => ({ value: he, label: he }));

const roomOptions = Array.from({ length: 9 }, (_, i) => {
  const value = 1 + i * 0.5; // 1, 1.5, 2, ... 10
  return { value, label: value.toString() };
});

const FEATURE_KEYS = {
  "חיות מחמד": "pets_allowed",
  "מעלית": "has_elevator",
  "מרפסת": "has_balcony",
  "חניה": "has_parking",
  "תיווך": "has_broker",
  "ממד": "has_safe_room",
  'ממ"ד': "has_safe_room",
};

const SearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ברירות מחדל
  const [priceMax, setPriceMax] = useState(12000);

  // שכונות — בחירה מרובה 
  const [selectedNeighborhoodsHe, setSelectedNeighborhoodsHe] = useState([]); // array of strings (he)

  // טווח חדרים
  const [roomsMin, setRoomsMin] = useState("");
  const [roomsMax, setRoomsMax] = useState("");

  // טווח תאריכי כניסה
  const [entryDateFrom, setEntryDateFrom] = useState(null);
  const [entryDateTo, setEntryDateTo] = useState(null);

  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [apartmentMode, setApartmentMode] = useState("");

  // אם חזרנו מתוצאות — נטען ערכים
  useEffect(() => {
    const s = location.state?.searchData;
    if (!s) return;
    setPriceMax(s.priceMax ?? 12000);
    setSelectedNeighborhoodsHe(Array.isArray(s.neighborhoodsHe) ? s.neighborhoodsHe : []);
    setRoomsMin(s.roomsMin ?? "");
    setRoomsMax(s.roomsMax ?? "");
    setEntryDateFrom(s.entryDateFrom ? new Date(s.entryDateFrom) : null);
    setEntryDateTo(s.entryDateTo ? new Date(s.entryDateTo) : null);
    setSelectedFeatures(Array.isArray(s.features) ? s.features : []);
    setApartmentMode(s.apartmentMode ?? "");
  }, [location.state]);

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
      type="button"
      onClick={() => toggleFeature(feature)}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm text-center transition
        ${selectedFeatures.includes(feature)
          ? "border-[#5171b7] text-[#5171b7] bg-white"
          : "border-gray-300 text-gray-600 hover:border-gray-400"}`}
    >
      {icon}
      {feature}
    </button>
  );

  const handleSearch = () => {
    // נורמליזציה של טווחים (אם min > max נחליף ביניהם)
    const normRoomsMin = roomsMin !== "" ? Number(roomsMin) : "";
    const normRoomsMax = roomsMax !== "" ? Number(roomsMax) : "";
    let [rMin, rMax] = [normRoomsMin, normRoomsMax];
    if (rMin !== "" && rMax !== "" && rMin > rMax) [rMin, rMax] = [rMax, rMin];

    let dFrom = entryDateFrom ? new Date(entryDateFrom) : null;
    let dTo = entryDateTo ? new Date(entryDateTo) : null;
    if (dFrom && dTo && dFrom > dTo) [dFrom, dTo] = [dTo, dFrom];

    const searchData = {
      priceMax,
      neighborhoodsHe: selectedNeighborhoodsHe,     // array of he strings
      roomsMin: rMin === "" ? "" : rMin,
      roomsMax: rMax === "" ? "" : rMax,
      entryDateFrom: dFrom ? dFrom.toISOString() : null,
      entryDateTo: dTo ? dTo.toISOString() : null,
      apartmentMode: apartmentMode || "",
      features: selectedFeatures,
    };
    navigate("/results", { state: { searchData } });
  };

  const selectedNeighborhoodsMulti = useMemo(
    () =>
      neighborhoodsHeOptions.filter((opt) =>
        selectedNeighborhoodsHe.includes(opt.value)
      ),
    [selectedNeighborhoodsHe]
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-6 py-10">
        <div className="max-w-4xl mx-auto" dir="rtl">
          <h1 className="text-3xl font-bold mb-6 text-right text-gray-800">חיפוש</h1>

          {/* Neighborhoods (multi) */}
          <div className="mb-6">
            <label className="block text-right font-semibold mb-2">שכונות</label>
            <Select
              isMulti
              options={neighborhoodsHeOptions}
              value={selectedNeighborhoodsMulti}
              onChange={(options) => setSelectedNeighborhoodsHe(options?.map(o => o.value) || [])}
              placeholder="בחר שכונות"
              isClearable
              closeMenuOnSelect={false}
              styles={{
                control: (base) => ({ ...base, direction: "rtl", textAlign: "right" }),
                menu: (base) => ({ ...base, zIndex: 9999, direction: "rtl" }),
              }}
            />
          </div>

          {/* Price */}
          <div className="mb-6">
            <label className="block text-right font-semibold mb-2">טווח מחירים (מקסימלי)</label>
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

          {/* Rooms range */}
          <div className="mb-6">
            <label className="block text-right font-semibold mb-2">מספר חדרים (טווח)</label>
            <div className="grid grid-cols-2 gap-3">
              <Select
                options={roomOptions}
                value={roomOptions.find((r) => r.value === roomsMin) || null}
                onChange={(opt) => setRoomsMin(opt?.value ?? "")}
                placeholder="מינימום"
                isClearable
                styles={{
                  control: (base) => ({ ...base, direction: "rtl", textAlign: "right" }),
                  menu: (base) => ({ ...base, zIndex: 9999, direction: "rtl" }),
                }}
              />
              <Select
                options={roomOptions}
                value={roomOptions.find((r) => r.value === roomsMax) || null}
                onChange={(opt) => setRoomsMax(opt?.value ?? "")}
                placeholder="מקסימום"
                isClearable
                styles={{
                  control: (base) => ({ ...base, direction: "rtl", textAlign: "right" }),
                  menu: (base) => ({ ...base, zIndex: 9999, direction: "rtl" }),
                }}
              />
            </div>
          </div>

          {/* Entry date range */}
          <div className="mb-6"> <label className="block text-right font-semibold mb-2">תאריך כניסה (טווח)</label>
           <div className="grid grid-cols-2 gap-3">
             <div className="relative"> {!entryDateFrom && <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />} 
             <DatePicker 
             selected={entryDateFrom}
              onChange={(date) => setEntryDateFrom(date)}
               placeholderText="מ־" 
               className="w-full border border-gray-300 rounded-lg px-10 py-2 text-right" 
               dateFormat="dd/MM/yyyy" 
               isClearable />
              </div>
            <div className="relative"> {!entryDateTo && <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />}
                <DatePicker selected={entryDateTo}
                 onChange={(date) => setEntryDateTo(date)} 
                 placeholderText="עד" 
                 className="w-full border border-gray-300 rounded-lg px-10 py-2 text-right" 
                 dateFormat="dd/MM/yyyy" 
                 isClearable /> 
              </div> 
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
                  type="button"
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

          {/* Features */}
          <div className="mb-10">
            <label className="block text-right font-semibold mb-2">מסנני חיפוש נוספים</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {renderFeatureButton("חיות מחמד", <FaDog />)}
              {renderFeatureButton("מעלית", <FaElevator />)}
              {renderFeatureButton("מרפסת", <FaSun />)}
              {renderFeatureButton("חניה", <FaParking />)}
              {renderFeatureButton("תיווך", <FaFileContract />)}
              {renderFeatureButton("ממד", <FaMapMarkerAlt />)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              className="flex-1 bg-[#5171b7] hover:bg-[#3f5ea4] text-white text-lg py-3 rounded-xl shadow transition"
            >
              הצג תוצאות
            </button>
            <button
              type="button"
              onClick={() => {
                setPriceMax(12000);
                setSelectedNeighborhoodsHe([]);
                setRoomsMin("");
                setRoomsMax("");
                setEntryDateFrom(null);
                setEntryDateTo(null);
                setSelectedFeatures([]);
                setApartmentMode("");
              }}
              className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              נקה הכל
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;
