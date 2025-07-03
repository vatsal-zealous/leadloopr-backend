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

app.listen(3000, () => {
  console.log(`Server is running on http://localhost:${3000}`);
});
// Don't call app.listen() — for Vercel
module.exports = app;
