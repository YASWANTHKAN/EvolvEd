import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import feedbackService from './feedbackService';

const initialState = {
  feedback: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Submit feedback
export const submitFeedback = createAsyncThunk(
  'feedback/submit',
  async (feedbackData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await feedbackService.submitFeedback(feedbackData, token);
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

// Get user feedback
export const getUserFeedback = createAsyncThunk(
  'feedback/getUserFeedback',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await feedbackService.getUserFeedback(token);
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

export const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitFeedback.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.feedback.push(action.payload);
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getUserFeedback.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserFeedback.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.feedback = action.payload;
      })
      .addCase(getUserFeedback.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset } = feedbackSlice.actions;
export default feedbackSlice.reducer; 