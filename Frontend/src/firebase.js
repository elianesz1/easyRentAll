import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAGdXN_g56lF5Dld4CLSvVVvHfoL-w86bY",
    authDomain: "easyrent-1325a.firebaseapp.com",
    projectId: "easyrent-1325a",
    storageBucket: "easyrent-1325a.firebasestorage.app",
    messagingSenderId: "366548738595",
    appId: "1:366548738595:web:6c73bf99dc4b85cfef0796"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
