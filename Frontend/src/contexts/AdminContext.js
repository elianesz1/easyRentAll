import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
      setEditMode(false);
      setRoleLoading(true);
      try {
        if (!user) {
          setIsAdmin(false);
          return;
        }
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};
        const adminFlag =
          data?.role === "admin";

        setIsAdmin(!!adminFlag);

      } catch (e) {
        console.error("admin check error:", e);
        setIsAdmin(false);
      } finally {
        setRoleLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const toggleEditMode = () => setEditMode((v) => !v);
  const canEdit = isAdmin && editMode;

  const value = useMemo(
    () => ({ isAdmin, roleLoading, editMode, toggleEditMode, canEdit }),
    [isAdmin, roleLoading, editMode]
  );

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error("useAdmin must be used within <AdminProvider>");
  return ctx;
}
