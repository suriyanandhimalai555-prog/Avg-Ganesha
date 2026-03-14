import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../../services/auth.service';
import * as authStorage from '../../services/authStorage';

// --- Load initial state from storage ---
const loadState = () => {
  const token = authStorage.getToken();
  const user = authStorage.getUser();
  if (token && user) {
    return { user, token, isAuthenticated: true, loading: false, error: null };
  }
  return { user: null, token: null, isAuthenticated: false, loading: false, error: null };
};

// --- Async thunks (single source for auth API) ---
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await authService.login(email, password);
      authStorage.setAuth({ token: data.token, user: data.user });
      return data;
    } catch (err) {
      const msg =
        err.response?.data?.error || err.response?.data?.message || 'Login failed';
      return rejectWithValue(msg);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ fullName, email, phone, password, inviteCode }, { rejectWithValue }) => {
    try {
      const data = await authService.register({
        fullName,
        email,
        phone,
        password,
        inviteCode: inviteCode || undefined,
      });
      authStorage.setAuth({ token: data.token, user: data.user });
      return data;
    } catch (err) {
      const msg =
        err.response?.data?.error || err.response?.data?.message || 'Registration failed';
      return rejectWithValue(msg);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: loadState(),
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.error = null;
      authStorage.setAuth({ token, user });
    },
    logout: (state) => {
      authStorage.clearAuth();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      authStorage.setAuth({ token: state.token, user: state.user });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, updateUser, setCredentials } = authSlice.actions;
export default authSlice.reducer;
