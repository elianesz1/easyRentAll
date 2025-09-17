import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { FaDoorOpen, FaKey, FaMoneyBillWave, FaDog,
   FaSun, FaParking, FaMapMarkerAlt, FaHome, FaUsers, FaCalendarAlt } from "react-icons/fa";
import { FaElevator, FaHandshakeSimpleSlash, FaHandshakeSimple  } from "react-icons/fa6";
import Layout from "../components/Layout";
import { NEIGHBORHOODS_HE } from "../utils/neighborhoods";
import { roomOptions, FEATURE_LABELS} from "../utils/searchConfig";
import { encodeSearchParams } from "../utils/searchParams";

const FEATURE_ICONS = {
  "חיות מחמד": FaDog,
  "מעלית": FaElevator,
  "מרפסת": FaSun,
  "חניה": FaParking,
  "ממד": FaMapMarkerAlt,
};


const getSliderCfg = (cat) => {
  if (cat === "מכירה") return { min: 100000, max: 20000000, step: 10000 };
  return { min: 1000, max: 20000, step: 100 };
};


const SearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [category, setCategory] = useState(null);
  const [priceMax, setPriceMax] = useState(null);
  const sliderCfg = useMemo(() => getSliderCfg(category), [category]);
  const sliderMid = useMemo(() => {
  const { max, step } = sliderCfg;
  const mid = (max) / 2;
  return Math.round(mid / step) * step;
}, [sliderCfg]);

  useEffect(() => {
    if (category === "מכירה") setApartmentMode("whole");
  }, [category]);

  useEffect(() => {
  setPriceMax(sliderMid);
}, [category, sliderMid]);


  const [selectedNeighborhoodsHe, setSelectedNeighborhoodsHe] = useState([]); 
  const [roomsMin, setRoomsMin] = useState("");
  const [roomsMax, setRoomsMax] = useState("");
  const [entryDateFrom, setEntryDateFrom] = useState(null);
  const [entryDateTo, setEntryDateTo] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [apartmentMode, setApartmentMode] = useState("");
  const [includeUnknownFeatures, setIncludeUnknownFeatures] = useState(false);
  const [brokerage, setBrokerage] = useState("");
  const prevCategoryRef = useRef(category);


  useEffect(() => {
    const s = location.state?.searchData;
    if (!s) return;
    const cat = s.category ?? null;
    setCategory(cat);
    const cfg = getSliderCfg(cat);
    const raw = typeof s.priceMax === "number" ? s.priceMax : Math.round(((cfg.min + cfg.max) / 2) / cfg.step) * cfg.step;
    const clamped = Math.min(Math.max(raw, cfg.min), cfg.max);
    setPriceMax(clamped);
    setSelectedNeighborhoodsHe(Array.isArray(s.neighborhoodsHe) ? s.neighborhoodsHe : []);
    setRoomsMin(s.roomsMin ?? "");
    setRoomsMax(s.roomsMax ?? "");
    setEntryDateFrom(s.entryDateFrom ? new Date(s.entryDateFrom) : null);
    setEntryDateTo(s.entryDateTo ? new Date(s.entryDateTo) : null);
    setSelectedFeatures(Array.isArray(s.features) ? s.features : []);
    setIncludeUnknownFeatures(!!s.featuresIncludeUnknown);
    setApartmentMode(s.apartmentMode ?? "");
    setBrokerage(s.brokerage ?? "");
    

  }, [location.state]);

  useEffect(() => {
    if (!category) return setPriceMax(null);
    setPriceMax(sliderMid);
  }, [category, sliderMid]);

  useEffect(() => {
  const prev = prevCategoryRef.current;

  if (category === "מכירה") {
    setApartmentMode("whole");
  } else if (prev === "מכירה" && (category === "שכירות" || category === "סאבלט")) {
    setApartmentMode("");
  }

  prevCategoryRef.current = category;
}, [category]);

  const toggleFeature = (feature) => {
    setSelectedFeatures((prev) => (prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]));
  };

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay   = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  const handleSearch = () => {
  const normRoomsMin = roomsMin !== "" ? Number(roomsMin) : "";
  const normRoomsMax = roomsMax !== "" ? Number(roomsMax) : "";
  let [rMin, rMax] = [normRoomsMin, normRoomsMax];
  if (rMin !== "" && rMax !== "" && rMin > rMax) [rMin, rMax] = [rMax, rMin];

  let dFrom = entryDateFrom ? startOfDay(entryDateFrom) : null;
  let dTo   = entryDateTo   ? endOfDay(entryDateTo)     : null;
  if (dFrom && dTo && dFrom > dTo) [dFrom, dTo] = [dTo, dFrom];
  
  const mode = category === "מכירה" ? "whole" : (apartmentMode || "");

  const searchData = {
    category,
    priceMax: typeof priceMax === "number" ? priceMax : sliderCfg.max,
    neighborhoodsHe: selectedNeighborhoodsHe,
    roomsMin: rMin === "" ? "" : rMin,
    roomsMax: rMax === "" ? "" : rMax,
    entryDateFrom: dFrom ? dFrom.toISOString() : null,
    entryDateTo:   dTo   ? dTo.toISOString()   : null,
    apartmentMode: mode, 
    features: selectedFeatures,
    featuresIncludeUnknown: includeUnknownFeatures,
    brokerage,
  };

  const searchStr = encodeSearchParams({ filters: searchData, sortBy: "newest" }).search;
  navigate({ pathname: "/results", search: searchStr }, { state: { searchData } });
};

  const neighborhoodOptions = useMemo(() => NEIGHBORHOODS_HE.map((n) => ({ value: n, label: n })), []);

  const selectedNeighborhoodOptions = useMemo(
    () => neighborhoodOptions.filter((opt) => selectedNeighborhoodsHe.includes(opt.value)),
    [neighborhoodOptions, selectedNeighborhoodsHe]
  );


  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-4xl mx-auto" dir="rtl">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-right text-gray-800">חיפוש</h1>

          {/* category */}
          <div className="mb-6">
            <label className="block text-right font-semibold mb-2"></label>
            <div className="flex flex-wrap justify-end gap-3 sm:gap-4 flex-row-reverse">
              {[
                { label: "שכירות", value: "שכירות", icon: <FaKey className="text-xl sm:text-2xl" /> },
                { label: "מכירה", value: "מכירה", icon: <FaMoneyBillWave className="text-xl sm:text-2xl" /> },
                { label: "סאבלט", value: "סאבלט", icon: <FaDoorOpen className="text-xl sm:text-2xl" /> },
              ].map(({ label, value, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`w-full sm:w-36 h-20 sm:h-24 rounded-xl border-2 flex flex-col items-center justify-center transition
                    ${category === value ? "border-[#5171b7] text-[#5171b7]" : "border-gray-300 text-gray-600 hover:border-gray-400"}`}
                >
                  {icon}
                  <span className="mt-2 text-xs sm:text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

         {/* price */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <label className="font-semibold">מחיר</label>
              <span className="text-sm text-gray-700">
                ₪{(priceMax ?? sliderMid).toLocaleString("he-IL")}
              </span>
            </div>
            <input
              type="range"
              min={sliderCfg.min}
              max={sliderCfg.max}
              step={sliderCfg.step}
              value={priceMax ?? sliderMid}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-[#5171b7] mt-1"
            />
          </div>

          {/* Neighborhoods */}
          <div className="mb-6">
            <label className="block text-right font-semibold mb-2">שכונות</label>
            <Select
              isMulti
              options={neighborhoodOptions}
              value={selectedNeighborhoodOptions}
              onChange={(opts) => setSelectedNeighborhoodsHe(Array.isArray(opts) ? opts.map((o) => o.value) : [])}
              placeholder="בחר/י שכונות…"
              className="text-right"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({ ...base, direction: "rtl", textAlign: "right" }),
                menu: (base) => ({ ...base, zIndex: 9999, direction: "rtl", textAlign: "right" }),
                placeholder: (base) => ({ ...base, direction: "rtl" }),
                singleValue: (base) => ({ ...base, direction: "rtl" }),
                multiValue: (base) => ({ ...base, direction: "rtl" }),
              }}
            />
          </div>

          {/* rooms */}
          <div className="mb-6">
            <label className="block text-right font-semibold mb-2">מספר חדרים</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* entry date */}
          <div className="mb-6">
            <label className="block text-right font-semibold mb-2">תאריך כניסה</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative w-44">
                {!entryDateFrom && <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />}
                <DatePicker
                  selected={entryDateFrom}
                  onChange={(date) => setEntryDateFrom(date)}
                  placeholderText="מ־"
                  className="w-full border border-gray-300 rounded-lg px-10 py-2 text-right"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </div>
              <div className="relative w-44">
                {!entryDateTo && <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />}
                <DatePicker
                  selected={entryDateTo}
                  onChange={(date) => setEntryDateTo(date)}
                  placeholderText="עד"
                  className="w-full border border-gray-300 rounded-lg px-10 py-2 text-right"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </div>
            </div>
          </div>

          {/* whole or shared */}
          <div className="mb-8">
            <label className="block text-right font-semibold mb-3 text-lg">מבנה הדירה</label>
            <div className="flex flex-wrap justify-end gap-3 sm:gap-4 flex-row-reverse">
              {[
                { label: "שלמה", value: "whole", icon: <FaHome className="text-xl sm:text-2xl" /> },
                { label: "דירה עם שותפים", value: "shared", icon: <FaUsers className="text-xl sm:text-2xl" /> },
              ].map(({ label, value, icon }) => {
                const isSale = category === "מכירה";
                const disabled = isSale && value === "shared";
                const selected = isSale ? value === "whole" : apartmentMode === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { if (!disabled) setApartmentMode(value); }}
                    disabled={disabled}
                    className={`w-full sm:w-36 h-20 sm:h-24 rounded-xl border-2 flex flex-col items-center justify-center transition
                      ${selected ? "border-[#5171b7] text-[#5171b7]" : "border-gray-300 text-gray-600 hover:border-gray-400"}
                      ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={label}
                    aria-pressed={selected}
                  >
                    {icon}
                    <span className="mt-2 text-xs sm:text-sm font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>


          {/* brokerage */}
            <div className="mb-8">
              <label className="block text-right font-semibold mb-3 text-lg">תיווך</label>
              <div className="flex flex-wrap justify-end gap-3 sm:gap-4 flex-row-reverse">
                {[
                  { label: "עם תיווך", value: "with",    icon: <FaHandshakeSimple className="text-2xl" /> },
                  { label: "ללא תיווך", value: "without", icon: <FaHandshakeSimpleSlash className="text-2xl" /> },
                ].map(({ label, value, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBrokerage(value)}
                    className={`w-full sm:w-36 h-20 sm:h-24 rounded-xl border-2 flex flex-col items-center justify-center transition
                      ${brokerage === value ? "border-[#5171b7] text-[#5171b7]" : "border-gray-300 text-gray-600 hover:border-gray-400"}`}
                  >
                    {icon}
                    <span className="mt-2 text-xs sm:text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>


       {/* more features */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-right font-semibold text-lg">מסנני חיפוש נוספים</label>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {FEATURE_LABELS.map((label) => {
              const Icon = FEATURE_ICONS[label];
              const active = selectedFeatures.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleFeature(label)}
                  aria-pressed={active}
                  className={`flex items-center justify-center gap-2 h-12 rounded-full border px-4 text-sm font-medium transition
                    ${active
                      ? "border-[#5171b7] text-[#2f3e7c] bg-[#f6f8ff] shadow-sm"
                      : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}
                  title={label}
                >
                  {Icon ? <Icon className="text-base sm:text-lg" /> : null}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* checkbox */}
          <label className="mt-4 flex items-center gap-3 text-base sm:text-[15px] text-gray-800 py-2">
            <input
              type="checkbox"
              checked={includeUnknownFeatures}
              onChange={(e) => setIncludeUnknownFeatures(e.target.checked)}
              className="accent-[#5171b7] w-5 h-5"
            />
            <span className="font-medium">הצג גם דירות שלא צוין לגביהן המסנן הנבחר</span>
          </label>
        </div>


          {/* show results + clearAll buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleSearch} className="flex-1 text-lg py-3 rounded-xl shadow transition bg-[#5171b7] hover:bg-[#3f5ea4] text-white">
              הצג תוצאות
            </button>
            <button
              type="button"
              onClick={() => {
                setCategory(null);
                setPriceMax(null);
                setSelectedNeighborhoodsHe([]);
                setRoomsMin("");
                setRoomsMax("");
                setEntryDateFrom(null);
                setEntryDateTo(null);
                setSelectedFeatures([]);
                setApartmentMode("");
                setBrokerage("");
                setIncludeUnknownFeatures(false);

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
