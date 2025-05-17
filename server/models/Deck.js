const mongoose = require("mongoose");

const deckSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    pdfPath: {
      type: String,
      required: true,
    },
    pageCount: {
      type: Number,
      required: true,
    },
    cards: [
      {
        front: {
          type: String,
          required: true,
        },
        back: {
          type: String,
          required: true,
        },
        pageNumber: {
          type: Number,
          required: true,
        },
      },
    ],
    lastStudied: {
      type: Date,
    },
    studyCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
deckSchema.index({ userId: 1, createdAt: -1 });
deckSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Deck", deckSchema);
