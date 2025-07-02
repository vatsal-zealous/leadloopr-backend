const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();

const allowedOrigins = [
  "http://localhost:9002",
  "http://192.168.1.95:9002",
  "https://yourdomain.com",
];

// Simple CORS setup for now
app.use(cors());
app.use(express.json());

app.post("/api/user-data", (req, res) => {
  console.log("Data received:", req.body);
  res.status(200).json({ message: "Data received!" });
});

app.post("/api/form-data", (req, res) => {
  console.log("Form Data", req.body);
  try {
    const jsonData = req.body;
    const filePath = path.join(__dirname, "..", "form-data.json");

    if (jsonData.form_data) {
      const newEntry = {
        ...jsonData.form_data,
        org_id: jsonData.org_id,
        timestamp: new Date().toISOString(),
      };

      let existingData = [];

      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf8");
        if (fileData) {
          existingData = JSON.parse(fileData);
        }
      }

      existingData.push(newEntry);
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

      res.status(200).json({ message: "Data appended successfully!" });
    } else {
      res.status(200).json({ message: "No data found!" });
    }
  } catch (error) {
    console.error("Error writing data:", error);
    res.status(500).json({ error: "Failed to write data." });
  }
});

app.get("/api/form-data", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "..", "form-data.json");

    if (!fs.existsSync(filePath)) {
      return res.status(200).json({ formData: [], message: "No data found!" });
    }

    const data = fs.readFileSync(filePath, "utf8");
    const jsonData = JSON.parse(data);
    const sortedData = jsonData.reverse();

    res
      .status(200)
      .json({ formData: sortedData, message: "Data fetched successfully!" });
  } catch (error) {
    console.error("Error reading data:", error);
    res.status(500).json({ error: "Failed to read data." });
  }
});

// ✅ Do NOT start the server manually
module.exports = app;
