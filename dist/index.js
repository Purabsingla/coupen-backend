"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const request_ip_1 = __importDefault(require("request-ip"));
const express_session_1 = __importDefault(require("express-session"));
const FireBase_1 = require("./Database/FireBase");
const App = (0, express_1.default)();
App.use((0, cors_1.default)());
App.use(express_1.default.json());
App.use(body_parser_1.default.json());
App.use((0, cookie_parser_1.default)());
App.use((0, express_session_1.default)({ secret: "secret", resave: false, saveUninitialized: true }));
App.use((req, res, next) => {
    req.clientIp = request_ip_1.default.getClientIp(req) || "unknown";
    next();
});
App.get("/api", (req, res) => {
    res.status(200).send({ message: "OK Working Well" });
});
App.post("/claim", async (req, res) => {
    try {
        const clientIp = req.clientIp;
        const claimedCookie = req.cookies.claimed;
        const claimsRef = FireBase_1.db.collection("claims");
        const recentClaims = await claimsRef
            .where("ip", "==", clientIp)
            .where("claimedAt", ">", new Date(Date.now() - 60 * 60 * 1000)) // 1 hour ago
            .get();
        if (!recentClaims.empty || claimedCookie) {
            return res
                .status(403)
                .json({ message: "You can claim another coupon after 1 hour." });
        }
        const couponsRef = FireBase_1.db.collection("coupons");
        const unassignedCoupon = await couponsRef
            .where("assigned", "==", false)
            .limit(1)
            .get();
        if (unassignedCoupon.empty) {
            return res.status(404).json({ message: "No more coupons available" });
        }
        // Get the first unassigned coupon
        const couponDoc = unassignedCoupon.docs[0];
        const couponId = couponDoc.id;
        const couponData = couponDoc.data();
        // Mark the coupon as assigned
        await couponsRef.doc(couponId).update({
            assigned: true,
            assignedTo: clientIp,
            assignedAt: FireBase_1.admin.firestore.FieldValue.serverTimestamp(),
        });
        // Record claim in "claims" collection
        await claimsRef.add({
            ip: clientIp,
            claimedAt: FireBase_1.admin.firestore.FieldValue.serverTimestamp(),
        });
        // Set cookie to prevent multiple claims in the same session
        res.cookie("claimed", "yes", { maxAge: 60 * 60 * 1000, httpOnly: true });
        res.json({ success: true, coupon: couponData.code });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
const port = 5050;
App.listen(port, () => console.log(`Server running on port ${port}`));
