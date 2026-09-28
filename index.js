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

app.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    const verification =
      await client.verify.v2
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
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    const { phone, code } = req.body;

    const verificationCheck =
      await client.verify.v2
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
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});