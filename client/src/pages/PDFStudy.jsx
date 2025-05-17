import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import PDFUploader from "../components/PDFUploader";
import PDFSelector from "../components/PDFSelector";
import PDFStudyLayout from "../components/PDFStudyLayout";
import {
  reset as resetNotes,
  getNotes,
  getNote,
  updateNote,
  createNote,
} from "../features/notes/noteSlice";
import config from "../config";

function PDFStudy() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { notes: userNotes, note: selectedNote } = useSelector(
    (state) => state.notes
  );
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [showPDFSelector, setShowPDFSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      const getUserNotes = async () => {
        // Load user's notes
        dispatch(getNotes());

        const state = location.state;
        const note = await dispatch(getNote(state.noteId));
        setSelectedPDF({
          url: note.payload.url,
          filename: state.pdfId.split("-").slice(1).join("-"),
          id: state.pdfId,
        });
      };

      getUserNotes();
    }

    // Clean up when component unmounts
    return () => {
      dispatch(resetNotes());
    };
  }, [user, navigate, dispatch, location]);

  // Load PDF from note when note is selected
  useEffect(() => {
    const loadPDFFromNote = async () => {
      // If we have a selected note with PDF file
      if (selectedNote && selectedNote.pdfFile && !selectedPDF) {
        setLoading(true);
        try {
          // If the pdfFile is a full URL
          if (selectedNote.pdfFile.startsWith("http")) {
            setSelectedPDF({
              url: selectedNote.pdfFile,
              filename: selectedNote.title.replace("Notes: ", ""),
              id: selectedNote._id,
            });
          }
          // If it's just an ID
          else {
            // Try to find matching PDF in userNotes
            const pdfNotes = userNotes.filter(
              (note) => note.tags && note.tags.includes("pdf")
            );
            const matchingPDF = pdfNotes.find(
              (note) => note._id === selectedNote.pdfFile
            );

            if (matchingPDF) {
              setSelectedPDF({
                url: `${config.API_URL}/api/pdf/${matchingPDF.title}.pdf`,
                filename: matchingPDF.title,
                id: matchingPDF._id,
              });
            } else {
              // If can't find matching note, try to load directly
              setSelectedPDF({
                url: `${config.API_URL}/api/pdf/${selectedNote.pdfFile}`,
                filename: selectedNote.title.replace("Notes: ", ""),
                id: selectedNote.pdfFile,
              });
            }
          }

          // Set notes content if available
          if (selectedNote.content) {
            setNotes(selectedNote.content);
          }
        } catch (error) {
          console.error("Error loading PDF from note:", error);
          toast.error("Error loading the PDF file");
        } finally {
          setLoading(false);
        }
      }
    };

    loadPDFFromNote();
  }, [selectedNote, userNotes, selectedPDF]);

  const handlePDFSelect = (pdfData) => {
    setSelectedPDF(pdfData);
    setShowPDFSelector(false);
  };

  const handleChangePDF = () => {
    setSelectedPDF(null);
  };

  const togglePDFSelector = () => {
    setShowPDFSelector(!showPDFSelector);
  };

  const toggleDebugger = () => {
    setShowDebugger(!showDebugger);
  };

  // Handle notes input
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!notes.trim()) {
      toast.info("Please enter some notes to save");
      return;
    }

    if (!selectedPDF) {
      toast.error("No PDF selected");
      return;
    }

    try {
      // Get PDF identifier
      let pdfId;
      if (typeof selectedPDF === "string") {
        pdfId = selectedPDF;
      } else if (selectedPDF.id) {
        pdfId = selectedPDF.id;
      } else if (selectedPDF.url) {
        // Extract filename from URL
        const urlParts = selectedPDF.url.split("/");
        pdfId = urlParts[urlParts.length - 1];
      }

      if (!pdfId) {
        console.error("Could not determine PDF ID:", selectedPDF);
        toast.error("Invalid PDF reference");
        return;
      }

      console.log("Saving notes for PDF:", {
        pdfId,
        noteId: selectedNote?._id,
        title: `Notes: ${selectedPDF.filename || "PDF Document"}`,
      });

      const noteData = {
        title: `Notes: ${selectedPDF.filename || "PDF Document"}`,
        content: notes,
        tags: ["pdf-notes"],
        pdfFile: pdfId,
      };

      let result;
      if (selectedNote && selectedNote._id) {
        result = await dispatch(
          updateNote({
            noteId: selectedNote._id,
            noteData,
          })
        ).unwrap();
        toast.success("Notes updated successfully");
      } else {
        result = await dispatch(createNote(noteData)).unwrap();
        toast.success("Notes saved successfully");
      }

      console.log("Note saved:", result);
    } catch (error) {
      console.error("Error saving notes:", error);
      if (error.response) {
        console.error("Error details:", error.response.data);
      }
      toast.error(`Failed to save notes: ${error.message || "Unknown error"}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF and notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">PDF Study</h1>
          <div className="space-x-2">
            <button
              onClick={toggleDebugger}
              className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {showDebugger ? "Hide Debugger" : "Debug PDF Access"}
            </button>
          </div>
        </div>

        {showDebugger && (
          <div className="mb-8 border border-gray-300 rounded-lg p-4">
            <h3 className="font-bold mb-2">PDF Debug Info</h3>
            {selectedPDF && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs overflow-auto">
                <pre>{JSON.stringify(selectedPDF, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {!selectedPDF ? (
          <div className="mb-8">
            <div className="flex flex-col space-y-6">
              <PDFUploader onPDFSelect={handlePDFSelect} />

              <div className="text-center">
                <p className="mb-2 text-gray-600">- OR -</p>
                <button
                  onClick={togglePDFSelector}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium"
                >
                  {showPDFSelector
                    ? "Hide PDF Selector"
                    : "Select Existing PDF"}
                </button>
              </div>

              {showPDFSelector && (
                <div className="mt-4">
                  <PDFSelector onSelect={handlePDFSelect} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Study Mode</h2>
              <button
                onClick={handleChangePDF}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-800 text-sm font-medium"
              >
                Upload Different PDF
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
              {/* Left side: PDF Viewer */}
              <div className="border rounded-lg shadow-sm overflow-hidden bg-white">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="text-lg font-semibold">
                    Document: {selectedPDF.filename || "PDF Document"}
                  </h3>
                </div>
                <div className="h-[calc(100%-60px)]">
                  <iframe
                    src={selectedPDF.url}
                    className="w-full h-full border-0"
                    title="PDF Viewer"
                  />
                </div>
              </div>

              {/* Right side: Notes */}
              <div className="border rounded-lg shadow-sm overflow-hidden bg-white">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Notes</h3>
                  <button
                    onClick={handleSaveNotes}
                    className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Save Notes
                  </button>
                </div>
                <div className="p-4 h-[calc(100%-60px)] overflow-y-auto">
                  <textarea
                    className="w-full h-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={notes}
                    onChange={handleNotesChange}
                    placeholder="Take notes here..."
                  ></textarea>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PDFStudy;
