import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaTrashAlt, FaHeart, FaRegHeart } from "react-icons/fa";
import Layout from "../components/Layout";
import NewGalleryPreview from "../components/NewGalleryPreview";
import ImageModal from "../components/ImageModal";

import { fetchApartmentById, removeApartmentImage, updateApartment, deleteApartment } from "../services/apartments";
import useAuth from "../hooks/useAuth";
import useFavorites from "../hooks/useFavorites";
import useListingImages from "../hooks/useListingImages";
import { formatPrice, formatDate } from "../utils/format";
import { neighborhoodToHe, heToNeighborhood, NEIGHBORHOOD_MAP } from "../utils/neighborhoods";
import { useAdmin } from "../contexts/AdminContext";

import InlineEditField from "../components/InlineEditField";
import InlineBoolField from "../components/InlineBoolField";
import InlineSelectField from "../components/InlineSelectField";

export default function ApartmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { favorites, onToggleFavorite } = useFavorites(user);
  const { isAdmin, editMode } = useAdmin();

  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const ap = await fetchApartmentById(id);
    setApartment(ap);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const normalized = useListingImages(apartment?.images);
  const imageUrls = normalized.map(i => i.src);
  const isFavorite = useMemo(() => favorites.includes(id), [favorites, id]);

 const neighborhoodOptions = Object.entries(NEIGHBORHOOD_MAP).map(([en, he]) => ({
  value: en,   
  label: he,  
}));

  const saveField = async (patch) => {
    await updateApartment(id, patch);
    setApartment((prev) => ({ ...prev, ...patch }));
  };

  const handleDeleteApartment = async () => {
    const ok = window.confirm("למחוק את הדירה כולה? לא ניתן לבטל.");
    if (!ok) return;
    await deleteApartment(id);
    navigate(-1);
  };

  const handleRemoveImage = async (url) => {
    const ok = window.confirm("למחוק את התמונה הזו?");
    if (!ok) return;
    await removeApartmentImage(id, url);
    setApartment((p) => ({ ...p, images: (p?.images || []).filter((u) => u !== url) }));
  };

  if (loading) {
    return <Layout><div className="py-16 text-center text-gray-500">טוען מידע על הדירה…</div></Layout>;
  }
  if (!apartment) {
    return <Layout><div className="py-16 text-center text-gray-500">הדירה לא נמצאה.</div></Layout>;
  }

  const BoolIcon = ({ v }) =>
    v === true ? <FaCheckCircle className="inline text-green-500" /> :
    v === false ? <FaTimesCircle className="inline text-gray-400" /> :
    <span>לא צוין</span>;

  return (
    <Layout>
      <div className="bg-white min-h-screen">
        {/*  + מחיקת דירה */}
        <div className="flex justify-between items-center max-w-5xl mx-auto px-6 mt-6">
          <button onClick={() => navigate(-1)} className="text-gray-800 hover:text-blue-600 text-base font-semibold transition">← חזור</button>
          {isAdmin && editMode && (
            <button onClick={handleDeleteApartment} className="bg-red-600 text-white px-4 py-2 rounded-md shadow hover:bg-red-700">
              מחק דירה <FaTrashAlt className="inline ms-2" />
            </button>
          )}
        </div>

        <div className="max-w-5xl mx-auto p-6">
          {/* גלריה */}
          {!editMode ? (
            <>
              <NewGalleryPreview
                images={imageUrls}
                onImageClick={(i) => { setCurrentImageIndex(i); setIsModalOpen(true); }}
              />
              {isModalOpen && currentImageIndex !== null && (
                <ImageModal
                  isOpen={isModalOpen}
                  images={imageUrls}
                  currentIndex={currentImageIndex}
                  onClose={() => { setIsModalOpen(false); setCurrentImageIndex(null); }}
                  onNext={() => setCurrentImageIndex((p) => (p + 1) % imageUrls.length)}
                  onPrev={() => setCurrentImageIndex((p) => (p - 1 + imageUrls.length) % imageUrls.length)}
                />
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {imageUrls.map((url, idx) => (
                <div key={url} className="relative">
                  <img src={url} alt={`img-${idx}`} className="w-full h-40 object-cover rounded-md" />
                  <button
                    onClick={() => handleRemoveImage(url)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow hover:bg-red-700"
                    title="מחק תמונה"
                  >✕</button>
                </div>
              ))}
              {imageUrls.length === 0 && <div className="text-sm text-gray-500">אין תמונות להצגה.</div>}
            </div>
          )}

          {/* כותרת + מועדפים */}
          <div className="flex items-center justify-between my-4">
            <h1 className="text-3xl font-bold text-gray-900">{apartment.title || "דירה ללא שם"}</h1>
            <button
              onClick={() => onToggleFavorite(id)}
              className="text-2xl text-red-500 hover:scale-110 transition"
              aria-label={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
              title={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
            >
              {isFavorite ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>

          {/* פרטי דירה*/}
          {!editMode ? (
            <div className="bg-gray-50 rounded-2xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800 text-sm">
              <div><strong>כתובת:</strong> {apartment.address || "לא צוין"}</div>
              <div><strong>מחיר:</strong> {apartment.price ? formatPrice(apartment.price) : "לא צוין"}</div>

              <div><strong>שכונה:</strong> {neighborhoodToHe(apartment.neighborhood) || "לא צוין"}</div>
              <div><strong>תאריך כניסה:</strong> {apartment.available_from ? formatDate(apartment.available_from) : "לא צוין"}</div>

              <div><strong>מספר חדרים:</strong> {apartment.rooms ?? "לא צוין"}</div>
              <div><strong>שטח:</strong> {apartment.size ? `${apartment.size} מ"ר` : "לא צוין"}</div>

              <div><strong>קומה:</strong> {apartment.floor === 0 ? "קרקע" : (apartment.floor ?? "לא צוין")}</div>
              <div><strong>מרפסת:</strong> <BoolIcon v={apartment.has_balcony} /></div>

              <div><strong>חיות מחמד:</strong> <BoolIcon v={apartment.pets_allowed} /></div>
              <div><strong>מעלית:</strong> <BoolIcon v={apartment.has_elevator} /></div>

              <div><strong>ממ״ד:</strong> <BoolIcon v={apartment.has_safe_room} /></div>
              <div><strong>חניה:</strong> <BoolIcon v={apartment.has_parking} /></div>

              <div><strong>מתווך:</strong> <BoolIcon v={apartment.has_broker} /></div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
              {/* עריכה ליד כל שדה */}
              <InlineEditField     label="כתובת"         value={apartment.address}                          onSave={(v)=>saveField({address:v})} />
              <InlineEditField     label="מחיר"       type="number" value={apartment.price}             onSave={(v)=>saveField({price:v})} />

              <InlineSelectField   label="שכונה"         value={neighborhoodToHe(apartment.neighborhood)}
                                   options={neighborhoodOptions}
                                   onSave={(heVal)=>saveField({ neighborhood: heVal ? heToNeighborhood(heVal) : null })} />
              <InlineEditField     label="תאריך כניסה"   type="date"  value={apartment.available_from}     onSave={(v)=>saveField({available_from:v})} />

              <InlineEditField     label="מספר חדרים"    type="number" value={apartment.rooms}             onSave={(v)=>saveField({rooms:v})} />
              <InlineEditField     label="שטח"     type="number" value={apartment.size}              onSave={(v)=>saveField({size:v})} />

              <InlineEditField     label="קומה"          type="number" value={apartment.floor}             onSave={(v)=>saveField({floor:v})} />
              <InlineBoolField     label="מרפסת"         value={apartment.has_balcony}                     onSave={(v)=>saveField({has_balcony:v})} />

              <InlineBoolField     label="חיות מחמד"     value={apartment.pets_allowed}                    onSave={(v)=>saveField({pets_allowed:v})} />
              <InlineBoolField     label="מעלית"         value={apartment.has_elevator}                    onSave={(v)=>saveField({has_elevator:v})} />

              <InlineBoolField     label="ממ״ד"          value={apartment.has_safe_room}                   onSave={(v)=>saveField({has_safe_room:v})} />
              <InlineBoolField     label="חניה"          value={apartment.has_parking}                     onSave={(v)=>saveField({has_parking:v})} />

              <InlineBoolField     label="מתווך"         value={apartment.has_broker}                      onSave={(v)=>saveField({has_broker:v})} />
              <InlineEditField     label="כותרת"         value={apartment.title}                           onSave={(v)=>saveField({title:v})} />
            </div>
          )}

          {/* קישור פייסבוק */}
          {!editMode ? (
            apartment.facebook_url && (
              <div className="mt-6">
                <a href={apartment.facebook_url} target="_blank" rel="noopener noreferrer"
                   className="inline-block bg-blue-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                  מעבר לפוסט בפייסבוק
                </a>
              </div>
            )
          ) : (
            <div className="mt-6">
              <InlineEditField label="קישור לפייסבוק" value={apartment.facebook_url} onSave={(v)=>saveField({facebook_url:v})} />
            </div>
          )}

          {/* טקסט פוסט מקורי */}
          {!editMode ? (
            <p className="text-gray-600 mt-10 leading-relaxed whitespace-pre-line">
              {(apartment.description || "אין תיאור זמין").replace(/\\n/g, "\n")}
            </p>
          ) : (
            <DescriptionEditor
              value={apartment.description ?? ""}
              onSave={async (v)=>{ await saveField({description:v}); }}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}

function DescriptionEditor({ value, onSave }) {
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);
  return (
    <div className="mt-10">
      <h3 className="font-semibold text-gray-800 mb-2">תיאור</h3>
      <textarea
        value={text}
        onChange={(e)=>setText(e.target.value)}
        className="w-full min-h-[160px] border rounded p-3 text-sm"
        placeholder="הקלד תיאור…"
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={async ()=>{ setSaving(true); try { await onSave(text || null); } finally { setSaving(false); } }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          disabled={saving}
        >
          שמור תיאור
        </button>
      </div>
    </div>
  );
}
