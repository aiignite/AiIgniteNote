import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { apiClient } from "../lib/api/client";
import { authApi } from "../lib/api/auth";

interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  requirePasswordChange?: boolean; // 是否需要修改密码
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean; // 标记是否已完成从存储的恢复

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    username?: string;
    displayName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  _setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          const { user, tokens } = response.data;

          apiClient.setTokens(tokens.accessToken, tokens.refreshToken);

          set({
            user,
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const { user, tokens } = response.data;

          apiClient.setTokens(tokens.accessToken, tokens.refreshToken);

          set({
            user,
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          const { refreshToken } = get();
          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          apiClient.clearTokens();
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      refreshUser: async () => {
        try {
          const response = await authApi.getCurrentUser();
          set({ user: response.data, isAuthenticated: true });
        } catch (error: any) {
          // Token might be expired or invalid, clear auth state
          console.warn(
            "Failed to refresh user:",
            error?.response?.data || error.message,
          );
          apiClient.clearTokens();
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      updateUser: async (data: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...data };
          set({ user: updatedUser });
        }
      },

      changePassword: async (oldPassword: string, newPassword: string) => {
        try {
          await authApi.changePassword({ currentPassword: oldPassword, newPassword });
          // 更新用户状态，移除需要修改密码的标记
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: { ...currentUser, requirePasswordChange: false }
            });
          }
        } catch (error: any) {
          throw error;
        }
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        apiClient.setTokens(accessToken, refreshToken);
        set({
          token: accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      _setHasHydrated: (state: boolean) => {
        set({
          _hasHydrated: state,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        console.log("auth-storage 已恢复, state:", state);
        // 标记为已恢复
        state?._setHasHydrated(true);

        // 如果有 token,设置到 apiClient
        if (state?.token) {
          apiClient.setTokens(state.token, state.refreshToken || "");
        }
      },
    },
  ),
);
