import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface UserInfo {
  id: string;
  name: string;
  role: "admin" | "editor" | "viewer";
}

interface AuthState {
  token: string | null;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  // 初始化时尝试从本地读取 token，防止刷新页面后状态丢失
  token: localStorage.getItem("token"),
  userInfo: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // 登录成功，保存用户信息和 Token
    loginSuccess: (
      state,
      action: PayloadAction<{ token: string; user: UserInfo }>,
    ) => {
      state.token = action.payload.token;
      state.userInfo = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem("token", action.payload.token);
    },
    // 登出清理状态
    logout: (state) => {
      state.token = null;
      state.userInfo = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
