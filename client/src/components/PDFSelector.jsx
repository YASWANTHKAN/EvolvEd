import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import config from "../config";

function PDFSelector({ onSelect }) {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchPDFs = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const response = await axios.get(`${config.API_URL}/api/pdf/list`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setPdfs(response.data);
      } catch (err) {
        console.error("Error fetching PDFs:", err);
        setError("Failed to load PDFs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPDFs();
  }, [user]);

  const handleSelectPDF = (pdf) => {
    if (onSelect) {
      onSelect({
        url: `${config.API_URL}/api/pdf/${pdf.id}`,
        filename: pdf.filename,
        id: pdf.id,
      });
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-gray-500">Loading PDFs...</div>
    );
  }

  if (error) {
    return <div className="py-4 text-center text-red-500">{error}</div>;
  }

  if (pdfs.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        No PDFs found. Please upload a PDF first.
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="text-lg font-medium mb-4">Select a PDF</h3>
      <div className="max-h-72 overflow-y-auto">
        <ul className="divide-y divide-gray-200">
          {pdfs.map((pdf) => (
            <li key={pdf.id} className="py-3">
              <button
                onClick={() => handleSelectPDF(pdf)}
                className="w-full text-left flex items-center hover:bg-gray-100 p-2 rounded"
              >
                <div className="flex-shrink-0 bg-blue-100 p-2 rounded mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-500"
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
                </div>
                <div>
                  <div className="font-medium">{pdf.filename}</div>
                  <div className="text-sm text-gray-500">
                    Uploaded: {new Date(pdf.uploadDate).toLocaleDateString()}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default PDFSelector;
