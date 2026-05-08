import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { saveToken, clearToken, getToken } from "@/src/utils/token";
import type { RootState } from "@/src/store";

interface AuthUser {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  tajikPassportVerified: boolean;
  driverLicenseVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Helper to get user from local storage
const getStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("auth_user");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: getStoredUser(),
  token: getToken(),
  isAuthenticated: !!getToken(),
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      saveToken(action.payload.token);
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_user", JSON.stringify(action.payload.user));
      }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      clearToken();
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_user");
      }
    },
    updateUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_user", JSON.stringify(action.payload));
      }
    }
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectToken = (state: RootState) => state.auth.token;
