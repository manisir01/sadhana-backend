const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/*
========================================
FIREBASE ADMIN SDK
========================================
*/

// Local computer ke liye serviceAccountKey.json
// Render ke liye FIREBASE_SERVICE_ACCOUNT_JSON env variable
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  );
} else {
  serviceAccount = require("./serviceAccountKey.json");
}

initializeApp({
  credential: cert(serviceAccount),
});

/*
========================================
TWILIO
========================================
*/

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/*
========================================
HOME ROUTE
========================================
*/

app.get("/", (req, res) => {
  res.send("Sadhana OTP Server Running");
});

/*
========================================
SEND OTP
========================================
*/

app.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    console.log("PHONE:", phone);

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    res.json({
      success: true,
      status: verification.status,
    });
  } catch (error) {
    console.log("SEND OTP ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/*
========================================
VERIFY OTP + FIREBASE LOGIN TOKEN
========================================
*/

app.post("/verify-otp", async (req, res) => {
  try {
    const { phone, code } = req.body;

    console.log("VERIFY PHONE:", phone);

    /*
    IMPORTANT:
    OTP code ko console mein print nahi karna.
    */

    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phone,
        code: code,
      });

    if (verificationCheck.status !== "approved") {
      return res.json({
        success: false,
        status: verificationCheck.status,
      });
    }

    /*
    ========================================
    CREATE FIREBASE UID
    ========================================

    Example:
    +916281761178
           ↓
    6281761178

    Ye tumhare existing Firestore users document
    ID ke saath match karega.
    */

    const firebaseUid = phone
      .replace(/\D/g, "")
      .slice(-10);

    /*
    ========================================
    CREATE FIREBASE CUSTOM TOKEN
    ========================================
    */

    const firebaseToken =
      await getAuth().createCustomToken(firebaseUid);

    console.log(
      "Firebase token created for UID:",
      firebaseUid
    );

    /*
    ========================================
    SEND TOKEN TO FLUTTER
    ========================================
    */

    return res.json({
      success: true,
      status: "approved",
      firebaseToken: firebaseToken,
      uid: firebaseUid,
    });

  } catch (error) {
    console.log("VERIFY OTP ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/*
========================================
SERVER
========================================
*/

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Firebase Admin initialized");
  console.log("SID:", process.env.TWILIO_ACCOUNT_SID);
  console.log(
    "TOKEN:",
    process.env.TWILIO_AUTH_TOKEN ? "FOUND" : "MISSING"
  );
  console.log(
    "VERIFY:",
    process.env.TWILIO_VERIFY_SERVICE_SID
  );
  console.log(`Server running on port ${PORT}`);
});