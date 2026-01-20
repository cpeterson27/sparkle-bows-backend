// backend/routes/upload.js
const express = require("express");
const multer = require("multer");
const cloudinary = require("../cloudinaryConfig");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  async (req, res) => {
    // DEBUG LOGS — add these temporarily
    console.log("---- UPLOAD DEBUG ----");
    console.log("Headers:", req.headers["content-type"]);
    console.log("Body keys:", Object.keys(req.body));
    console.log("File info:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded (Multer)" });
    }

    try {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "products" },
        (error, result) => {
          if (error) return res.status(500).json({ error: error.message });
          res.json({ url: result.secure_url });
        }
      );
      stream.end(req.file.buffer);
    } catch (err) {
      console.error("Upload failed:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

module.exports = router;

