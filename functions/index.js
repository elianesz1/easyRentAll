const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.createUserDoc = functions.auth.user().onCreate(async (user) => {
  try {
    const userRef = db.collection("users").doc(user.uid);
    await userRef.set({
      email: user.email || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      role: "user",
      favorites: [],
    });
    console.log("✅ User document created for:", user.uid);
  } catch (err) {
    console.error("❌ Error creating user document:", err);
  }
});
