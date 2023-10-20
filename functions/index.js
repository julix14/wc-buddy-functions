/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

var XLSX = require("xlsx");
var fetch = require("node-fetch");

exports.getWcJson = onRequest(async (request, response) => {
  const url =
    "https://www.berlin.de/sen/uvk/_assets/verkehr/infrastruktur/oeffentliche-toiletten/berliner-toiletten-standorte.xlsx";

  const file = await (await fetch(url)).arrayBuffer();

  const workbook = XLSX.read(file);

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  const raw_data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const header = raw_data[3];
  const data = raw_data.slice(4);

  const json = data.map((row) => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = row[i];
    });
    return obj;
  });

  response.send(json);
});
