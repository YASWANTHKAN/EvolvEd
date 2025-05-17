const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    deckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deck",
      required: true,
    },
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
    nextReview: {
      type: Date,
      default: Date.now,
    },
    interval: {
      type: Number,
      default: 0,
    },
    easeFactor: {
      type: Number,
      default: 2.5,
    },
    repetitions: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["correct", "incorrect", "new"],
      default: "new",
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
cardSchema.index({ deckId: 1, nextReview: 1 });
cardSchema.index({ deckId: 1, status: 1 });

module.exports = mongoose.model("Card", cardSchema);
