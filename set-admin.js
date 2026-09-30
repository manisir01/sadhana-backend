const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const uid = "b9LwbluwHsOf2Jym46C6uKdEyzT2";

async function makeAdmin() {
  try {
    await getAuth().setCustomUserClaims(uid, {
      admin: true,
    });

    console.log("=================================");
    console.log("SUCCESS: Admin claim added!");
    console.log("UID:", uid);
    console.log("admin: true");
    console.log("=================================");

    process.exit(0);
  } catch (error) {
    console.error("ERROR:", error);
    process.exit(1);
  }
}

makeAdmin();