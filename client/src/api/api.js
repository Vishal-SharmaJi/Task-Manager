import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';

    if (error.response?.status === 401) {
      localStorage.removeItem('token');

      if (requestUrl.endsWith('/auth/me')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;