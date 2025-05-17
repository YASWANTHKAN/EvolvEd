const asyncHandler = require("express-async-handler");
const Note = require("../models/noteModel");
const { uploadToSupabase } = require("../utils/supabase");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const pdfParse = require("pdf-parse");

// @desc    Get all notes for a user
// @route   GET /api/notes
// @access  Private
const getNotes = asyncHandler(async (req, res) => {
  console.log("Getting notes for user ID:", req.user.id);
  try {
    const notes = await Note.find({ user: req.user.id });
    console.log(`Found ${notes.length} notes for user`);
    res.status(200).json(notes);
  } catch (error) {
    console.error("Error getting notes:", error);
    res.status(500);
    throw new Error("Error retrieving notes: " + error.message);
  }
});

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = asyncHandler(async (req, res) => {
  console.log("Creating note with data:", req.body);

  const { title, content, tags, images, url, pdfFile } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error("Please add title and content");
  }

  try {
    const note = await Note.create({
      title,
      content,
      url: url || null,
      tags: tags || [],
      images: images || [],
      pdfFile: pdfFile || null,
      user: req.user.id,
    });

    console.log("Note created successfully:", note._id);
    res.status(201).json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500);
    throw new Error("Error creating note: " + error.message);
  }
});

// @desc    Get a single note
// @route   GET /api/notes/:id
// @access  Private
const getNote = asyncHandler(async (req, res) => {
  console.log("Getting note with ID:", req.params.id);

  try {
    const note = await Note.findById(req.params.id);
    console.log({ note });

    if (!note) {
      console.log("Note not found");
      res.status(404);
      throw new Error("Note not found");
    }

    // Make sure logged in user matches the note owner
    if (note.user.toString() !== req.user.id) {
      console.log("User not authorized to access note");
      res.status(401);
      throw new Error("Not authorized");
    }

    console.log("Note found:", note._id);
    res.status(200).json(note);
  } catch (error) {
    console.error("Error getting note:", error);
    if (error.kind === "ObjectId") {
      res.status(404);
      throw new Error("Note not found");
    }
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = asyncHandler(async (req, res) => {
  console.log("Updating note with ID:", req.params.id);
  console.log("Update data:", req.body);

  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      console.log("Note not found");
      res.status(404);
      throw new Error("Note not found");
    }

    // Make sure logged in user matches the note owner
    if (note.user.toString() !== req.user.id) {
      console.log("User not authorized to update note");
      res.status(401);
      throw new Error("Not authorized");
    }

    // Update with the pdfFile field if provided
    if (req.body.pdfFile !== undefined) {
      req.body.pdfFile = req.body.pdfFile || null;
    }

    const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    console.log("Note updated successfully:", updatedNote._id);
    res.status(200).json(updatedNote);
  } catch (error) {
    console.error("Error updating note:", error);
    if (error.kind === "ObjectId") {
      res.status(404);
      throw new Error("Note not found");
    }
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = asyncHandler(async (req, res) => {
  console.log("Deleting note with ID:", req.params.id);

  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      console.log("Note not found");
      res.status(404);
      throw new Error("Note not found");
    }

    // Make sure logged in user matches the note owner
    if (note.user.toString() !== req.user.id) {
      console.log("User not authorized to delete note");
      res.status(401);
      throw new Error("Not authorized");
    }

    await note.deleteOne();

    console.log("Note deleted successfully");
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    console.error("Error deleting note:", error);
    if (error.kind === "ObjectId") {
      res.status(404);
      throw new Error("Note not found");
    }
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

// @desc    Create a note with PDF upload
// @route   POST /api/notes/with-pdf
// @access  Private
const createNoteWithPDF = asyncHandler(async (req, res) => {
  console.log("Creating note with PDF upload");
  console.log("Request body:", req.body);
  console.log("Request file:", req.file);

  // Check if we have a file
  if (!req.file) {
    res.status(400);
    throw new Error("Please upload a PDF file");
  }

  // Check if we have the required note data
  const { title, content } = req.body;
  const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

  if (!title || !content) {
    res.status(400);
    throw new Error("Please add title and content");
  }

  try {
    // Upload PDF to Supabase
    console.log("Uploading PDF to Supabase...");
    const fileData = await uploadToSupabase(req.file);
    console.log("PDF uploaded successfully:", fileData);

    // Create note with the PDF URL
    const note = await Note.create({
      title,
      content,
      tags,
      url: fileData.url,
      pdfFile: fileData._id || null,
      user: req.user.id,
    });

    console.log("Note created successfully with PDF:", note._id);
    res.status(201).json(note);
  } catch (error) {
    console.error("Error in createNoteWithPDF:", error);
    res.status(500);
    throw new Error("Error creating note with PDF: " + error.message);
  }
});

const extractPDFText = async (pdfUrl) => {
  const response = await axios.get(pdfUrl, { responseType: "arraybuffer" });
  const pdfData = await pdfParse(response.data);
  return pdfData.text;
};


// @desc    Summarize a PDF file using Mistral-7B
// @route   POST /api/notes/summarize-pdf
// @access  Private
const summarizePDF = asyncHandler(async (req, res) => {
  console.log("Summarizing PDF with Mistral-7B");
  console.log("Request body:", req.body);
  console.log("Request file:", req.file);

  try {
    let pdfUrl = null;


    // Handle either uploaded file or URL
    if (req.file) {
      // Upload PDF to Supabase if file is provided
      console.log("Uploading PDF to Supabase...");
      const fileData = await uploadToSupabase(req.file);
      pdfUrl = fileData.url;
      console.log("PDF uploaded successfully:", fileData);
    } else if (req.body.pdfUrl) {
      // Use the provided URL
      pdfUrl = req.body.pdfUrl;
      console.log("Using provided PDF URL:", pdfUrl);
    } else {
      res.status(400);
      throw new Error("Please provide a PDF file or URL");
    }

    const pdfText = await extractPDFText(pdfUrl);

    const { length, style, focus } = req.body;


    const prompt = generateSummaryPrompt(pdfText, {
      length: length || "medium",
      style: style || "concise",
      focus: focus || "general",
    });


    // Call Mistral API for summarization using our utility
    const summary = await generatePdfSummary(prompt);


    // Return the summary
    res.status(200).json({
      success: true,
      summary,
      pdfUrl,
      pdfUrl,
    });
  } catch (error) {
    console.error("Error in summarizePDF:", error);
    res.status(500);
    throw new Error("Error summarizing PDF: " + error.message);
  }
});

// Helper function to generate a summary prompt based on options
const generateSummaryPrompt = (text, options) => {
  const { length, style, focus } = options;


  // Set length instruction
  let lengthInstruction = "";
  if (length === "short") {
    lengthInstruction = "Create a brief summary in 1-2 paragraphs.";
  } else if (length === "medium") {
    lengthInstruction = "Create a comprehensive summary in 3-5 paragraphs.";
  } else if (length === "long") {
    lengthInstruction =
      "Create a detailed summary covering all important aspects.";
  }

  // Set style instruction
  let styleInstruction = "";
  if (style === "concise") {
    styleInstruction = "Keep the summary concise and to the point.";
  } else if (style === "detailed") {
    styleInstruction = "Include specific details and examples in your summary.";
  } else if (style === "bullet-points") {
    styleInstruction =
      "Format the summary as a list of bullet points highlighting key information.";
  }

  // Set focus instruction
  let focusInstruction = "";
  if (focus === "general") {
    focusInstruction = "Focus on providing a general overview of the content.";
  } else if (focus === "key-concepts") {
    focusInstruction =
      "Focus on identifying and explaining the key concepts presented.";
  } else if (focus === "technical") {
    focusInstruction = "Focus on technical details and methodology discussed.";
  }

  // Build the complete prompt
  return `
    Summarize the following text extracted from a PDF document:
    
  text: ${text}
    
    ${lengthInstruction} ${styleInstruction} ${focusInstruction}
    
    Your summary should:
    1. Capture the main ideas and arguments
    2. Identify key findings or conclusions
    3. Be well-structured and easy to understand
    4. Not include your own opinions on the content
    
    Summary:
  `;
};

const generatePdfSummary = async (prompt) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }
    );

    const reply =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "🤔 No reply generated.";
    return reply;
  } catch (err) {
    console.error("Error in generatePdfSummary:", err.message);
    throw new Error("Error generating PDF summary: " + err.message);
  }
};

module.exports = {
  getNotes,
  createNote,
  getNote,
  updateNote,
  deleteNote,
  createNoteWithPDF,
  summarizePDF,
}
