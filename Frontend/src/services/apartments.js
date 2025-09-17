import { db } from "../firebase";
import { mapFeature, PAGE_SIZE } from "../utils/searchConfig";
import {collection, getDocs, getDoc, doc, updateDoc,
  arrayRemove, query, where, limit, startAfter, orderBy, Timestamp
} from "firebase/firestore";
import { deleteDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, deleteObject } from "firebase/storage";

export async function fetchAllApartments() {
  const snap = await getDocs(collection(db, "apartments"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 *
 * @param {Object} opts
 * @param {number} [opts.pageSize=24]
 * @param {import("firebase/firestore").QueryDocumentSnapshot|null} [opts.cursor=null]
 * @param {Object} [opts.filters={}] 
 * @param {string} [opts.orderByField="indexed_at"]
 * @param {"asc"|"desc"} [opts.orderDir="desc"]
 * @returns {Promise<{items: any[], cursor: any|null, hasMore: boolean}>}
 */
export async function fetchApartmentsPaged({
  pageSize = PAGE_SIZE,
  cursor = null,
  filters = {},
  orderByField = "indexed_at",
  orderDir = "desc",
} = {}) {
  let qBase = query(
    collection(db, "apartments"),
    orderBy(orderByField, orderDir),
    limit(pageSize)
  );

  const clauses = [];
  if (filters.minPrice != null && filters.minPrice !== "")
    clauses.push(where("price", ">=", Number(filters.minPrice)));
  if (filters.maxPrice != null && filters.maxPrice !== "")
    clauses.push(where("price", "<=", Number(filters.maxPrice)));

  if (clauses.length) {
    qBase = query(
      collection(db, "apartments"),
      orderBy(orderByField, orderDir),
      ...clauses,
      limit(pageSize)
    );
  }

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

export async function fetchApartmentById(id) {
  const ref = doc(db, "apartments", id);
  const d = await getDoc(ref);
  return d.exists() ? { id: d.id, ...d.data() } : null;
}


export async function deleteApartment(id) {
  await deleteDoc(doc(db, "apartments", id));
}

export async function updateApartment(id, data) {
  await updateDoc(doc(db, "apartments", id), data);
}

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

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0);
const endOfDay   = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999);

export async function fetchSearchApartments({
  filters = {},
  orderByField = "indexed_at",
  orderDir = "desc",
  pageSize = 60,
  cursor = null,
} = {}) {
  const base = collection(db, "apartments");
  const s = filters || {};
  const clauses = [];

  if (s.category) clauses.push(where("category", "==", s.category));

  const allowUnknown = !!s.featuresIncludeUnknown;

  if ((s.category === "שכירות" || s.category === "סאבלט") && s.apartmentMode && !allowUnknown) {
    clauses.push(where("rental_scope", "==", s.apartmentMode === "whole" ? "דירה שלמה" : "שותף"));
  }

  if (!allowUnknown) {
    if (s.brokerage === "with") clauses.push(where("has_broker", "==", true));
    if (s.brokerage === "without") clauses.push(where("has_broker", "==", false));
  }

  if (Array.isArray(s.features) && s.features.length && !allowUnknown) {
    for (const label of s.features) {
      const key = mapFeature(label);
      if (key) clauses.push(where(key, "==", true));
    }
  }

  const heList = Array.isArray(s.neighborhoodsHe) ? s.neighborhoodsHe.filter(Boolean) : [];
  const useInForNeighborhoods = heList.length > 0 && heList.length <= 10;
  if (useInForNeighborhoods) clauses.push(where("neighborhood", "in", heList));

  const hasDateRange = !!(s.entryDateFrom || s.entryDateTo);
  const rMin = s.roomsMin !== "" && s.roomsMin != null ? Number(s.roomsMin) : null;
  const rMax = s.roomsMax !== "" && s.roomsMax != null ? Number(s.roomsMax) : null;

  let rangeField = null;

  if (hasDateRange) {
    rangeField = "available_from";
    if (s.entryDateFrom) {
      clauses.push(where("available_from", ">=", Timestamp.fromDate(startOfDay(new Date(s.entryDateFrom)))));
    }
    if (s.entryDateTo) {
      clauses.push(where("available_from", "<=", Timestamp.fromDate(endOfDay(new Date(s.entryDateTo)))));
    }
  } else if (rMin != null || rMax != null) {
    rangeField = "rooms";
    if (rMin != null) clauses.push(where("rooms", ">=", rMin));
    if (rMax != null) clauses.push(where("rooms", "<=", rMax));
  } else if (s.priceMax) {
    rangeField = "price";
    clauses.push(where("price", "<=", Number(s.priceMax)));
  }

  let q = clauses.length ? query(base, ...clauses) : base;

  if (rangeField) {
    if (rangeField === orderByField) {
      q = query(q, orderBy(orderByField, orderDir));
    } else {
      q = query(q, orderBy(rangeField, "asc"), orderBy(orderByField, orderDir));
    }
  } else {
    q = query(q, orderBy(orderByField, orderDir));
  }

  if (cursor) q = query(q, startAfter(cursor));
  q = query(q, limit(pageSize));

  const snap = await getDocs(q);
  const docs = snap.docs;
  let rows = docs.map(d => ({ id: d.id, ...d.data() }));

  if (!useInForNeighborhoods && heList.length) {
    rows = rows.filter(a => heList.includes((a.neighborhood || "").trim()));
  }

  if (hasDateRange) {
    if (s.priceMax) rows = rows.filter(a => a.price != null && a.price <= Number(s.priceMax));
    if (rMin != null || rMax != null) {
      rows = rows.filter(a => {
        const r = a.rooms;
        if (r == null) return false;
        if (rMin != null && r < rMin) return false;
        if (rMax != null && r > rMax) return false;
        return true;
      });
    }
  }

  if (allowUnknown) {
    if ((s.category === "שכירות" || s.category === "סאבלט") && s.apartmentMode) {
      const needed = s.apartmentMode === "whole" ? "דירה שלמה" : "שותף";
      rows = rows.filter(a => {
        const scope = (a.rental_scope || "").trim();
        return !scope || scope === needed;
      });
    }
    if (s.brokerage) {
      rows = rows.filter(a => {
        const v = a.has_broker;
        return s.brokerage === "with" ? (v === true || v == null) : (v === false || v == null);
      });
    }
    if (Array.isArray(s.features) && s.features.length) {
      rows = rows.filter(a =>
        s.features.every(label => {
          const key = mapFeature(label);
          const v = key ? a[key] : undefined;
          return v === true || v == null;
        })
      );
    }
  }

  return {
    items: rows,
    cursor: docs.at(-1) || null,
    hasMore: docs.length === pageSize,
  };
}

export async function fetchSeedApartments({
  category = null,       
  pageSize = PAGE_SIZE,
  cursor = null,         
}) {
  const col = collection(db, "apartments");

  const constraints = [];
  if (category) constraints.push(where("category", "==", category));
  constraints.push(orderBy("indexed_at", "desc"));
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(pageSize));

  const q = query(col, ...constraints);
  const snap = await getDocs(q);

  const docs = snap.docs;
  const items = docs.map((d) => ({ id: d.id, ...d.data() }));

  const nextCursor = docs.length ? docs[docs.length - 1] : null;
  const hasMore = docs.length === pageSize;

  return { items, cursor: nextCursor, hasMore };
}



