/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onCall, https} = require("firebase-functions/v2/https");
const XLSX = require("xlsx");
const fetch = require("node-fetch");
const {firestore, initializeApp} = require("firebase-admin");

exports.getWcJson = onCall(async (data, context) => {
  initializeApp();
  const url =
    "https://www.berlin.de/sen/uvk/_assets/verkehr/infrastruktur/oeffentliche-toiletten/berliner-toiletten-standorte.xlsx";

  try {
    const file = await (await fetch(url)).arrayBuffer();
    const workbook = XLSX.read(file);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
    const header = rawData[3];
    const data = rawData.slice(4);

    const json = data.map((row) => {
      const obj = {};
      header.forEach((key, i) => {
        if (
          key === "isHandicappedAccessible" ||
          key === "canBePayedWithCoins" ||
          key === "canBePayedInApp" ||
          key === "canBePayedWithNFC" ||
          key === "hasChangingTable" ||
          key === "hasUrinal"
        ) {
          obj[key] = row[i] || false;
        } else {
          obj[key] = row[i] || null;
        }
      });
      return obj;
    });

    await Promise.all(json.map((item) =>
      firestore().collection("toilettes")
          .doc(item["LavatoryID"]).set(item).then(() => {
            console.log("Document successfully written!");
          }),
    ));
    return {result: "json created"};
  } catch (error) {
    console.error("Error:", error);
    throw new https.HttpsError("Internal Server Error");
  }
});
