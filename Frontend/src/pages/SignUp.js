import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import Logo from "../assets/EasyRentLogo.png";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const emailTrimmed = email.trim();
      await createUserWithEmailAndPassword(auth, emailTrimmed, password);
      navigate("/home");
    } catch (err) {
      console.log("SignUp error:", err.code);

      switch (err.code) {
        case "auth/email-already-in-use":
          setError("כתובת האימייל כבר רשומה, נסו להתחבר.");
          break;
        case "auth/invalid-email":
          setError("כתובת אימייל לא תקינה");
          break;
        case "auth/weak-password":
          setError("על הסיסמה להכיל לפחות 6 תווים");
          break;
        default:
          setError("אירעה שגיאה. נסו שוב.");
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-blue-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src={Logo} alt="Logo" className="w-28 mb-2" />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-right">הרשמה</h2>

        <form onSubmit={handleSignUp} className="space-y-4" noValidate>
          <div>
            <label className="block text-right mb-1" htmlFor="email">אימייל</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              inputMode="email"
            />
          </div>

          <div>
            <label className="block text-right mb-1" htmlFor="password">סיסמה</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
            />
            <p className="text-xs text-gray-500 mt-1">לפחות 6 תווים</p>
          </div>

          {error && (
            <p className="text-red-500 text-sm" aria-live="assertive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`bg-[#5171b7] text-white font-medium px-6 py-2 rounded-lg transition
              ${loading ? "opacity-60 cursor-not-allowed" : "hover:bg-[#357ae8]"}`}
          >
            {loading ? "נרשם…" : "הרשמה"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          כבר יש לך חשבון?{" "}
          <span
            className="text-blue-600 hover:underline cursor-pointer"
            onClick={() => navigate("/login")}
          >
            התחבר/י
          </span>
        </p>
      </div>
    </div>
  );
}
