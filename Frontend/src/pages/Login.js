import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import Logo from "../assets/EasyRentLogo.png";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      navigate("/home");
    } catch (err) {
      console.log("Login error:", err.code);

      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential" ||
        err.code === "auth/invalid-login-credentials"
      ) {
        setError("כתובת אימייל או סיסמה אינם נכונים");
      } else {
        setError("שגיאה כללית בעת ההתחברות. נסו שוב.");
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
        <h2 className="text-2xl font-bold mb-6 text-right">התחברות</h2>

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div>
            <label className="block text-right mb-1" htmlFor="email">אימייל</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              dir="ltr"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-right mb-1" htmlFor="password">סיסמה</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              dir="ltr"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
            {loading ? "מתחבר/ת…" : "התחברות"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          אין לך חשבון?{" "}
          <span
            className="text-blue-600 hover:underline cursor-pointer"
            onClick={() => navigate("/signup")}
          >
            להרשמה
          </span>
        </p>
      </div>
    </div>
  );
}
