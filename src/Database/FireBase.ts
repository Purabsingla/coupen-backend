import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";

// ✅ Load Firebase Service Account Key
const serviceAccountPath = path.resolve(__dirname, "../../serviceAccount.json");
const serviceAccount = require(serviceAccountPath);

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ✅ Get Firestore Database (from Admin SDK)
const db = getFirestore();

console.log("🔥 Firebase Connected!");

export { admin, db };
