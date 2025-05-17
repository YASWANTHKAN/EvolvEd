import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import analyticsService from './analyticsService';

const initialState = {
  analytics: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Get user analytics
export const getUserAnalytics = createAsyncThunk(
  'analytics/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await analyticsService.getUserAnalytics(token);
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

// Update study time
export const updateStudyTime = createAsyncThunk(
  'analytics/updateTime',
  async (studyData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await analyticsService.updateStudyTime(studyData, token);
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

export const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserAnalytics.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.analytics = action.payload;
      })
      .addCase(getUserAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateStudyTime.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateStudyTime.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.analytics = action.payload;
      })
      .addCase(updateStudyTime.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = analyticsSlice.actions;
export default analyticsSlice.reducer; 