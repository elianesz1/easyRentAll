import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function ensureUserDoc(uid) {
  const ref = doc(db, "users", uid);
  const d = await getDoc(ref);
  if (!d.exists()) await setDoc(ref, { favorites: [] });
}
