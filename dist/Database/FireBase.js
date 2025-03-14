"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.admin = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
exports.admin = firebase_admin_1.default;
const firestore_1 = require("firebase-admin/firestore");
const path_1 = __importDefault(require("path"));
// ✅ Load Firebase Service Account Key
const serviceAccountPath = path_1.default.resolve(__dirname, "../../serviceAccount.json");
const serviceAccount = require(serviceAccountPath);
// ✅ Initialize Firebase Admin SDK
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
});
// ✅ Get Firestore Database (from Admin SDK)
const db = (0, firestore_1.getFirestore)();
exports.db = db;
console.log("🔥 Firebase Connected!");
