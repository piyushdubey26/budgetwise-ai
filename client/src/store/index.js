import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import financeReducer from './financeSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    finance: financeReducer
  }
});
