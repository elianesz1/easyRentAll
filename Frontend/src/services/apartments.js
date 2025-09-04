// src/services/apartments.js
import { db } from "../firebase";
import { mapFeature } from "../utils/searchConfig";

import {
  collection, getDocs, getDoc, doc, updateDoc,
  arrayUnion, arrayRemove, query, where, limit, startAfter, orderBy
} from "firebase/firestore";
import { deleteDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, deleteObject } from "firebase/storage";

export async function fetchAllApartments() {
  const snap = await getDocs(collection(db, "apartments"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * פאג'ינציה גנרית עם מיון ברירת מחדל "חדש תחילה" (postedAt desc).
 * שימי לב: לכל מסמך חייב להיות השדה orderByField (למשל postedAt מסוג Timestamp).
 *
 * @param {Object} opts
 * @param {number} [opts.pageSize=24]
 * @param {import("firebase/firestore").QueryDocumentSnapshot|null} [opts.cursor=null]
 * @param {Object} [opts.filters={}] - תומך כרגע ב-minPrice/maxPrice (ניתן להרחיב)
 * @param {string} [opts.orderByField="indexed_at"]
 * @param {"asc"|"desc"} [opts.orderDir="desc"]
 * @returns {Promise<{items: any[], cursor: any|null, hasMore: boolean}>}
 */
export async function fetchApartmentsPaged({
  pageSize = 24,
  cursor = null,
  filters = {},
  orderByField = "indexed_at",
  orderDir = "desc",
} = {}) {
  // בסיס: collection + orderBy
  let qBase = query(
    collection(db, "apartments"),
    orderBy(orderByField, orderDir),
    limit(pageSize)
  );

  // פילטרים בסיסיים (ניתן להרחיב בהמשך)
  const clauses = [];
  if (filters.minPrice != null && filters.minPrice !== "")
    clauses.push(where("price", ">=", Number(filters.minPrice)));
  if (filters.maxPrice != null && filters.maxPrice !== "")
    clauses.push(where("price", "<=", Number(filters.maxPrice)));

  // אם יש פילטרים - חברי אותם לשאילתה
  if (clauses.length) {
    qBase = query(
      collection(db, "apartments"),
      orderBy(orderByField, orderDir),
      ...clauses,
      limit(pageSize)
    );
  }

  // פאג'ינציה לפי ה-cursor (מצופה להיות DocumentSnapshot מהעמוד הקודם)
  let q = qBase;
  if (cursor) {
    q = query(qBase, startAfter(cursor));
  }

  const snap = await getDocs(q);
  const docs = snap.docs;

  return {
    items: docs.map(d => ({ id: d.id, ...d.data() })),
    cursor: docs.at(-1) || null,
    hasMore: docs.length === pageSize,
  };
}

/**
 * עטיפה נוחה ל-"חדש תחילה" בלי להעביר פרמטרים.
 * זה מה שכדאי להשתמש בו בדף הבית.
 */
export async function fetchNewestApartmentsPaged(opts = {}) {
  return fetchApartmentsPaged({ ...opts, orderByField: "indexed_at", orderDir: "desc" });
}

export async function fetchApartmentById(id) {
  const ref = doc(db, "apartments", id);
  const d = await getDoc(ref);
  return d.exists() ? { id: d.id, ...d.data() } : null;
}

export async function fetchUserFavorites(userId) {
  const ref = doc(db, "users", userId);
  const d = await getDoc(ref);
  return d.exists() ? d.data().favorites || [] : [];
}

export async function toggleFavorite(userId, aptId, isFav) {
  const ref = doc(db, "users", userId);
  await updateDoc(ref, { favorites: isFav ? arrayRemove(aptId) : arrayUnion(aptId) });
}

export async function deleteApartment(id) {
  await deleteDoc(doc(db, "apartments", id));
}

export async function updateApartment(id, data) {
  await updateDoc(doc(db, "apartments", id), data);
}

/** מפענח נתיב קובץ מתוך קישור Storage ציבורי */
function storagePathFromUrl(url) {
  try {
    const u = new URL(url);
    const afterO = u.pathname.split("/o/")[1] || "";
    const pathEnc = afterO.split("?")[0];
    return decodeURIComponent(pathEnc);
  } catch {
    return null;
  }
}

/**
 * מסיר תמונה מדירת apartments וגם מוחק את האובייקט מ-Storage (אם אפשר).
 */
export async function removeApartmentImage(apartmentId, url) {
  await updateDoc(doc(db, "apartments", apartmentId), { images: arrayRemove(url) });

  const path = storagePathFromUrl(url);
  if (path) {
    try {
      const storage = getStorage();
      await deleteObject(storageRef(storage, path));
    } catch (e) {
      console.warn("Failed to delete storage object:", e);
    }
  }
}

export async function fetchSearchApartments({
  filters = {},
  sortField = "indexed_at",
  sortDir = "desc",
} = {}) {
  let base = collection(db, "apartments");
  const clauses = [];

  // ===== Equality =====
  if (filters.category) {
    clauses.push(where("category", "==", filters.category));
  }

  // apartmentMode רלוונטי רק לשכירות
  if (filters.category === "שכירות" && filters.apartmentMode) {
    const scope = filters.apartmentMode === "whole" ? "דירה שלמה" : "שותף";
    clauses.push(where("rental_scope", "==", scope));
  }

  // features: דורשים true בלבד (אם לא ביקשו לכלול לא-מצוין)
  if (Array.isArray(filters.features) && filters.features.length > 0 && !filters.featuresIncludeUnknown) {
    for (const key of filters.features.map(mapFeature).filter(Boolean)) {
      clauses.push(where(key, "==", true));
    }
  }

  // neighborhoods: רק אם עד 10 ערכים (מגבלת IN)
  if (Array.isArray(filters.neighborhoodsHe) &&
      filters.neighborhoodsHe.length > 0 &&
      filters.neighborhoodsHe.length <= 10) {
    clauses.push(where("neighborhood", "in", filters.neighborhoodsHe));
  }

  // ===== Range (שדה אחד בלבד) =====
  const rMin = filters.roomsMin !== "" && filters.roomsMin != null ? Number(filters.roomsMin) : null;
  const rMax = filters.roomsMax !== "" && filters.roomsMax != null ? Number(filters.roomsMax) : null;

  let rangeField = null;
  if (rMin != null || rMax != null) {
    rangeField = "rooms";
    if (rMin != null) clauses.push(where("rooms", ">=", rMin));
    if (rMax != null) clauses.push(where("rooms", "<=", rMax));
  } else if (filters.priceMax) {
    rangeField = "price";
    clauses.push(where("price", "<=", Number(filters.priceMax)));
  }
  // available_from נשאר לקליינט

  // ===== Build query =====
  let q = clauses.length ? query(base, ...clauses) : base;

  // אם יש שדה אי-שוויון חייבים להזמין קודם לפיו.
  // אם זה גם שדה המיון שנבחר – נזמין פעם אחת בלבד בכיוון הרצוי.
  if (rangeField) {
    if (rangeField === sortField) {
      q = query(q, orderBy(sortField, sortDir));
    } else {
      q = query(q, orderBy(rangeField, "asc"), orderBy(sortField, sortDir));
    }
  } else {
    q = query(q, orderBy(sortField, sortDir));
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }