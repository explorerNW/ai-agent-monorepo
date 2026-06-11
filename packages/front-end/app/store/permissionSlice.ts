import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// 假设这是从后端获取权限数据的接口
// export const fetchPermissions = createAsyncThunk('permission/fetch', async () => { ... });

interface PermissionState {
  perms: string[]; // 按钮级权限标识列表，如 ['user:add', 'order:view']
  menus: any[]; // 动态生成的菜单数据
  loading: boolean;
}

const initialState: PermissionState = {
  perms: [],
  menus: [],
  loading: false,
};

const permissionSlice = createSlice({
  name: "permission",
  initialState,
  reducers: {
    // 同步设置权限标识
    setPerms: (state, action: PayloadAction<string[]>) => {
      state.perms = action.payload;
    },
    // 同步设置菜单数据
    setMenus: (state, action: PayloadAction<any[]>) => {
      state.menus = action.payload;
    },
    // 重置权限（登出时调用）
    clearPermissions: (state) => {
      state.perms = [];
      state.menus = [];
    },
  },
  // 如果使用 createAsyncThunk 处理异步请求，可以在 extraReducers 中监听生命周期
  /*
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => { state.loading = true; })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.menus = action.payload.menus;
        state.perms = action.payload.perms;
      });
  },
  */
});

export const { setPerms, setMenus, clearPermissions } = permissionSlice.actions;
export default permissionSlice.reducer;
