import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { AppConfig } from '../config/app.config';
import { ContentType, HttpRequestConfig } from './http.types';

export interface IBaseRepository {
  get<T>(url: string, config?: HttpRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>;
  delete<T>(url: string, config?: HttpRequestConfig): Promise<T>;
}

export class BaseRepository implements IBaseRepository {
  protected client: AxiosInstance;
  private basePath: string;

  constructor(basePath: string = '', contentType: ContentType = 'application/json') {
    this.basePath = basePath;

    this.client = axios.create({
      baseURL: AppConfig.api.baseURL,
      timeout: AppConfig.api.timeout,
      withCredentials: AppConfig.api.withCredentials,
      headers: {
        'Content-Type': contentType,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          this.handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    const storage = AppConfig.auth.storageType === 'localStorage' ? localStorage : sessionStorage;
    return storage.getItem(AppConfig.auth.tokenKey);
  }

  private handleAuthError(): void {
    const storage = AppConfig.auth.storageType === 'localStorage' ? localStorage : sessionStorage;
    storage.removeItem(AppConfig.auth.tokenKey);
    window.location.href = AppConfig.auth.loginPath;
  }

  private buildUrl(url: string): string {
    return this.basePath ? `${this.basePath}${url}` : url;
  }

  private buildAxiosConfig(config?: HttpRequestConfig): AxiosRequestConfig {
    const axiosConfig: AxiosRequestConfig = {};

    if (config?.params) {
      axiosConfig.params = config.params;
    }

    if (config?.headers || config?.contentType) {
      axiosConfig.headers = {
        ...config?.headers,
      };
      if (config?.contentType) {
        axiosConfig.headers['Content-Type'] = config.contentType;
      }
    }

    return axiosConfig;
  }

  async get<T>(url: string, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.get<T>(this.buildUrl(url), this.buildAxiosConfig(config));
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.post<T>(this.buildUrl(url), data, this.buildAxiosConfig(config));
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.put<T>(this.buildUrl(url), data, this.buildAxiosConfig(config));
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(this.buildUrl(url), data, this.buildAxiosConfig(config));
    return response.data;
  }

  async delete<T>(url: string, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(this.buildUrl(url), this.buildAxiosConfig(config));
    return response.data;
  }
}
