import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import logo from "../assets/EasyRentLogo.png";
import { RxExit } from "react-icons/rx";
import { FaHeart, FaSearch, FaBars, FaTimes, FaUser } from "react-icons/fa";
import { useAdmin } from "../contexts/AdminContext";
import useAuth from "../hooks/useAuth";

function Header() {
  const navigate = useNavigate();
  const { isAdmin, editMode, toggleEditMode } = useAdmin();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
  try {
    await signOut(auth);
    setOpen?.(false); 
    navigate("/home", { replace: true }); 
  } catch (error) {
    console.error("שגיאה בהתנתקות:", error);
  }
};


  const NavLinks = ({ asList = false, onClickItem, user }) => (
    <div className={asList ? "flex flex-col gap-4" : "flex items-center gap-8 text-gray-700 font-medium text-base"}>
      {isAdmin && (
        <button
          type="button"
          onClick={() => { toggleEditMode(); onClickItem?.(); }}
          title={editMode ? "סגור מצב עריכה" : "פתח מצב עריכה"}
          className={[
            "flex items-center gap-1 rounded-lg border px-3 py-1 transition",
            editMode
              ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
              : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50",
          ].join(" ")}
        >
          {editMode ? "סגור מצב עריכה" : "מצב עריכה"}
        </button>
      )}

      <Link to="/search" onClick={onClickItem} className="hover:text-gray-900 flex items-center gap-1">
        <FaSearch className="text-lg" />
        <span>חיפוש</span>
      </Link>

      <Link to="/favorites" onClick={onClickItem} className="hover:text-gray-900 flex items-center gap-1">
        <FaHeart className="text-lg" />
        <span>דירות שאהבתי</span>
      </Link>

      {user ? (
        <button onClick={() => { handleLogout(); onClickItem?.(); }} className="hover:text-gray-900 flex items-center gap-1">
          <RxExit className="text-lg" />
          <span>התנתק</span>
        </button>
      ) : (
        <Link to="/login" onClick={onClickItem} className="hover:text-gray-900 flex items-center gap-1">
          <FaUser className="text-lg" />
          <span>להתחברות/הרשמה</span>
        </Link>
      )}
    </div>
  );

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-50 bg-[#f7f7f7] border-b shadow-sm flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4"
    >
      {/* Logo */}
      <Link to="/home" className="flex items-center gap-2">
        <img src={logo} alt="EasyRent" className="h-12 sm:h-20" />
      </Link>

      <nav className="hidden md:block">
        <NavLinks user={user} />
      </nav>

      {/* Mobile */}
      <button
        aria-label={open ? "סגור תפריט" : "פתח תפריט"}
        className="md:hidden text-gray-700 p-2"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden absolute top-full inset-x-0 bg-[#f7f7f7] border-b shadow-sm px-4 py-4">
          <NavLinks asList onClickItem={() => setOpen(false)} user={user} />
        </div>
      )}
    </header>
  );
}

export default Header;
