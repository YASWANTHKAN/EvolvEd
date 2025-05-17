const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const {
  getNotes,
  createNote,
  getNote,
  updateNote,
  deleteNote,
  createNoteWithPDF,
  summarizePDF,
} = require("../controllers/noteController");

const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getNotes).post(protect, createNote);

router
  .route("/with-pdf")
  .post(protect, upload.single("pdf"), createNoteWithPDF);

router
  .route("/summarize-pdf")
  .post(protect, upload.single("pdfFile"), summarizePDF);

router
  .route("/:id")
  .get(protect, getNote)
  .put(protect, updateNote)
  .delete(protect, deleteNote);

module.exports = router;
