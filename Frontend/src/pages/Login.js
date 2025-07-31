import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import Logo from "../assets/EasyRentLogo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("התחברות הצליחה:", user);
      navigate("/home"); 
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("המשתמש לא קיים במערכת");
      } else if (err.code === "auth/wrong-password") {
        setError("סיסמה שגויה");
      } else if (err.code === "auth/invalid-email") {
        setError("כתובת אימייל לא תקינה");
      } else {
        setError("שגיאה כללית בעת ההתחברות. נסה/י שוב.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-blue-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <div className="flex flex-col items-center mb-6">
          <img src={Logo} alt="Logo" className="w-28 mb-2" />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-right">התחברות</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-right mb-1">אימייל</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-right mb-1">סיסמה</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-[#5171b7] text-white font-medium px-6 py-2 rounded-lg hover:bg-[#357ae8] transition"
          >
            התחברות
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
