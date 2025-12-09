import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosHeaders  } from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL; 
// const BASE_URL = "http://localhost:5000/api"; //perfect working

const TIMEOUT = 15000;

//   console.log("BASE_URL:", BASE_URL);




const statusMessage: Record<number, string> = {
  400: 'Invalid request format.',
  401: 'Invalid API Key / Unauthorized.',
  403: 'Request forbidden.',
  404: 'Resource not found.',
  503: 'Service unavailable. Try later.',
};

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  validateStatus: status => !!status && status >= 200 && status < 501,
});

function getToken(): string | null {
  return localStorage.getItem('TOKEN');
}

export function setToken(token?: string): void {
  if (token) localStorage.setItem('TOKEN', token);
  else localStorage.removeItem('TOKEN');
}

// attach token automatically
instance.interceptors.request.use(
  config => {
    const token = getToken();
    if (token) {
      config.headers = new AxiosHeaders({
  Authorization: `Bearer ${token}`,
});
    }
    return config;
  },
  error => Promise.reject(error)
);

// central response handling
instance.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
);

// unified response handling
function handleResponse<T>(res: AxiosResponse<T>): T {
  if (res.status >= 200 && res.status < 300) return res.data;
  const message = (res.data as any)?.message || statusMessage[res.status] || 'Unexpected error';
  throw { status: res.status, message, data: res.data };
}

// --- THIS IS THE UPDATED FUNCTION ---
function handleAxiosError(error: any): never {
  // 1. Check if it's the custom error we threw from handleResponse
  if (error.status && error.message) {
    throw error;
  }
  
  // 2. Check for an Axios-native error
  if (error.response) {
    throw { 
      status: error.response.status, 
      message: error.response.data?.message || 'Request failed', 
      data: error.response.data 
    };
  }

  // 3. Check for a timeout
  if (error.code === 'ECONNABORTED') {
    throw { message: 'Request timed out', status: 'timeout' };
  }

  // 4. Fallback for true network errors (server down, CORS, etc.)
  throw { message: 'Network error', originalError: error };
}

// API methods
export const api = {
  get: async <T = any>(route: string, config: AxiosRequestConfig = {}): Promise<T> => {
    try {
      const res = await instance.get<T>(route, config);
      return handleResponse(res);
    } catch (e) {
      return handleAxiosError(e);
    }
  },

  post: async <T = any>(route: string, body: any = {}, config: AxiosRequestConfig = {}): Promise<T> => {
    try {
      const res = await instance.post<T>(route, body, {
        headers: { 'Content-Type': 'application/json', ...(config.headers || {}) },
        ...config,
      });
      return handleResponse(res);
    } catch (e) {
      return handleAxiosError(e);
    }
  },

  put: async <T = any>(route: string, body: any = {}, config: AxiosRequestConfig = {}): Promise<T> => {
    try {
      const res = await instance.put<T>(route, body, config);
      return handleResponse(res);
    } catch (e) {
      return handleAxiosError(e);
    }
  },

  patch: async <T = any>(route: string, body: any = {}, config: AxiosRequestConfig = {}): Promise<T> => {
    try {
      const res = await instance.patch<T>(route, body, config);
      return handleResponse(res);
    } catch (e) {
      return handleAxiosError(e);
    }
  },

  delete: async <T = any>(route: string, config: AxiosRequestConfig = {}): Promise<T> => {
    try {
      const res = await instance.delete<T>(route, config);
      return handleResponse(res);
    } catch (e) {
      return handleAxiosError(e);
    }
  },

  postFormData: async <T = any>(route: string, formData: FormData, config: AxiosRequestConfig = {}): Promise<T> => {
    try {
      const res = await instance.post<T>(route, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...(config.headers || {}) },
        ...config,
      });
      return handleResponse(res);
    } catch (e) {
      return handleAxiosError(e);
    }
  },
};

export default api; 