import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import PDFUploader from "../components/PDFUploader";
import PDFViewer from "../components/PDFViewer";
import PDFSelector from "../components/PDFSelector";
import NoteEditor from "../components/NoteEditor";
import PDFSummarizer from "../components/PDFSummarizer";
import { getNotes, createNote } from "../features/notes/noteSlice";
import axios from "axios";
import config from "../config";

function Notes() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { notes: userNotes, isLoading: notesLoading } = useSelector(
    (state) => state.notes
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [showSummarizer, setShowSummarizer] = useState(false);
  const [view, setView] = useState("grid"); // grid or list view

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      // Load user's notes
      dispatch(getNotes());
    }
  }, [user, navigate, dispatch]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (criteria) => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(criteria);
      setSortOrder("asc");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setSelectedPDF({
        file,
        previewUrl: url,
        filename: file.name,
      });
    } else if (file) {
      toast.error("Please select a valid PDF file");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setSelectedPDF({
        file,
        previewUrl: url,
        filename: file.name,
      });
    } else if (file) {
      toast.error("Please select a valid PDF file");
    }
  };

  const handleSummaryGenerated = (summary) => {
    // Add the generated summary to the note content
    setNoteContent((prevContent) => {
      if (prevContent.trim()) {
        return `${prevContent}\n\n## AI-Generated Summary\n\n${summary}`;
      }
      return `## AI-Generated Summary\n\n${summary}`;
    });
    
    setGeneratedSummary(summary);
    toast.success("Summary added to note content");
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) {
      toast.error("Please add a title for your note");
      return;
    }

    if (!noteContent.trim()) {
      toast.error("Please add some content to your note");
      return;
    }

    try {
      setIsSaving(true);
      let noteData = {
        title: noteTitle,
        content: noteContent,
        tags: [],
      };

      // If there's a PDF file to upload
      if (selectedPDF?.file) {
        const formData = new FormData();
        formData.append("pdf", selectedPDF.file);
        formData.append("title", noteTitle);
        formData.append("content", noteContent);
        formData.append("tags", JSON.stringify(["pdf-notes"]));

        console.log("Uploading PDF and creating note...");
        const response = await axios.post(
          `${config.API_URL}/api/notes/with-pdf`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        console.log("Note created with PDF:", response.data);
        toast.success("PDF uploaded and note created successfully");
      } else {
        // Regular note without PDF
        noteData.url = "none";
        console.log("Creating regular note:", noteData);
        await dispatch(createNote(noteData)).unwrap();
        toast.success("Note saved successfully");
      }

      // Refresh notes list
      dispatch(getNotes());

      // Close editor and reset form
      setIsEditorOpen(false);
      setNoteContent("");
      setNoteTitle("");
      setSelectedPDF(null);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error(`Failed to save note: ${error.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter notes based on search term
  const filteredNotes = userNotes
    .filter(
      (note) =>
        !note.tags?.includes("pdf-notes") &&
        (note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a[sortBy] > b[sortBy] ? 1 : -1;
      } else {
        return a[sortBy] < b[sortBy] ? 1 : -1;
      }
    });

  // Filter notes that have PDF attachments
  const getPDFNotes = () => {
    if (!userNotes || !Array.isArray(userNotes)) return [];

    return userNotes.filter(
      (note) => note.tags?.includes("pdf-notes") || note.pdfFile
    );
  };

  if (notesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section with Gradient Background */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                AI Notes
              </h1>
              <p className="text-indigo-100 text-lg max-w-2xl">
                Create, organize, and enhance your notes with AI assistance. Upload PDFs for AI-powered summarization.
              </p>
            </div>
            <button
              onClick={() => {
                setIsEditorOpen(true);
                setSelectedPDF(null);
                setNoteContent("");
                setNoteTitle("");
              }}
              className="group bg-white text-indigo-600 rounded-full px-6 py-3 font-medium inline-flex items-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create New Note
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 md:p-3">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-indigo-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full bg-white/10 border-none text-white placeholder-indigo-100 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-white/50 focus:bg-white/20"
                />
              </div>
              
              <div className="flex space-x-2 md:space-x-4 items-center">
                <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setView('grid')}
                    className={`p-2 rounded-lg ${view === 'grid' 
                      ? 'bg-white/20 text-white' 
                      : 'text-indigo-100 hover:bg-white/10'}`}
                    aria-label="Grid view"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`p-2 rounded-lg ${view === 'list' 
                      ? 'bg-white/20 text-white' 
                      : 'text-indigo-100 hover:bg-white/10'}`}
                    aria-label="List view"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
                
                <select
                  value={sortBy + '-' + sortOrder}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-');
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="bg-white/10 text-white border-none rounded-lg py-2 px-4 focus:ring-2 focus:ring-white/50"
                >
                  <option value="updatedAt-desc">Newest First</option>
                  <option value="updatedAt-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 md:px-6">
        {/* PDF Notes Section */}
        {getPDFNotes().length > 0 && (
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">PDF Study Notes</h2>
            </div>
            
            <div className={view === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'}>
              {getPDFNotes().map((note) => (
                <div
                  key={note._id}
                  className={`group ${view === 'grid' 
                    ? 'bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200' 
                    : 'bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 flex'} 
                    transition-all duration-300 relative`
                  }
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500"></div>
                  <div className={view === 'grid' ? 'p-6' : 'p-5 flex-grow'}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4 mt-1">
                        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
                          {note.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                          {note.content}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(note.updatedAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <div className="flex space-x-2">
                            <Link
                              to={`/notes/${note._id}`}
                              className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors"
                            >
                              View
                            </Link>
                            {note.pdfFile && (
                              <Link
                                to="/pdfstudy"
                                state={{ pdfId: note.pdfFile, noteId: note._id }}
                                className="text-green-600 text-sm font-medium hover:text-green-800 transition-colors flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Study
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Notes Section */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Notes</h2>
          </div>

          <div className={view === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'}>
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <div
                  key={note._id}
                  className={`group ${view === 'grid' 
                    ? 'bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200' 
                    : 'bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 flex'} 
                    transition-all duration-300 relative`
                  }
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  <div className={view === 'grid' ? 'p-6' : 'p-5 flex-grow'}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4 mt-1">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
                          {note.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                          {note.content}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(note.updatedAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <Link
                            to={`/notes/${note._id}`}
                            className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors inline-flex items-center"
                          >
                            View Note
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 bg-white rounded-xl p-10 shadow-sm text-center">
                <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes found</h3>
                <p className="text-gray-600 mb-6">Create your first note by clicking the button below</p>
                <button
                  onClick={() => {
                    setIsEditorOpen(true);
                    setSelectedPDF(null);
                    setNoteContent("");
                    setNoteTitle("");
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium inline-flex items-center hover:bg-indigo-700 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Create New Note
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {noteTitle ? noteTitle : "Create New AI Note"}
              </h2>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-white hover:text-indigo-100 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto">
              {/* Title Input */}
              <div className="px-6 pt-6 pb-4">
                <div className="mb-5">
                  <label
                    htmlFor="noteTitle"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Title
                  </label>
                  <input
                    id="noteTitle"
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Enter a title for your note"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg px-4 py-3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - PDF Attachment */}
                  <div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                          <svg className="w-5 h-5 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Attach PDF (Optional)
                        </h3>
                        {selectedPDF && (
                          <button
                            onClick={() => {
                              setSelectedPDF(null);
                              setShowSummarizer(false);
                              setGeneratedSummary("");
                            }}
                            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </button>
                        )}
                      </div>
                      
                      {!selectedPDF ? (
                        <div
                          className="border-2 border-dashed border-indigo-200 rounded-lg px-6 pt-5 pb-6 flex justify-center cursor-pointer hover:border-indigo-300 transition-colors"
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          <div className="text-center">
                            <svg
                              className="mx-auto h-12 w-12 text-indigo-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <div className="mt-3 flex flex-col sm:flex-row text-sm justify-center">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer rounded-md font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                              >
                                <span>Upload a PDF file</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  onChange={handleFileSelect}
                                  accept="application/pdf"
                                />
                              </label>
                              <p className="pl-1 text-gray-500">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              PDF files up to 10MB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-4 flex items-center">
                            <svg
                              className="h-8 w-8 text-indigo-500 mr-3 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 truncate">
                                {selectedPDF.filename}
                              </p>
                              <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">
                                AI can analyze this PDF to help create your note
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between space-x-3">
                            <button
                              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                              onClick={() => window.open(selectedPDF.previewUrl, '_blank')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View PDF
                            </button>
                            <button
                              className="flex-1 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                              onClick={() => setShowSummarizer(!showSummarizer)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              {showSummarizer ? "Hide Summarizer" : "Summarize with AI"}
                            </button>
                          </div>
                          
                          {showSummarizer && (
                            <div className="mt-4 border-t border-indigo-100 pt-4">
                              <PDFSummarizer 
                                pdfFile={selectedPDF.file || selectedPDF.previewUrl}
                                onSummaryGenerated={handleSummaryGenerated}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Note Content */}
                  <div>
                    <div className="h-full flex flex-col">
                      <label
                        htmlFor="noteContent"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center"
                      >
                        <svg className="w-5 h-5 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Note Content
                      </label>
                      <textarea
                        id="noteContent"
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Write your note here... You can use Markdown for formatting."
                        className="flex-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[300px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* AI Summary Preview - Show if summary was generated */}
              {generatedSummary && (
                <div className="px-6 pb-6">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex items-center mb-3">
                      <svg className="h-5 w-5 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <h3 className="font-medium text-indigo-700 dark:text-indigo-300">AI-Generated Summary Preview</h3>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 max-h-40 overflow-y-auto">
                      <p className="whitespace-pre-line">{generatedSummary}</p>
                    </div>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-2">
                      This summary has been added to your note content
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <div className="text-gray-500 text-sm dark:text-gray-400">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Supports Markdown formatting
                </span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="px-5 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className={`px-5 py-2.5 rounded-lg text-white font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${
                    isSaving
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Note
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notes;
