// 用户相关类型
export interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  preferences?: any;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
