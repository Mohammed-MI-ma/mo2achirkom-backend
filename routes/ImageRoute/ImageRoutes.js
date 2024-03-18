//___DEPENDENCIES
const express = require("express");

const fs = require("fs");
const archiver = require("archiver");
const os = require("os");
const path = require("path");

const { ROLE } = require("../../config/roles");
const multer = require("multer");
const excelToJson = require("convert-excel-to-json");
const { userAuth, checkRole } = require("../../Controllers/auth");
const router = express.Router();

// Set up multer storage for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const imageController = require("../../Controllers/imageController");

const validateAccessToken = require("../../middlewares/validateAccessToken");

const isAdmin = require("../../middlewares/isValidAdmin");

const User = require("../../models/User");

// Create a new Image (only accessible by users with a specific role)
router.post("/", userAuth, checkRole([ROLE.user]), imageController.createImage);

// Find a new Image (only accessible by users with a specific role)
router.get(
  "/image/:image",
  [validateAccessToken],
  imageController.getImageByName
);

// Update an Image (only accessible by users with a specific role)
router.put(
  "/:id",
  userAuth,
  checkRole([ROLE.user]),
  imageController.updateImage
);

// Delete an (only accessible by users with a specific role)
router.delete(
  "/:id",
  userAuth,
  checkRole([ROLE.user]),
  imageController.deleteImage
);

// Find a new Benificaire (only accessible by users with a specific role)
router.post(
  "/fetch-images/:entry",
  [validateAccessToken],
  imageController.getBenificairesByEntry
);

