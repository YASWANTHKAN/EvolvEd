const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

// POST /api/chat
router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res
      .status(400)
      .json({ reply: "⚠️ Please provide a valid message." });
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: message }],
          },
        ],
      }
    );

    let reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      reply = "🤔 No reply generated.";
    }

    return res.json({ reply: reply.trim().replace(/\s+$/, "") });
  } catch (error) {
    console.error(
      "Error communicating with Gemini:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      reply: "⚠️ Sorry, something went wrong while talking to Gemini!",
    });
  }
});

module.exports = router;
