import express, { Request, Response, Application, NextFunction } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import requestIp from "request-ip";
import session from "express-session";
import { db, admin } from "./Database/FireBase";

const App: Application = express();

App.use(cors({
  origin: "http://localhost:5173", // Allow all domain
  credentials: true,  // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
}));
App.use(express.json());
App.use(bodyParser.json());
App.use(cookieParser());
App.use(session({ secret: "secret", resave: false, saveUninitialized: true }));

App.use((req: Request, res: Response, next: NextFunction) => {
  req.clientIp = requestIp.getClientIp(req) || "unknown";
  next();
});

App.get("/api", (req: Request, res: Response) => {
  res.status(200).send({ message: "OK Working Well" });
});

App.post("/claim", async (req: Request, res: Response): Promise<any> => {
  try {
    const clientIp = req.clientIp;
    const claimedCookie = req.cookies.claimed;
    const claimsRef = db.collection("claims");
    const recentClaims = await claimsRef
      .where("ip", "==", clientIp)
      .where("claimedAt", ">", new Date(Date.now() - 60 * 60 * 1000)) // 1 hour ago
      .orderBy("claimedAt", "desc") // Get the most recent claim first
      .limit(1)
      .get();


    if (!recentClaims.empty || claimedCookie) {
      const lastClaim = recentClaims.docs[0]?.data(); // Get last claim data

  if (lastClaim) {
        const lastClaimTime: Date = lastClaim.claimedAt.toDate(); // Convert Firestore Timestamp to Date
        const cooldownEndTime: Date = new Date(lastClaimTime.getTime() + 60 * 60 * 1000);
        const timeLeft: number = Math.ceil((cooldownEndTime - Date.now()) / 60000); // Convert ms to minutes

        return res.status(403).json({
          message: `You can claim another coupon after ${timeLeft} minutes.`,
        });
      }

        return res.status(403).json({
          message: "You can claim another coupon after 1 hour.",
        });
    }

    const couponsRef = db.collection("coupons");
    const unassignedCoupon = await couponsRef
      .where("Assigned", "==", false)
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
      Assigned: true,
      AssignedTo: clientIp,
      AssignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Record claim in "claims" collection
    await claimsRef.add({
      ip: clientIp,
      claimedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Set cookie to prevent multiple claims in the same session
    res.cookie("claimed", "yes", { maxAge: 60 * 60 * 1000, httpOnly: true });

    res.json({ success: true, coupon: couponData.Code });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const port = 5050;
App.listen(port, () => console.log(`Server running on port ${port}`));
