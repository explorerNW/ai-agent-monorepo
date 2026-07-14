import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import permissionReducer from '../store/permissionSlice';

const rootReducer = combineReducers({
  auth: authReducer, // 对应 state.auth
  permission: permissionReducer, // 对应 state.permission
});

export default rootReducer;
