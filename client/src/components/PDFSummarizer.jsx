import React, { useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import config from "../config";

function PDFSummarizer({ pdfFile, onSummaryGenerated }) {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryProgress, setSummaryProgress] = useState(0);
  const [summaryOptions, setSummaryOptions] = useState({
    length: "medium", // short, medium, long
    style: "concise", // concise, detailed, bullet-points
    focus: "general", // general, key-concepts, technical
  });
  const { user } = useSelector((state) => state.auth);

  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    setSummaryOptions({
      ...summaryOptions,
      [name]: value,
    });
  };

  const generateSummary = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file to summarize");
      return;
    }

    try {
      setIsGeneratingSummary(true);
      setSummaryProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSummaryProgress((prev) => {
          const newProgress = prev + Math.floor(Math.random() * 5) + 1;
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, 1000);

      // Create form data with PDF and summary options
      const formData = new FormData();
      if (typeof pdfFile === "string") {
        // If it's a URL, pass as URL parameter
        formData.append("pdfUrl", pdfFile);
      } else if (pdfFile instanceof File) {
        // If it's a File object, append to form data
        formData.append("pdfFile", pdfFile);
      } else if (pdfFile.file instanceof File) {
        // If it has a file property, append that
        formData.append("pdfFile", pdfFile.file);
      }

      // Add summary options
      Object.keys(summaryOptions).forEach((key) => {
        formData.append(key, summaryOptions[key]);
      });

      // Call the API to generate summary
      const response = await axios.post(
        `${config.API_URL}/api/notes/summarize-pdf`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      clearInterval(progressInterval);
      setSummaryProgress(100);

      // Call the callback with the generated summary
      if (response.data && response.data.summary) {
        onSummaryGenerated(response.data.summary);
        toast.success("PDF summarization complete!");
      } else {
        throw new Error("Failed to generate summary");
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error(
        `Failed to generate summary: ${error.message || "Server error"}`
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        Summarize PDF with AI
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Summary Length
          </label>
          <select
            name="length"
            value={summaryOptions.length}
            onChange={handleOptionChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={isGeneratingSummary}
          >
            <option value="short">Short (1-2 paragraphs)</option>
            <option value="medium">Medium (3-5 paragraphs)</option>
            <option value="long">Long (comprehensive)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Summary Style
          </label>
          <select
            name="style"
            value={summaryOptions.style}
            onChange={handleOptionChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={isGeneratingSummary}
          >
            <option value="concise">Concise</option>
            <option value="detailed">Detailed</option>
            <option value="bullet-points">Bullet Points</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Focus Area
          </label>
          <select
            name="focus"
            value={summaryOptions.focus}
            onChange={handleOptionChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={isGeneratingSummary}
          >
            <option value="general">General Overview</option>
            <option value="key-concepts">Key Concepts</option>
            <option value="technical">Technical Details</option>
          </select>
        </div>
      </div>

      {isGeneratingSummary && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${summaryProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Generating summary... {summaryProgress}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Using Mistral-7B-Instruct-v0.3 AI model for summarization
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={generateSummary}
          disabled={isGeneratingSummary || !pdfFile}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isGeneratingSummary || !pdfFile
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isGeneratingSummary ? "Generating..." : "Generate Summary"}
        </button>
      </div>
    </div>
  );
}

PDFSummarizer.propTypes = {
  pdfFile: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(File),
    PropTypes.object,
  ]),
  onSummaryGenerated: PropTypes.func.isRequired,
};

export default PDFSummarizer;
