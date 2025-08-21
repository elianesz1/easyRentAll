import { db } from "../firebase";
import {
  collection, getDocs, getDoc, doc,
  updateDoc, arrayUnion, arrayRemove, query, where, limit, startAfter
} from "firebase/firestore";
import { deleteDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, deleteObject } from "firebase/storage";


export async function fetchAllApartments() {
  const snap = await getDocs(collection(db, "apartments"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchApartmentsPaged({ pageSize = 30, cursor = null, filters = {} } = {}) {
  let q = collection(db, "apartments");
  // דוגמה לפילטרים – הרחיבי לפי שדות אצלך
  const clauses = [];
  if (filters.minPrice) clauses.push(where("price", ">=", Number(filters.minPrice)));
  if (filters.maxPrice) clauses.push(where("price", "<=", Number(filters.maxPrice)));
  // אפשר גם neighborhood, rooms וכו'
  if (clauses.length) q = query(q, ...clauses);
  if (cursor) q = query(q, startAfter(cursor));
  q = query(q, limit(pageSize));

  const snap = await getDocs(q);
  return {
    items: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    cursor: snap.docs.at(-1) || null,
  };
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

// ממיר URL של Firebase Storage ל-path אובייקט ב-bucket
function storagePathFromUrl(url) {
  try {
    const u = new URL(url);
    // נתמקד בחלק שאחרי /o/
    const afterO = u.pathname.split("/o/")[1] || "";
    // מסירים שאילתא ומפענחים %2F
    const pathEnc = afterO.split("?")[0];
    return decodeURIComponent(pathEnc);
  } catch {
    return null;
  }
}

export async function removeApartmentImage(apartmentId, url) {
  // 1) הסרה מהמערך במסמך
  await updateDoc(doc(db, "apartments", apartmentId), { images: arrayRemove(url) });

  // 2) ניסיון מחיקה מה-Storage (לא חובה להצליח כדי שהדאטה יהיה עקבי)
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
