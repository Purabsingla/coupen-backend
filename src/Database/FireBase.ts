import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";

import fs from "fs";

let serviceAccount: admin.ServiceAccount;

// ✅ First, try to load from environment variable
if (process.env.FIREBASE_CONFIG) {
  console.log("🔑 Using FIREBASE_CONFIG from environment variable.");
  serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG as string);
} else {
  // ✅ Fallback: Check if `serviceAccount.json` exists
  const serviceAccountPath = path.resolve(__dirname, "../../serviceAccount.json");

  if (fs.existsSync(serviceAccountPath)) {
    console.log("📂 Using serviceAccount.json from file system.");
    serviceAccount = require(serviceAccountPath);
  } else {
    console.error("❌ No Firebase credentials found! Please set FIREBASE_CONFIG or provide serviceAccount.json.");
    process.exit(1); // Exit to prevent app from running without credentials
  }
}

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ✅ Get Firestore Database (from Admin SDK)
const db = getFirestore();

console.log("🔥 Firebase Connected!");

export { admin, db };
