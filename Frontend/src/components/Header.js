import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import logo from "../assets/EasyRentLogo.png";
import { RxExit } from "react-icons/rx";
import { FaHeart, FaSearch } from "react-icons/fa";

function Header() {
  const navigate = useNavigate();

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
  <Link to="/home" className="flex items-center gap-2">
    <img src={logo} alt="EasyRent" className="h-20" />
  </Link>

      {/* navigate */}
      <nav className="flex items-center gap-8 text-gray-700 font-medium text-base">
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
