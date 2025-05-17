const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const axios = require("axios"); // Make sure axios is installed
const { protect } = require("../middleware/authMiddleware");
const Note = require("../models/noteModel");
const mongoose = require("mongoose");
const { createClient } = require("@supabase/supabase-js");
const { uuid } = require("uuidv4");

// HuggingFace Inference API configuration
const API_URL =
  "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";
const API_KEY = process.env.HUGGINGFACE_API_KEY;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Function to query Hugging Face API for summarization
async function getSummaryFromMistral(text) {
  try {
    const prompt = `<s>[INST] Summarize the following text extracted from a PDF document in 3-5 bullet points, highlighting the key information:

${text.substring(0, 4000)} [/INST]</s>`;

    const response = await axios.post(
      API_URL,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          return_full_text: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Extract the generated text from response
    if (
      response.data &&
      Array.isArray(response.data) &&
      response.data.length > 0
    ) {
      return response.data[0].generated_text;
    } else {
      console.log("Unexpected API response format:", response.data);
      return simpleExtractSummary(text);
    }
  } catch (error) {
    console.error("Error calling Mistral API:", error.message);
    return simpleExtractSummary(text);
  }
}

// Simple function to extract a summary when API fails
function simpleExtractSummary(text) {
  // Get first 1000 characters as a simple summary
  const firstPart = text.substring(0, 1000).trim();

  // Split by periods to get complete sentences
  const sentences = firstPart.split(".");
  sentences.pop(); // Remove potentially incomplete last sentence

  return sentences.join(".") + ".";
}

// @route   GET /api/pdf/list
// @desc    Get all PDFs associated with the user
// @access  Private
router.get("/list", protect, async (req, res) => {
  try {
    // Find notes created by user that have PDF tags
    const userId = req.user._id || req.user.id;
    const pdfNotes = await Note.find({
      user: userId,
      tags: { $in: ["pdf"] },
    }).select("title createdAt updatedAt");

    // Get list of files in the uploads directory
    const uploadDir = path.join(__dirname, "../uploads");
    const files = fs.readdirSync(uploadDir);

    // Filter for only PDF files
    const pdfFiles = files.filter((file) => file.endsWith(".pdf"));

    // Create formatted response
    const pdfs = pdfFiles.map((filename) => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);

      // Find matching note if any
      const matchingNote = pdfNotes.find(
        (note) =>
          note.title ===
          filename.split("-").slice(1).join("-").replace(".pdf", "")
      );

      return {
        id: filename,
        filename: filename.split("-").slice(1).join("-"),
        path: `/uploads/${filename}`,
        uploadDate: stats.mtime,
        size: stats.size,
        noteId: matchingNote ? matchingNote._id : null,
      };
    });

    res.json(pdfs);
  } catch (error) {
    console.error("Error fetching PDFs:", error);
    res.status(500).json({ message: "Error fetching PDFs: " + error.message });
  }
});

// @route   POST /api/pdf/upload
// @desc    Upload PDF, extract text and create note
// @access  Private
router.post("/upload", protect, upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a PDF file" });
    }

    console.log("File uploaded:", req.file.path);

    const userId = new mongoose.Types.ObjectId(req.user._id);

    console.log("Using user ID for note:", userId.toString());

    try {
      const pdfFile = fs.readFileSync(req.file.path);
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      const fileName = `${uuid()}.pdf`;
      const { data, error } = await supabase.storage
        .from("pdfs")
        .upload(fileName, pdfFile, {
          contentType: "application/pdf",
          cacheControl: "3600",
        });

      if (error) {
        console.error("Error uploading PDF to Supabase:", error);
        return res.status(500).json({
          message: "Error uploading PDF to Supabase: " + error.message,
        });
      }

      const note = await Note.create({
        user: userId,
        title: req.file.originalname.replace(".pdf", "") || "PDF Note",
        url: data.url,
        tags: ["pdf"],
      });

      // Return note data along with the stored filename
      return res.status(201).json({
        ...note._doc,
        storedFilename: req.file.filename || path.basename(req.file.path),
      });
    } catch (pdfError) {
      console.error("Error processing PDF:", pdfError);
      return res
        .status(400)
        .json({ message: "Unable to parse PDF file: " + pdfError.message });
    }
  } catch (error) {
    console.error("Error in PDF upload route:", error);
    res
      .status(500)
      .json({ message: "Error processing PDF file: " + error.message });
  }
});

// @route   GET /api/pdf/:filename
// @desc    Serve a PDF file
// @access  Private
router.get("/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "../uploads", filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "PDF file not found" });
    }

    // Serve the file
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error serving PDF:", error);
    res.status(500).json({ message: "Error serving PDF: " + error.message });
  }
});

module.exports = router;
