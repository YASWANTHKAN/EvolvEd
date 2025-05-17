import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import config from "../config";

function FlashcardUploader({ onPDFSelect, onClose }) {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewURL, setPreviewURL] = useState(null);
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewURL(url);
    } else {
      toast.error("Please select a valid PDF file");
      e.target.value = null;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      const url = URL.createObjectURL(droppedFile);
      setPreviewURL(url);
    } else {
      toast.error("Please select a valid PDF file");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a PDF file");
      return;
    }

    if (!deckTitle.trim()) {
      toast.error("Please enter a deck title");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to upload PDFs");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("title", deckTitle);
    formData.append("description", deckDescription);

    try {
      const token = user.token;
      console.log("uploading to Supabase via backend...");

      const response = await axios.post(
        `${config.API_URL}/api/flashcards/with-pdf`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      console.log("Upload response from server:", response.data);

      toast.success("PDF uploaded and flashcard deck created successfully");

      // Notify parent component with the complete data
      if (onPDFSelect) {
        const pdfData = {
          url: response.data.url,
          filename: response.data.title || file.name,
          id: response.data._id,
          _id: response.data._id,
          isServer: true,
          deckId: response.data.deckId,
        };
        onPDFSelect(pdfData);
      }

      // Close the uploader if we have a close function
      if (onClose) {
        onClose();
      }

      // Clear form
      setFile(null);
      setPreviewURL(null);
      setProgress(0);
      setDeckTitle("");
      setDeckDescription("");
      fileInputRef.current.value = null;
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast.error(
        error.response?.data?.message ||
          "Error processing PDF: " + error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="deckTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deck Title
          </label>
          <input
            id="deckTitle"
            type="text"
            value={deckTitle}
            onChange={(e) => setDeckTitle(e.target.value)}
            placeholder="Enter a title for your flashcard deck"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="deckDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deck Description (optional)
          </label>
          <textarea
            id="deckDescription"
            value={deckDescription}
            onChange={(e) => setDeckDescription(e.target.value)}
            placeholder="Add a description to help you remember what this deck is about"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows="3"
          />
        </div>
        
        <div
          className="mb-6 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-lg p-6 text-center transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          {!file ? (
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  Drag and drop your PDF
                </span>{" "}
                or click to browse files
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PDF files up to 10MB
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {file.name}
              </p>
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreviewURL(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
              >
                Remove file
              </button>
            </div>
          )}
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            disabled={isLoading}
          />
        </div>
        
        {previewURL && (
          <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-800 p-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF Preview
              </span>
              <button 
                type="button" 
                onClick={() => window.open(previewURL, '_blank')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
              >
                Open in new tab
              </button>
            </div>
            <div className="h-64 overflow-hidden">
              <embed
                src={previewURL}
                type="application/pdf"
                width="100%"
                height="100%"
                className="border-0"
              />
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="mb-6">
            <div className="flex items-center mb-1">
              <div className="flex-grow">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {progress}%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Creating flashcards from your PDF...
            </p>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 mr-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-6 py-2 rounded-lg font-medium ${
              isLoading || !file
                ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white"
                : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-sm hover:shadow transition-all duration-200"
            }`}
            disabled={isLoading || !file}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              "Create Flashcard Deck"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FlashcardUploader;
