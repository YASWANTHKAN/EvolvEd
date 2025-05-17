import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';

function TestPDFAccess() {
  const [testId, setTestId] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const testUrls = async () => {
    if (!testId) {
      setTestResults([{ path: 'ERROR', status: 'Please enter a PDF ID to test' }]);
      return;
    }

    setLoading(true);
    setTestResults([]);
    
    // Test URLs we want to check
    const urlsToTest = [
      { path: `/api/pdf/${testId}`, description: 'API endpoint (should work)' },
    ];

    const results = [];
    
    for (const urlInfo of urlsToTest) {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${config.API_URL}${urlInfo.path}`, {
          responseType: 'blob',
          timeout: 5000 // 5 second timeout
        });
        const endTime = Date.now();
        
        results.push({
          path: urlInfo.path,
          status: `SUCCESS (${response.status})`,
          time: `${endTime - startTime}ms`,
          size: `${(response.data.size / 1024).toFixed(2)} KB`,
          description: urlInfo.description,
          success: true
        });
      } catch (error) {
        results.push({
          path: urlInfo.path,
          status: `FAILED (${error.response?.status || 'Network Error'})`,
          error: error.message,
          description: urlInfo.description,
          success: false
        });
      }
    }
    
    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <h3 className="text-lg font-medium mb-3">PDF Access Debugger</h3>
      
      <div className="flex mb-4">
        <input
          type="text"
          value={testId}
          onChange={(e) => setTestId(e.target.value)}
          placeholder="Enter PDF ID to test"
          className="flex-grow p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={testUrls}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Access'}
        </button>
      </div>
      
      {testResults.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Results:</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-2 px-4 border-b text-left">URL Path</th>
                  <th className="py-2 px-4 border-b text-left">Description</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result, index) => (
                  <tr key={index} className={result.success ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}>
                    <td className="py-2 px-4 border-b font-mono text-sm">{result.path}</td>
                    <td className="py-2 px-4 border-b text-sm">{result.description}</td>
                    <td className="py-2 px-4 border-b text-sm">{result.status}</td>
                    <td className="py-2 px-4 border-b text-sm">
                      {result.time && <span className="mr-3">Time: {result.time}</span>}
                      {result.size && <span>Size: {result.size}</span>}
                      {result.error && <span className="text-red-500">{result.error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>If API access fails, check that the PDF ID is correct and the file exists on the server.</p>
      </div>
    </div>
  );
}

export default TestPDFAccess; 