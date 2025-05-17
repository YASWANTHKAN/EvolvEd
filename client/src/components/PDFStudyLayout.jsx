import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import PDFViewer from "./PDFViewer";
import { createNote, getNotes, updateNote } from "../features/notes/noteSlice";

function PDFStudyLayout({
  pdfUrl = "",
  pdfTitle = "",
  initialNotes = "",
  noteId: externalNoteId = null,
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [noteId, setNoteId] = useState(externalNoteId);
  const [isSaving, setIsSaving] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    notes: userNotes,
    isLoading,
    isError,
    message,
    isSuccess,
  } = useSelector((state) => state.notes);

  useEffect(() => {
    if (user) {
      dispatch(getNotes());
    }
  }, [user, dispatch]);

  // Update local state when props change
  useEffect(() => {
    if (initialNotes) {
      setNotes(initialNotes);
    }
    if (externalNoteId) {
      setNoteId(externalNoteId);
    }
  }, [initialNotes, externalNoteId]);

  // Find note for this PDF
  useEffect(() => {
    if (userNotes?.length > 0 && pdfUrl && !noteId) {
      // Extract the PDF ID from the pdfUrl object or string
      let pdfId;
      if (typeof pdfUrl === "string") {
        pdfId = pdfUrl;
      } else if (pdfUrl.id) {
        pdfId = pdfUrl.id;
      } else if (pdfUrl.url) {
        const urlParts = pdfUrl.url.split("/");
        pdfId = urlParts[urlParts.length - 1];
      }

      const existingNote = userNotes.find((note) => {
        if (!note) return false;
        if (note.pdfFile === pdfId) return true;
        if (pdfUrl.filename && note.title === `Notes: ${pdfUrl.filename}`) return true;
        if (note.pdfFile && pdfId && note.pdfFile.includes(pdfId)) return true;
        return false;
      });

      if (existingNote) {
        setNotes(existingNote.content || '');
        setNoteId(existingNote._id);
      }
    }
  }, [userNotes, pdfUrl, noteId]);

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const handleSaveNotes = async () => {
    if (!notes.trim()) {
      toast.info("Please enter some notes to save");
      return;
    }

    try {
      setIsSaving(true);

      let pdfId;
      let fileUrl;

      if (typeof pdfUrl === "string") {
        pdfId = pdfUrl;
        fileUrl = pdfUrl;
      } else if (pdfUrl.id) {
        pdfId = pdfUrl.id;
        fileUrl = pdfUrl.url;
      } else if (pdfUrl.url) {
        const urlParts = pdfUrl.url.split("/");
        pdfId = urlParts[urlParts.length - 1];
        fileUrl = pdfUrl.url;
      }

      const noteTitle = `Notes: ${pdfUrl.filename || pdfTitle || "PDF Document"}`;

      const noteData = {
        title: noteTitle,
        content: notes,
        tags: ["pdf-notes"],
        pdfFile: pdfId,
        url: fileUrl,
      };

      if (noteId) {
        await dispatch(updateNote({ noteId, noteData })).unwrap();
        toast.success("Notes updated successfully");
      } else {
        const result = await dispatch(createNote(noteData)).unwrap();
        setNoteId(result._id);
        toast.success("Notes saved successfully");
      }

      dispatch(getNotes());
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes: " + (error.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
      {/* Left side: PDF Viewer */}
      <div className="border rounded-lg shadow-sm overflow-hidden bg-white">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">
            {pdfTitle ? `Document: ${pdfTitle}` : "Document Viewer"}
          </h3>
        </div>
        <div className="h-[calc(100%-60px)]">
          {pdfUrl ? (
            <PDFViewer url={typeof pdfUrl === 'string' ? pdfUrl : pdfUrl.url} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No PDF selected
            </div>
          )}
        </div>
      </div>

      {/* Right side: Notes */}
      <div className="border rounded-lg shadow-sm overflow-hidden bg-white">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Notes</h3>
          <button
            onClick={handleSaveNotes}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Notes"}
          </button>
        </div>
        <div className="p-4 h-[calc(100%-60px)]">
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Take notes here..."
            className="w-full h-full p-2 border rounded resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

export default PDFStudyLayout;
