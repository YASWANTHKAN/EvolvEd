import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getNote, updateNote, deleteNote, reset } from '../features/notes/noteSlice';
import { toast } from 'react-toastify';

function NotePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const { note, isLoading, isError, message } = useSelector((state) => state.notes);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch the note data based on the ID from the URL
    dispatch(getNote(id));

    // Handle errors
    if (isError) {
      toast.error(message || 'Failed to load note');
    }
    
    // Reset editing state when note changes
    return () => {
      setIsEditing(false);
    };
  }, [user, navigate, id, dispatch, isError, message]);
  
  useEffect(() => {
    if (note) {
      setEditTitle(note.title);
      setEditContent(note.content);
    }
  }, [note]);

  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original note content
    if (note) {
      setEditTitle(note.title);
      setEditContent(note.content);
    }
  };
  
  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }
    
    if (!editContent.trim()) {
      toast.error('Content cannot be empty');
      return;
    }
    
    try {
      await dispatch(updateNote({ 
        noteId: id, 
        noteData: {
          title: editTitle,
          content: editContent
        }
      })).unwrap();
      
      toast.success('Note updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update note: ' + (error.message || 'Unknown error'));
    }
  };
  
  const handleDeleteClick = () => {
    setIsDeleting(true);
  };
  
  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteNote(id)).unwrap();
      toast.success('Note deleted successfully');
      navigate('/notes');
    } catch (error) {
      toast.error('Failed to delete note: ' + (error.message || 'Unknown error'));
      setIsDeleting(false);
    }
  };
  
  const handleCancelDelete = () => {
    setIsDeleting(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading note...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <div className="text-center text-red-500">
          <p>Error loading note: {message}</p>
          <button 
            onClick={() => navigate('/notes')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Back to Notes
          </button>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <div className="text-center text-gray-500">
          <p>Note not found</p>
          <button 
            onClick={() => navigate('/notes')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Back to Notes
          </button>
        </div>
      </div>
    );
  }

  // Delete confirmation modal
  if (isDeleting) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Delete Note</h2>
          <p className="mb-6">Are you sure you want to delete this note? This action cannot be undone.</p>
          <div className="flex justify-end space-x-3">
            <button 
              onClick={handleCancelDelete}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate('/notes')}
          className="inline-flex items-center text-gray-700 dark:text-gray-300 hover:text-custom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Notes
        </button>
        <div className="flex space-x-2">
          <button 
            onClick={handleEditClick}
            className="inline-flex items-center bg-custom text-white rounded-md px-4 py-2 text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit
          </button>
          <button 
            onClick={handleDeleteClick}
            className="inline-flex items-center bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        {!isEditing ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{note.title}</h1>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                <span>Created: {new Date(note.createdAt).toLocaleString()}</span>
                <span>Updated: {new Date(note.updatedAt).toLocaleString()}</span>
              </div>
            </div>
            
            {/* Note content - would use a Markdown renderer in a complete implementation */}
            <div className="prose dark:prose-invert max-w-none">
              {note.content && note.content.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('# ')) {
                  return <h1 key={idx} className="text-2xl font-bold mt-6 mb-4">{paragraph.substring(2)}</h1>;
                } else if (paragraph.startsWith('## ')) {
                  return <h2 key={idx} className="text-xl font-bold mt-5 mb-3">{paragraph.substring(3)}</h2>;
                } else if (paragraph.startsWith('### ')) {
                  return <h3 key={idx} className="text-lg font-bold mt-4 mb-2">{paragraph.substring(4)}</h3>;
                } else {
                  return <p key={idx} className="mb-4">{paragraph}</p>;
                }
              })}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content
              </label>
              <textarea
                id="content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={15}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotePage;
