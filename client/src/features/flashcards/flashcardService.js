import axios from "axios";
import config from "../../config";

const API_URL = `${config.API_URL}/api/flashcards`;

// Create new flashcard deck
const createDeck = async (deckData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL, deckData, config);
  return response.data;
};

// Get user's flashcard decks
const getDecks = async (token) => {
  const response = await axios.get(`${API_URL}/decks`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// Get single deck
const getDeck = async (deckId, token) => {
  const response = await axios.get(`${API_URL}/decks/${deckId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// Add card to deck
const addCard = async (deckId, cardData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(
    `${API_URL}/decks/${deckId}/cards`,
    cardData,
    config
  );

  return response.data;
};

// Update card in deck
const updateCard = async (deckId, cardId, cardData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(
    `${API_URL}/decks/${deckId}/cards/${cardId}`,
    cardData,
    config
  );

  return response.data;
};

// Delete card from deck
const deleteCard = async (deckId, cardId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(
    `${API_URL}/decks/${deckId}/cards/${cardId}`,
    config
  );

  return response.data;
};

// Delete deck
const deleteDeck = async (deckId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(`${API_URL}/decks/${deckId}`, config);

  return response.data;
};

// Update flashcard study stats
const updateCardStats = async (deckId, cardId, statsData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(
    `${API_URL}/decks/${deckId}/cards/${cardId}/stats`,
    statsData,
    config
  );

  return response.data;
};

const flashcardService = {
  createDeck,
  getDecks,
  getDeck,
  addCard,
  updateCard,
  deleteCard,
  deleteDeck,
  updateCardStats,
};

export default flashcardService;
