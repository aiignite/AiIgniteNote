import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// 自动检测 API Base URL
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // 如果环境变量设置为 'auto' 或未设置，则自动检测
  if (!envUrl || envUrl === 'auto') {
    // 获取当前页面的 host 和 port
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // 如果是 localhost 或 127.0.0.1，使用默认的 3001 端口
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }

    // 否则使用当前页面的 hostname，但端口改为 3001
    return `${protocol}//${hostname}:3001`;
  }

  // 否则使用环境变量中配置的地址
  return envUrl;
}

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.refreshToken) {
            try {
              const response = await this.post('/auth/refresh', { refreshToken: this.refreshToken });
              const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;

              this.setTokens(accessToken, newRefreshToken);

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            } catch (refreshError) {
              // Refresh failed, clear tokens
              this.clearTokens();
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          } else {
            this.clearTokens();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );

    // Load tokens from localStorage
    this.loadTokens();
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  get isAuthenticated() {
    return !!this.accessToken;
  }

  async get(url: string, config?: any) {
    return this.client.get(url, config);
  }

  async post(url: string, data?: any, config?: any) {
    return this.client.post(url, data, config);
  }

  async put(url: string, data?: any, config?: any) {
    return this.client.put(url, data, config);
  }

  async patch(url: string, data?: any, config?: any) {
    return this.client.patch(url, data, config);
  }

  async delete(url: string, config?: any) {
    return this.client.delete(url, config);
  }
}

export const apiClient = new ApiClient();
