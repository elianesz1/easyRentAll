import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import logo from "../assets/EasyRentLogo.png";
import { RxExit } from "react-icons/rx";
import { FaHeart, FaSearch } from "react-icons/fa";
import { useAdmin } from "../contexts/AdminContext";

function Header() {
  const navigate = useNavigate();
  const { isAdmin, editMode, toggleEditMode } = useAdmin();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("שגיאה בהתנתקות:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#f7f7f7] border-b shadow-sm flex items-center justify-between px-8 py-4">
      {/* logo */}
      <Link to="/home" className="flex items-center gap-2">
        <img src={logo} alt="EasyRent" className="h-20" />
      </Link>

      {/* nav */}
      <nav className="flex items-center gap-8 text-gray-700 font-medium text-base">
        {/* כפתור מצב עריכה – מוצג רק לאדמין */}
        {isAdmin && (
          <button
            type="button"
            onClick={toggleEditMode}
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
        
        <Link to="/search" className="hover:text-gray-900 flex items-center gap-1">
          <FaSearch className="text-lg" />
          <span>חיפוש</span>
        </Link>

        <Link to="/favorites" className="hover:text-gray-900 flex items-center gap-1">
          <FaHeart className="text-lg" />
          <span>דירות שאהבתי</span>
        </Link>

        <button
          onClick={handleLogout}
          className="hover:text-gray-900 flex items-center gap-1"
        >
          <RxExit className="text-lg" />
          <span>התנתק</span>
        </button>
      </nav>
    </header>
  );
}

export default Header;
