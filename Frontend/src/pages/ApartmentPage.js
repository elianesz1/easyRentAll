import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import NewGalleryPreview from "../components/NewGalleryPreview";
import ImageModal from "../components/ImageModal";
import { FaCheckCircle, FaTimesCircle, FaTrashAlt, FaHeart, FaRegHeart, FaPhoneAlt, FaWhatsapp, FaFacebookMessenger } from "react-icons/fa";
import { NEIGHBORHOODS_HE } from "../utils/neighborhoods"; 
import { fetchApartmentById, removeApartmentImage, updateApartment, deleteApartment } from "../services/apartments";
import useAuth from "../hooks/useAuth";
import useFavorites from "../hooks/useFavorites";
import useListingImages from "../hooks/useListingImages";
import { formatPrice, formatDate } from "../utils/format";
import { useAdmin } from "../contexts/AdminContext";
import InlineEditField from "../components/InlineEditField";
import InlineBoolField from "../components/InlineBoolField";
import InlineSelectField from "../components/InlineSelectField";
import { toast } from "react-hot-toast";

export default function ApartmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, onToggleFavorite } = useFavorites(user);
  const { isAdmin, editMode } = useAdmin();
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const handleNext = () => setCurrentIndex(i => (i + 1) % imageUrls.length);
  const handlePrev = () => setCurrentIndex(i => (i - 1 + imageUrls.length) % imageUrls.length);
  const [showPhone, setShowPhone] = useState(false);
  
  

  const handleFavClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast?.("כדי לשמור במועדפים יש להתחבר");
      return;
    }
    if (!apartment?.id) return;       
    await onToggleFavorite(apartment.id);
  };


  // phone
  const isMobile = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone/i.test(navigator.userAgent);

  // WhatsApp
  const normalizePhoneIL = (raw) => {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, "");
    if (!digits) return null;
    if (digits.startsWith("972")) return digits;
    if (digits.startsWith("0")) return "972" + digits.slice(1);
    return digits; 
  };
  
  const phoneDigits = useMemo(() => normalizePhoneIL(apartment?.phone_number), [apartment?.phone_number]);
  const telHref     = useMemo(() => (phoneDigits ? `tel:+${phoneDigits}` : null), [phoneDigits]);
  const waHref      = useMemo(() => (phoneDigits ? `https://wa.me/${phoneDigits}` : null), [phoneDigits]);

  const isRental = useMemo(() => {
    const c = (apartment?.category || "").toString().toLowerCase();
    return c.includes("שכיר") || c.includes("rent");
  }, [apartment?.category]);

  const load = useCallback(async () => {
    setLoading(true);
    const ap = await fetchApartmentById(id);
    setApartment(ap);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const normalized = useListingImages(apartment?.images);
  const imageUrls = normalized.map(i => i.src);

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

  const aptId = apartment?.id;
  const isFavorite = !!(aptId && favorites.includes(aptId));

  return (
    <Layout>
      <div className="bg-white min-h-screen">
        {/* חזור + מחיקת דירה */}
        <div className={`flex items-center max-w-5xl mx-auto px-6 mt-6 ${(isAdmin && editMode) ? "justify-between" : "justify-end"}`}>
          {isAdmin && editMode && (
            <button onClick={handleDeleteApartment} className="bg-red-600 text-white px-4 py-2 rounded-md shadow hover:bg-red-700">
              מחק דירה <FaTrashAlt className="inline ms-2" />
            </button>
          )}
          
          <button onClick={() => navigate(-1)} className="text-gray-700 hover:text-blue-600 text-base font-semibold transition">← חזור</button>
          
        </div>

        <div className="max-w-5xl mx-auto p-6">
          {/* Gallery */}
          {!editMode ? (
            <>
              <NewGalleryPreview
                images={imageUrls}
                onImageClick={(i) => { setCurrentIndex(i); setIsModalOpen(true); }}
              />
              <ImageModal 
              isOpen={isModalOpen}
              images={imageUrls}
              startIndex={currentIndex}
              onClose={() => setIsModalOpen(false)}
              onNext={handleNext}
              onPrev={handlePrev} />
            </>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(apartment.images || []).map((url) => (
                <div key={url} className="relative">
                  <img src={url} alt="apartment" className="w-full h-40 object-cover rounded-lg" />
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

          {/* Title + favorites */}
          <div className="flex items-center justify-between my-4">
            <h1 className="md:text-2xl font-bold leading-tight text-gray-900">{apartment.title || "דירה ללא שם"}</h1>
            <button
              type="button"
              onClick={handleFavClick}
              className="shrink-0 text-red-500 text-2xl bg-white/90 rounded-full p-2 shadow-sm hover:scale-110 transition"
              aria-label={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
              title={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
            >
              {isFavorite ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>

          {/* Details */}
          {!editMode ? (
            <div className="bg-gray-50 rounded-2xl shadow px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800 text-sm">
              <div><strong>תאריך העלאה:</strong> {apartment.upload_date ? formatDate(apartment.upload_date) : "לא צוין"}</div>
              <div><strong>מפרסם:</strong> {apartment.contactName || "לא צוין"}</div>
              
              <div><strong>קטגוריה:</strong> {apartment.category || "לא צוין"}</div>
              {isRental && (
                <div>
                  <strong>סוג השכרה:</strong>{" "}
                  {apartment.rental_scope
                    ? (apartment.rental_scope === "שותף" ? "דירת שותפים" : apartment.rental_scope)
                    : "לא צוין"}
                </div>
              )}

              <div><strong>כתובת:</strong> {apartment.address || "לא צוין"}</div>
              <div><strong>מחיר:</strong> {apartment.price ? formatPrice(apartment.price) : "לא צוין"}</div>

              <div><strong>שכונה:</strong> {apartment.neighborhood || "לא צוין"}</div>
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
              {/* Edit */}
              <InlineEditField     label="תאריך העלאה"   type="date" value={apartment.upload_date}         onSave={(v)=>saveField({upload_date:v})} />
              <InlineEditField     label="מפרסם"      value={apartment.contactName}                    onSave={(v)=>saveField({contactName:v})} />
              <InlineSelectField   label="קטגוריה"       value={apartment.category}                        onSave={(v)=>saveField({category:v})}
                                  options={[{value:"שכירות", label:"שכירות"},{value:"מכירה", label:"מכירה"}, {value:"סאבלט", label:"סאבלט"}]} />
              <InlineSelectField   label="סוג השכרה"     value={apartment.rental_scope}                    onSave={(v)=>saveField({rental_scope:v})}
                                   options={[{value:"דירה שלמה", label:"דירה שלמה"},{value:"שותף", label:"דירת שותפים"}]} />
              <InlineEditField     label="כתובת"         value={apartment.address}                         onSave={(v)=>saveField({address:v})} />
              <InlineEditField     label="מחיר"       type="number" value={apartment.price}             onSave={(v)=>saveField({price:v})} />

              <InlineSelectField   label="שכונה"         value={apartment.neighborhood}
                      options={NEIGHBORHOODS_HE.map(n => ({ value: n, label: n }))}
                      onSave={(v)=>saveField({ neighborhood: v || null })} />
              <InlineEditField     label="תאריך כניסה" type="date" value={apartment.available_from}      onSave={(v)=>saveField({available_from:v})} />
              <InlineSelectField   label="מספר חדרים"
                      value={apartment.rooms != null ? String(apartment.rooms) : ""}
                      options={[
                        {value:"1", label:"1"}, {value:"1.5", label:"1.5"},
                        {value:"2", label:"2"}, {value:"2.5", label:"2.5"},
                        {value:"3", label:"3"}, {value:"3.5", label:"3.5"},
                        {value:"4", label:"4"}, {value:"4.5", label:"4.5"},
                        {value:"5", label:"5"},
                      ]}
                      onSave={(v)=>saveField({ rooms: v ? parseFloat(v) : null })}
              />
              <InlineEditField     label="שטח"          type="number" value={apartment.size}             onSave={(v)=>saveField({size:v})} />
              <InlineEditField     label="קומה"          type="number" value={apartment.floor}            onSave={(v)=>saveField({floor:v})} />
              <InlineBoolField     label="מרפסת"         value={apartment.has_balcony}                     onSave={(v)=>saveField({has_balcony:v})} />
              <InlineBoolField     label="חיות מחמד"     value={apartment.pets_allowed}                    onSave={(v)=>saveField({pets_allowed:v})} />
              <InlineBoolField     label="מעלית"         value={apartment.has_elevator}                    onSave={(v)=>saveField({has_elevator:v})} />
              <InlineBoolField     label="ממ״ד"          value={apartment.has_safe_room}                   onSave={(v)=>saveField({has_safe_room:v})} />
              <InlineBoolField     label="חניה"          value={apartment.has_parking}                     onSave={(v)=>saveField({has_parking:v})} />
              <InlineBoolField     label="מתווך"         value={apartment.has_broker}                      onSave={(v)=>saveField({has_broker:v})} />
              <InlineEditField     label="כותרת"         value={apartment.title}                           onSave={(v)=>saveField({title:v})} />

      
            </div>
          )}

          {/* Contact */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2">
            {apartment.phone_number && (
              <div className="relative">
                {!showPhone ? (
                  <button onClick={() => setShowPhone(true)} className="h-9 min-w-[160px] px-3 rounded-md text-white text-xs font-medium bg-emerald-400 hover:bg-emerald-500/90 shadow-sm transition flex items-center justify-center gap-2">
                    <FaPhoneAlt />
                    <span>הצג מספר טלפון</span>
                  </button>
                ) : (
                  <>
                    {isMobile && telHref ? (
                      <a href={telHref} className="h-9 min-w-[160px] px-3 rounded-md text-white text-xs font-medium bg-emerald-400 hover:bg-emerald-500/90 shadow-sm transition inline-flex items-center justify-center gap-2">

                        <FaPhoneAlt />
                        {apartment.phone_number}
                      </a>
                    ) : (
                      <a href={telHref} className="h-9 min-w-[160px] px-3 rounded-md text-white text-xs font-medium bg-emerald-400 hover:bg-emerald-500/90 shadow-sm transition inline-flex items-center justify-center gap-2">
                        <FaPhoneAlt/>
                        {apartment.phone_number}
                      </a>
                    )}
                  </>
                )}
              </div>
            )}

            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="h-9 px-2 rounded-md bg-[#35d984] text-white text-xs font-medium hover:bg-emerald-500/90 shadow-sm inline-flex items-center justify-center gap-2">

                <FaWhatsapp className="text-base" />
                WhatsApp
              </a>
            )}

            {apartment.contactId && (
              <a href={`https://m.me/${apartment.contactId}`} target="_blank" rel="noopener noreferrer" className="h-9 px-2 rounded-md bg-[#42a5ff] text-white text-xs font-medium hover:bg-sky-500/90 shadow-sm inline-flex items-center justify-center gap-2">

                <FaFacebookMessenger className="text-base" />
                שלח/י הודעה ב-Messenger
              </a>
            )}
          </div>



          {/* Original post */}
          {!editMode ? (
            <p className="text-gray-600 mt-10 leading-relaxed whitespace-pre-line">
              {(apartment.description || "אין תיאור זמין").replace(/\\n/g, "\n")}
            </p>
          ) : (
            <EditableDescription
              value={(apartment.description || "").replace(/\\n/g, "\n")}
              onSave={(v)=>saveField({description:v})}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}

function EditableDescription({ value, onSave }) {
  const [text, setText] = useState(value || "");
  const [saving, setSaving] = useState(false);

  useEffect(()=>{ setText(value || ""); }, [value]);

  return (
    <div className="bg-gray-50 rounded-2xl shadow p-4">
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
