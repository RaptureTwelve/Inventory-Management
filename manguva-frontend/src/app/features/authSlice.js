import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk for token verification
export const verifyAuth = createAsyncThunk(
  'auth/verify',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/auth/verify');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Enhanced login thunk
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post('/login', credentials);
      localStorage.setItem('accessToken', response.data.access);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Enhanced logout thunk
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      localStorage.removeItem('accessToken');
      window.location.href = "/login";
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  theme: localStorage.getItem('theme') || 'light', 
  role: 1
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    clearAuthState: (state) => {
      Object.assign(state, initialState);
      localStorage.removeItem('accessToken');
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.role = action.payload.user.role === "admin" ? 2 : 1;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Verify auth cases
      .addCase(verifyAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.role = action.payload.user.role === "admin" ? 2 : 1;
      })
      .addCase(verifyAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        localStorage.removeItem('accessToken');
      })
      
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        Object.assign(state, initialState);
      });
  },
});

export const { setTheme, clearAuthState } = authSlice.actions;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectCurrentTheme = (state) => state.auth.theme; 

export default authSlice.reducer;