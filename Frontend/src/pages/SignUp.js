import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import Logo from "../assets/EasyRentLogo.png";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Create a user with Firebase authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Storing basic user information in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date().toISOString(),
        favorites: []
      });

      // After registration - go to the home page
      navigate("/home"); 
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("כתובת האימייל כבר רשומה. נסה/י להתחבר");
      } else if (err.code === "auth/invalid-email") {
        setError("כתובת אימייל לא תקינה");
      } else if (err.code === "auth/weak-password") {
        setError("הסיסמה צריכה להכיל לפחות 6 תווים");
      } else {
        setError("אירעה שגיאה. נסה/י שוב");
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-blue-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
         <div className="flex flex-col items-center mb-6">
          <img src={Logo} alt="Logo" className="w-28 mb-2" />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-right">הרשמה</h2>
        <form onSubmit={handleSignUp} className="space-y-4">
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
            הרשמה
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
