import axios from "axios";
import config from "../../config";

const API_URL = `${config.API_URL}/api/notes/`;

// Create new note
const createNote = async (noteData, token) => {
  console.log("Creating note with data:", noteData);

  const response = await axios.post(API_URL, noteData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log("Note creation response:", response.data);
  return response.data;
};

// Get user notes
const getNotes = async (token) => {
  console.log("Fetching all notes");

  const response = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log(`Fetched ${response.data.length} notes`);
  return response.data;
};

// Get single note
const getNote = async (noteId, token) => {
  console.log("Fetching note with ID:", noteId);

  const response = await axios.get(API_URL + noteId, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log("Fetched note:", response.data);
  return response.data;
};

// Update note
const updateNote = async (noteId, noteData, token) => {
  console.log("Updating note with ID:", noteId);

  const response = await axios.put(API_URL + noteId, noteData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log("Note updated successfully:", response.data);
  return response.data;
};

// Delete note
const deleteNote = async (noteId, token) => {
  console.log("Deleting note with ID:", noteId);

  const response = await axios.delete(API_URL + noteId, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log("Note deleted successfully:", response.data);
  return response.data;
};

const noteService = {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote,
};

export default noteService;
