import { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";

const AdminCtx = createContext(null);

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setEditMode(false);            // בכל החלפת משתמש – לצאת ממצב עריכה
      if (!user) { setIsAdmin(false); setRoleLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        setIsAdmin(snap.exists() && snap.data()?.role === "admin");
      } finally {
        setRoleLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const toggleEditMode = () => setEditMode(v => !v);

  return (
    <AdminCtx.Provider value={{ isAdmin, roleLoading, editMode, toggleEditMode }}>
      {children}
    </AdminCtx.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminCtx);
}
