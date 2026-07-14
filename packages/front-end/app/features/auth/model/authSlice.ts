import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { queryClient } from '~/queryClient';

interface AuthState {
  token: string | null;
  userPreferences: { theme: 'light' | 'dark'; sidebarCollapsed: boolean };
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  userPreferences: { theme: 'light', sidebarCollapsed: false },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);
    },
    logout(state) {
      state.token = null;
      localStorage.removeItem('token');
      // ✅ 登出时清除所有服务端缓存
      queryClient.clear();
    },
    toggleSidebar(state) {
      state.userPreferences.sidebarCollapsed = !state.userPreferences.sidebarCollapsed;
    },
  },
});

export const authActions = authSlice.actions;
export default authSlice.reducer;
