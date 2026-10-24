import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động đính kèm JWT Bearer token vào Header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nhathuoc_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý lỗi tập trung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ: Không chuyển hướng nếu đang ở trang login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('nhathuoc_token');
        localStorage.removeItem('nhathuoc_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
