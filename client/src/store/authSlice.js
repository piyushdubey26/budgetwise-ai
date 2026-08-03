import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('token') || null;
const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

const initialState = {
  token,
  user,
  adminViewMode: user?.role === 'admin' ? 'admin' : 'personal',
  settings: {
    currency: 'INR',
    theme: 'dark',
    language: 'en',
    timezone: 'Asia/Kolkata',
    notificationsEnabled: true
  },
  isAuthenticated: !!token,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (state, action) => {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.adminViewMode = action.payload.user?.role === 'admin' ? 'admin' : 'personal';
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    authFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.adminViewMode = 'personal';
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    loadProfile: (state, action) => {
      state.user = action.payload.user;
      state.settings = action.payload.settings;
      if (!state.adminViewMode) {
        state.adminViewMode = action.payload.user?.role === 'admin' ? 'admin' : 'personal';
      }
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    updateLocalSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    upgradePremiumSuccess: (state, action) => {
      if (state.user) {
        state.user.isPremium = true;
        state.user.coins = action.payload.coins || state.user.coins;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    addCoinsXP: (state, action) => {
      if (state.user) {
        state.user.xp = (state.user.xp || 0) + (action.payload.xp || 0);
        state.user.coins = (state.user.coins || 0) + (action.payload.coins || 0);
        state.user.level = Math.floor(state.user.xp / 100) + 1;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    setAdminViewMode: (state, action) => {
      state.adminViewMode = action.payload;
    }
  }
});

export const {
  authStart,
  authSuccess,
  authFailure,
  logout,
  loadProfile,
  updateLocalSettings,
  upgradePremiumSuccess,
  addCoinsXP,
  setAdminViewMode
} = authSlice.actions;

export default authSlice.reducer;
