const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_API_URL,
  process.env.SUPABASE_ANON_KEY
);

app.post("/api/user-data", (req, res) => {
  console.log("Data received:", req.body);
  res.status(200).json({ message: "Data received!" });
});

app.post("/api/form-data", async (req, res) => {
  const { form_data, org_id, attribution } = req.body;

  if (!form_data || !org_id) {
    return res.status(400).json({ message: "Missing form_data or org_id" });
  }

  const gclid = attribution?.gclid || null;

  const newEntry = {
    org_id,
    form_data, // will be stored as JSONB
    timestamp: new Date().toISOString(),
    gclid,
  };

  try {
    const { error } = await supabase.from("form_entries").insert([newEntry]);

    if (error) {
      console.error("Insert error:", error);
      return res.status(500).json({ error: "Failed to insert data" });
    }

    res.status(200).json({ message: "Form submitted successfully" });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
});

app.get("/api/form-data", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("form_entries")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch form data" });
    }

    res.status(200).json({
      message: "Form data fetched",
      formData: data,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
});

app.get("/api/lead-conversions", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("form_entries")
      .select("gclid, timestamp, org_id")
      .not("gclid", "is", null)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch conversion data" });
    }

    const conversions = data.map((entry) => ({
      gclid: entry.gclid,
      conversion_time: new Date(entry.timestamp).toISOString(),
      conversion_name: entry.org_id,
    }));

    res.status(200).json({
      message: "Google conversion data fetched",
      conversions,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
});

app.get("/api/lead-conversions.csv", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("form_entries")
      .select("gclid, timestamp, org_id")
      .not("gclid", "is", null)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return res.status(500).send("Failed to fetch conversion data");
    }

    const header =
      "Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency";

    const rows = data.map((entry) => {
      const date = new Date(entry.timestamp);

      const istDate = new Date(
        date.toLocaleString("en-US", { timeZone: "Europe/Amsterdam" })
      );

      const pad = (n) => String(n).padStart(2, "0");
      const formattedTime = `${istDate.getFullYear()}-${pad(
        istDate.getMonth() + 1
      )}-${pad(istDate.getDate())} ${pad(istDate.getHours())}:${pad(
        istDate.getMinutes()
      )}:${pad(istDate.getSeconds())}+0530`;

      return `${entry.gclid},${entry.org_id},${formattedTime},1,USD`;
    });

    const csvContent = [header, ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=conversions.csv"
    );
    res.status(200).send(csvContent);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).send("Unexpected server error");
  }
});

// Don't call app.listen() — for Vercel
module.exports = app;
