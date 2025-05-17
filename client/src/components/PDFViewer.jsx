import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PDFViewer({ pdfUrl }) {
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset states when PDF changes
    setPdfData(null);
    setError(null);

    if (!pdfUrl) {
      console.log('PDFViewer: No PDF URL provided');
      return;
    }

    console.log('PDFViewer: Received pdfUrl:', pdfUrl);

    const fetchPDF = async () => {
      // If pdfUrl is a string (direct URL), use it directly
      if (typeof pdfUrl === 'string') {
        console.log('PDFViewer: Using direct URL:', pdfUrl);
        setPdfData(pdfUrl);
        return;
      }

      // If pdfUrl is an object with url property
      if (pdfUrl.url) {
        console.log('PDFViewer: Using URL from object:', pdfUrl.url);
        
        // If it's a local file (from file input)
        if (pdfUrl.isLocal) {
          console.log('PDFViewer: Using local file URL');
          setPdfData(pdfUrl.url);
          return;
        }

        // If it needs to be fetched with token
        if (pdfUrl.token) {
          console.log('PDFViewer: Fetching with token');
          setLoading(true);
          try {
            const response = await axios.get(pdfUrl.url, {
              headers: {
                Authorization: `Bearer ${pdfUrl.token}`
              },
              responseType: 'blob'
            });
            
            // Create a blob URL for the PDF
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);
            console.log('PDFViewer: Created blob URL:', blobUrl);
            setPdfData(blobUrl);
          } catch (err) {
            console.error('PDFViewer: Error fetching PDF:', err);
            setError(`Failed to load PDF: ${err.message}`);
          } finally {
            setLoading(false);
          }
          return;
        }
        
        // If it's a URL without token requirement
        console.log('PDFViewer: Using URL without token');
        setPdfData(pdfUrl.url);
        return;
      }

      // If we reached here, something is wrong with the pdfUrl format
      console.error('PDFViewer: Invalid PDF data format:', pdfUrl);
      setError('Invalid PDF data format');
    };

    fetchPDF();

    // Cleanup function to revoke object URLs
    return () => {
      if (pdfData && typeof pdfData === 'string' && !pdfData.startsWith('http')) {
        console.log('PDFViewer: Revoking blob URL');
        URL.revokeObjectURL(pdfData);
      }
    };
  }, [pdfUrl]);

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 border rounded-lg p-6">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 font-medium">No PDF selected</p>
          <p className="text-gray-400 text-sm mt-1">Please upload or select a PDF to view</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 border rounded-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 border rounded-lg p-6">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-500 font-medium">Error Loading PDF</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!pdfData) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 border rounded-lg p-6">
        <div className="text-center">
          <p className="text-gray-500 font-medium">Processing PDF...</p>
          <p className="text-gray-400 text-sm mt-1">PDF data: {JSON.stringify(pdfUrl).substring(0, 100)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-800 rounded-lg overflow-hidden">
      <div className="flex-1 min-h-[600px]">
        <embed 
          src={pdfData}
          type="application/pdf"
          width="100%"
          height="100%"
          className="h-full"
          style={{ minHeight: '600px', height: '100%' }}
        />
      </div>
    </div>
  );
}

export default PDFViewer;
