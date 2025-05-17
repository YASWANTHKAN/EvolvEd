import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import PDFUploader from '../components/PDFUploader';



function Notes() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (criteria) => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortOrder('asc');
    }
  };

  const handleCreateNote = () => {
    setIsEditorOpen(true);
  };

  const handlePDFSelect = (file) => {
    setSelectedPDF(file);
  };

  const filteredNotes = [
    { id: 1, title: "React Fundamentals", content: "Components, props, state, hooks, and more.", updatedAt: new Date(Date.now() - 3600000 * 24).toISOString() },
    { id: 2, title: "JavaScript ES6+", content: "Modern JavaScript features: arrow functions, destructuring, spread operator, async/await.", updatedAt: new Date(Date.now() - 3600000 * 48).toISOString() },
    { id: 3, title: "MongoDB Basics", content: "NoSQL database concepts, CRUD operations, and integration with Node.js.", updatedAt: new Date(Date.now() - 3600000 * 72).toISOString() }
  ].filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortOrder === 'asc') {
      return a[sortBy] > b[sortBy] ? 1 : -1;
    } else {
      return a[sortBy] < b[sortBy] ? 1 : -1;
    }
  });

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Notes</h1>
          <button
            onClick={handleCreateNote}
            className="bg-custom text-white rounded-md px-4 py-2 text-base font-medium inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Note
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          />
        </div>

        <div className="mb-8">
          <PDFUploader onPDFSelect={handlePDFSelect} />
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-4">
            <button
              onClick={() => handleSort('title')}
              className={`text-gray-700 dark:text-gray-300 hover:text-custom ${sortBy === 'title' ? 'font-bold' : ''}`}
            >
              Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('updatedAt')}
              className={`text-gray-700 dark:text-gray-300 hover:text-custom ${sortBy === 'updatedAt' ? 'font-bold' : ''}`}
            >
              Updated {sortBy === 'updatedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map(note => (
            <div key={note.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{note.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                {note.content}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Updated {new Date(note.updatedAt).toLocaleString()}</span>
                <Link to={`/notes/${note.id}`} className="text-custom text-sm font-medium">View Note</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Edit Note</h2>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <PDFViewer pdfUrl={selectedPDF} />
              </div>
              <div>
                <NoteEditor onPDFSelect={handlePDFSelect} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notes;
