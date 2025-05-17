import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import flashcardService from "./flashcardService";

const initialState = {
  decks: [],
  deck: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// Create new flashcard deck
export const createDeck = createAsyncThunk(
  "flashcards/createDeck",
  async (deckData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await flashcardService.createDeck(deckData, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get user's flashcard decks
export const getDecks = createAsyncThunk(
  "flashcards/getAll",
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await flashcardService.getDecks(token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single deck
export const getDeck = createAsyncThunk(
  "flashcards/getOne",
  async (deckId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await flashcardService.getDeck(deckId, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Add card to deck
export const addCard = createAsyncThunk(
  "flashcards/addCard",
  async ({ deckId, cardData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await flashcardService.addCard(deckId, cardData, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update card in deck
export const updateCard = createAsyncThunk(
  "flashcards/updateCard",
  async ({ deckId, cardId, cardData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await flashcardService.updateCard(deckId, cardId, cardData, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete card from deck
export const deleteCard = createAsyncThunk(
  "flashcards/deleteCard",
  async ({ deckId, cardId }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await flashcardService.deleteCard(deckId, cardId, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete deck
export const deleteDeck = createAsyncThunk(
  "flashcards/deleteDeck",
  async (deckId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await flashcardService.deleteDeck(deckId, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update flashcard study stats
export const updateCardStats = createAsyncThunk(
  "flashcards/updateCardStats",
  async ({ deckId, cardId, statsData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await flashcardService.updateCardStats(
        deckId,
        cardId,
        statsData,
        token
      );
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const flashcardSlice = createSlice({
  name: "flashcard",
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDeck.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createDeck.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.decks.push(action.payload);
      })
      .addCase(createDeck.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getDecks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDecks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.decks = action.payload;
      })
      .addCase(getDecks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getDeck.pending, (state) => {
        state.isLoading = true;
        state.deck = null;
      })
      .addCase(getDeck.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.deck = action.payload;
      })
      .addCase(getDeck.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(addCard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addCard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.deck = action.payload;

        // Update the deck in the decks array
        const index = state.decks.findIndex(
          (deck) => deck._id === action.payload._id
        );
        if (index !== -1) {
          state.decks[index] = action.payload;
        }
      })
      .addCase(addCard.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateCard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.deck = action.payload;

        // Update the deck in the decks array
        const index = state.decks.findIndex(
          (deck) => deck._id === action.payload._id
        );
        if (index !== -1) {
          state.decks[index] = action.payload;
        }
      })
      .addCase(updateCard.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteCard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteCard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.deck = action.payload;

        // Update the deck in the decks array
        const index = state.decks.findIndex(
          (deck) => deck._id === action.payload._id
        );
        if (index !== -1) {
          state.decks[index] = action.payload;
        }
      })
      .addCase(deleteCard.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteDeck.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteDeck.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.decks = state.decks.filter(
          (deck) => deck._id !== action.payload.id
        );
        if (state.deck && state.deck._id === action.payload.id) {
          state.deck = null;
        }
      })
      .addCase(deleteDeck.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateCardStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.deck = action.payload;

        // Update the deck in the decks array
        const index = state.decks.findIndex(
          (deck) => deck._id === action.payload._id
        );
        if (index !== -1) {
          state.decks[index] = action.payload;
        }
      })
      .addCase(updateCardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = flashcardSlice.actions;
export default flashcardSlice.reducer;
