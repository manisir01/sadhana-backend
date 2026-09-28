const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Home Route
app.get("/", (req, res) => {
  res.send("Sadhana OTP Server Running");
});

// Send OTP
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

// Verify OTP
app.post("/verify-otp", async (req, res) => {
  try {
    const { phone, code } = req.body;

    console.log("VERIFY PHONE:", phone);
    console.log("VERIFY CODE:", code);

    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phone,
        code: code,
      });

    res.json({
      success: verificationCheck.status === "approved",
      status: verificationCheck.status,
    });
  } catch (error) {
    console.log("VERIFY OTP ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("SID:", process.env.TWILIO_ACCOUNT_SID);
  console.log(
    "TOKEN:",
    process.env.TWILIO_AUTH_TOKEN ? "FOUND" : "MISSING"
  );
  console.log("VERIFY:", process.env.TWILIO_VERIFY_SERVICE_SID);
  console.log(`Server running on port ${PORT}`);
});