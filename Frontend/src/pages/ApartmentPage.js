import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { fetchApartmentById, removeApartmentImage, updateApartment, deleteApartment } from "../services/apartments";
import useAuth from "../hooks/useAuth";
import useFavorites from "../hooks/useFavorites";
import useListingImages from "../hooks/useListingImages";
import { useAdmin } from "../contexts/AdminContext";
import { toast } from "react-hot-toast";

import TopBar from "../components/apartment/TopBar";
import Gallery from "../components/apartment/Gallery";
import TitleFavorite from "../components/apartment/TitleFavorite";
import DetailsView from "../components/apartment/DetailsView";
import EditForm from "../components/apartment/EditForm";
import ContactBar from "../components/apartment/ContactBar";

export default function ApartmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, onToggleFavorite } = useFavorites(user);
  const { isAdmin, editMode } = useAdmin();

  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);

  // helpers 
  const tsToInput = (ts) => (ts ? ts.toDate().toISOString().slice(0, 10) : "");
  const inputToTs = (s) => (s ? Timestamp.fromDate(new Date(s)) : null);
  const numOrNull = (s) => (s === "" || s == null ? null : Number(s));
  const strOrNull = (s) => (s?.trim() ? s : null);
  const boolToTri = (v) => (v === true ? "yes" : v === false ? "no" : "");
  const triToBool = (v) => (v === "yes" ? true : v === "no" ? false : null);

  const BOOL_FIELDS = [
    ["מרפסת", "has_balcony"],
    ["חיות מחמד", "pets_allowed"],
    ["מעלית", "has_elevator"],
    ["ממ״ד", "has_safe_room"],
    ["חניה", "has_parking"],
    ["מתווך", "has_broker"],
  ];

  const load = useCallback(async () => {
    setLoading(true);
    const ap = await fetchApartmentById(id);
    setApartment(ap);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // phone / WhatsApp 
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone/i.test(navigator.userAgent);

  const normalizePhoneIL = (raw) => {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, "");
    if (!digits) return null;
    if (digits.startsWith("972")) return digits;
    if (digits.startsWith("0")) return "972" + digits.slice(1);
    return digits;
  };

  const phoneDigits = useMemo(() => normalizePhoneIL(apartment?.phone_number), [apartment?.phone_number]);
  const telHref = useMemo(() => (phoneDigits ? `tel:+${phoneDigits}` : null), [phoneDigits]);
  const waHref = useMemo(() => (phoneDigits ? `https://wa.me/${phoneDigits}` : null), [phoneDigits]);

  const isForSell = useMemo(() => {
    const c = (apartment?.category || "").toString().toLowerCase();
    return c.includes("מכירה");
  }, [apartment?.category]);

  // images 
  const normalized = useListingImages(apartment?.images);
  const imageUrls = normalized.map((i) => i.src);

  // DRAFT 
  const makeDraftFromApt = (apt = {}) => ({
    title: apt.title ?? "",
    available_from: tsToInput(apt.available_from),
    upload_date: apt.upload_date ?? "",

    contactName: apt.contactName ?? "",
    category: apt.category ?? "",
    rental_scope: apt.rental_scope ?? "",
    address: apt.address ?? "",
    price: apt.price != null ? String(apt.price) : "",
    neighborhood: apt.neighborhood ?? "",
    rooms: apt.rooms != null ? String(apt.rooms) : "",
    size: apt.size != null ? String(apt.size) : "",
    floor: apt.floor != null ? String(apt.floor) : "",
    description: (apt.description || "").replace(/\\n/g, "\n"),
    has_balcony: boolToTri(apt.has_balcony),
    pets_allowed: boolToTri(apt.pets_allowed),
    has_elevator: boolToTri(apt.has_elevator),
    has_safe_room: boolToTri(apt.has_safe_room),
    has_parking: boolToTri(apt.has_parking),
    has_broker: boolToTri(apt.has_broker),
  });

  const baseline = useMemo(() => makeDraftFromApt(apartment || {}), [apartment]);
  const [draft, setDraft] = useState(baseline);
  useEffect(() => {
    setDraft(baseline);
  }, [baseline]);

  const isDirty = useMemo(() => {
    return Object.keys(baseline).some(
      (k) => String(draft[k] ?? "") !== String(baseline[k] ?? "")
    );
  }, [draft, baseline]);

  if (loading) {
    return (
      <Layout>
        <div className="py-16 text-center text-gray-500">טוען מידע על הדירה…</div>
      </Layout>
    );
  }
  const aptId = apartment?.id;
  const isFavorite = !!(aptId && favorites.includes(aptId));

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

  const handleSaveAll = async () => {
    const payload = {
      title: strOrNull(draft.title),
      available_from: inputToTs(draft.available_from),
      upload_date: strOrNull(draft.upload_date),
      contactName: strOrNull(draft.contactName),
      category: strOrNull(draft.category),
      rental_scope: strOrNull(draft.rental_scope),
      address: strOrNull(draft.address),
      price: numOrNull(draft.price),
      neighborhood: strOrNull(draft.neighborhood),
      rooms: draft.rooms === "" ? null : parseFloat(draft.rooms),
      size: numOrNull(draft.size),
      floor: numOrNull(draft.floor),
      description: strOrNull(draft.description),
      has_balcony: triToBool(draft.has_balcony),
      pets_allowed: triToBool(draft.pets_allowed),
      has_elevator: triToBool(draft.has_elevator),
      has_safe_room: triToBool(draft.has_safe_room),
      has_parking: triToBool(draft.has_parking),
      has_broker: triToBool(draft.has_broker),
    };

    await updateApartment(id, payload);
    setApartment((prev) => ({ ...prev, ...payload }));
    toast.success("נשמר בהצלחה");
  };

  return (
    <Layout>
      <div className="bg-white min-h-screen">
        <TopBar
          isAdmin={isAdmin}
          editMode={editMode}
          onDelete={handleDeleteApartment}
          onBack={() => navigate(-1)}
        />

        <div className="max-w-5xl mx-auto p-6">
          {/* Gallery */}
          <Gallery
            editMode={editMode}
            images={apartment.images || []}
            imageUrls={imageUrls}
            onRemoveImage={handleRemoveImage}
          />

          {/* Title + favorites */}
          <TitleFavorite
            title={apartment.title}
            isFavorite={isFavorite}
            onFavClick={handleFavClick}
          />

          {/* Details / Edit */}
          {!editMode ? (
            <DetailsView apartment={apartment} isForSell={isForSell} />
          ) : (
            <EditForm
              draft={draft}
              setDraft={setDraft}
              BOOL_FIELDS={BOOL_FIELDS}
              isDirty={isDirty}
              onSave={handleSaveAll}
            />
          )}

          {/* Contact */}
          <ContactBar
            phoneNumber={apartment.phone_number}
            isMobile={isMobile}
            telHref={telHref}
            waHref={waHref}
            contactId={apartment.contactId}
          />
        </div>
      </div>
    </Layout>
  );
}
