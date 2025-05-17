const mongoose = require("mongoose");

const noteSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "Please add a title"],
    },
    url: {
      type: String,
      required: [true, "Please add a url"],
    },
    content: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    images: {
      type: [String], // URLs to stored images
      default: [],
    },
    pdfFile: {
      type: String, // Path or ID of the PDF file
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Note", noteSchema);