// Route for uploading and converting Excel to JSON
router.post(
  "/excel2Json",
  upload.single("excelFile"),
  validateExcelFile,
  (req, res) => {
    try {
      // Convert Excel buffer to JSON
      const excelData = excelToJson({
        source: req.file.buffer, // Excel file buffer
      });

      // Assuming the first sheet contains the data you want
      const jsonData = excelData[Object.keys(excelData)[0]];

      // Create a map to store CINs and corresponding objects
      const cinMap = new Map();

      // Filter out rows with duplicate CINs and add them to the cinMap
      const filteredData = jsonData.filter((obj) => {
        const cin = obj["G"]; // Assuming "G" is the key for the CIN field

        if (cinMap.has(cin)) {
          // CIN already exists, add to the duplicate list
          cinMap.get(cin).push(obj);
          return false; // Exclude this row from the filtered data
        } else {
          // CIN is encountered for the first time, create a new entry in the map
          cinMap.set(cin, [obj]);
          return true; // Include this row in the filtered data
        }
      });
      const filteredCINs = [];

      cinMap.forEach((value, key) => {
        if (value.length >= 2) {
          filteredCINs.push({ cin: key, duplicates: value });
        }
      });
      const duplicateCINs = new Set(
        Array.from(filteredCINs).map((item) => item.cin)
      );
      // Assuming 'G' is the key for the CIN field

      // Filter the 'data' array to remove rows with CINs that are in 'duplicateCINs'
      const filteredData2 = filteredData.filter((item) => {
        const cin = item.G; // Assuming 'G' is the key for the CIN field in 'data'
        return !duplicateCINs.has(cin);
      });
      const totalRows = jsonData.length - 1;
      const totalDuplicates = filteredCINs.length;
      const percentage = (totalDuplicates / totalRows) * 100;
      // Create a map to store CINs and their corresponding random colors
      const cinColorMap = new Map();

      filteredCINs.forEach((item) => {
        const cin = item.cin;
        if (!cinColorMap.has(cin)) {
          // Generate and assign a random color for each unique CIN
          cinColorMap.set(cin, getRandomColorWithOpacity(0.1));
        }
      });

      const duplicateCINss = Array.from(filteredCINs).map((item) => {
        const cin = item.cin; // Assuming 'cin' is the key for the CIN in 'duplicateCINs'
        const color = cinColorMap.get(cin); // Get the color from the map
        return { cin, duplicates: item.duplicates, color }; // Include the color in the object
      });
      // Respond with the filtered data and the duplicateCINs array
      return res.status(200).json({
        data: filteredData2,
        duplicateCINs: Array.from(duplicateCINss),
        percentage: percentage.toFixed(2), // You can format it as needed
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Route for finding duplicates in Bien immobilier
router.post("/findDuplicates", (req, res) => {
  try {
    // Extract beneficiairesArray from the request body
    const { beneficiairesArray } = req.body;

    // Create a map to group records by the combination of Projet, Etage, Immeuble, Appt, and GH
    const duplicatesMap = new Map();

    // Iterate through beneficiairesArray
    beneficiairesArray.forEach((record) => {
      const { Projet, Etage, Immeuble, Appt, GH } = record;
      const key = `${Projet}-${Immeuble}-${Etage}-${Appt}-${GH}`;

      if (!duplicatesMap.has(key)) {
        // If the key doesn't exist in the map, create an array with the current record
        duplicatesMap.set(key, [record]);
      } else {
        // If the key already exists, push the current record to the existing array
        duplicatesMap.get(key).push(record);
      }
    });

    // Initialize arrays to store cleaned data and duplicates
    const cleanedData = [];
    const duplicateCombinations = [];

    // Iterate through the map to separate cleaned data from duplicates
    duplicatesMap.forEach((records, key) => {
      if (records.length === 1) {
        // If there's only one record for a key, it's cleaned data
        cleanedData.push(records[0]);
      } else {
        // If there are multiple records for a key, it's a duplicate group
        duplicateCombinations.push({
          combination: key,
          duplicates: records,
          color: getRandomColorWithOpacity(0.1), // Generate a random color
        });
      }
    });

    // Calculate the percentage of duplicates
    const totalRows = beneficiairesArray.length;
    const totalDuplicateCombinations = duplicateCombinations.length;
    const percentage = (totalDuplicateCombinations / totalRows) * 100;

    // Respond with the cleaned data, duplicateCombinations, and percentage
    return res.status(200).json({
      data: cleanedData,
      duplicateCombinations: duplicateCombinations,
      percentage: percentage.toFixed(2), // You can format it as needed
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/split-excel",
  upload.single("excelFile"),

  /*validateAccessToken,
  isAdmin,*/
  async (req, res) => {
    try {
      const excelBuffer = req.file.buffer;
      console.log(excelBuffer);
      // Load the Excel file
      const workbook = XLSX.read(req.file.buffer);

      // Get the sheet names
      const sheetNames = workbook.SheetNames;

      // Initialize an array to store the smaller Excel files
      const smallerExcelFiles = [];

      // Process each sheet
      for (const sheetName of sheetNames) {
        // Get the sheet data
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Split the data based on the combination of "PACHALIK" and "ANNEXE"
        const splitData = {};

        jsonData.forEach((row) => {
          const pachalik = row["Pachalik"];
          const annexe = row["ANNEXE"];
          const key = `${pachalik} ${annexe}`;

          if (!splitData[key]) {
            splitData[key] = [];
          }

          splitData[key].push(row);
        });

        // Create a new Excel file for each combination
        for (const key in splitData) {
          if (splitData.hasOwnProperty(key)) {
            const newWorkbook = XLSX.utils.book_new();

            // Convert splitData[key] into an array of objects
            const dataArray = splitData[key];

            // Create a new worksheet from the array
            const newWorksheet = XLSX.utils.json_to_sheet(dataArray, {
              header: Object.keys(dataArray[0]),
            });
            XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, key);

            // Convert the new workbook to a buffer
            const buffer = XLSX.write(newWorkbook, {
              bookType: "xlsx",
              type: "buffer",
            });
            // Gzip the buffer
            const gzippedBuffer = zlib.gzipSync(buffer);

            // Push the smaller Excel file into the array
            smallerExcelFiles.push({
              sheetName: key,
              gzippedBuffer,
            });
          }
        }
      }

      // Respond with the smaller Excel files
      return res.status(200).json({
        message: "Excel file successfully split into smaller files.",
        smallerExcelFiles,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
router.post(
  "/cast-excelFile/:recipientAnnexe",
  upload.single("excelFile"),
  validateAccessToken,
  isAdmin,
  async (req, res) => {
    try {
      // Extract the recipient annexe from request parameters
      const { recipientAnnexe } = req.params;
      console.log(recipientAnnexe);
      // Extract the Excel buffer and filename from the request
      console.log(req.user);

      const excelBuffer = req.file.buffer;

      // Find users that belong to the specified annexe
      const annexUsers = await User.find({ annexe: recipientAnnexe });

      // Check if any users belong to the specified annexe
      if (!annexUsers || annexUsers.length === 0) {
        return res
          .status(404)
          .json({ message: "No users found for the specified annexe" });
      }

      // Parse the Excel file
      const workbook = XLSX.read(excelBuffer);
      console.log("workbook", workbook);

      const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Assuming one sheet
      // Convert the sheet to an array of objects
      const sheetArray = XLSX.utils.sheet_to_json(sheet);

      // Split the array into chunks
      const numChunks = annexUsers.length;
      const chunkSize = Math.ceil(sheetArray.length / numChunks);

      for (let i = 0; i < numChunks; i++) {
        const startIdx = i * chunkSize;
        const endIdx = Math.min((i + 1) * chunkSize, sheetArray.length);
        const chunkData = sheetArray.slice(startIdx, endIdx);

        // Create a new Excel workbook for each user
        const userWorkbook = XLSX.utils.book_new();
        const userSheet = XLSX.utils.json_to_sheet(chunkData);
        XLSX.utils.book_append_sheet(userWorkbook, userSheet, "Sheet1");

        // Generate a buffer from the workbook
        const userExcelBuffer = XLSX.write(userWorkbook, { type: "buffer" });

        // Check if the user has a socketId for sending notifications
        if (annexUsers[i].socketId) {
          io.to(annexUsers[i].socketId).emit("notification", {
            buffer: userExcelBuffer,
          });
        }

        // Create and save a notification for each user
        const notification = new Notification({
          sender: req.user._id, // Assuming you have the sender's user ID available
          recipientRole: annexUsers[i].role, // Replace with the recipient's role
          message: `Excel file sent to user ${annexUsers[i].name}`,
          buffer: userExcelBuffer,
        });

        await notification.save();
      }

      res.status(200).json({
        message: "Excel file chunks sent successfully",
        success: true,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Internal server error", success: false });
    }
  }
);

module.exports = router;
