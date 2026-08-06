import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || '/api';
const baseURL = rawBaseURL.endsWith('/api')
  ? rawBaseURL
  : rawBaseURL.replace(/\/$/, '') + '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Attach Bearer token fallback header if JWT token exists in local storage.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Format API response errors into consistent Error objects.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = error.response?.data?.message;

    if (!message) {
      const status = error.response?.status;
      if (!error.response || error.code === 'ERR_NETWORK' || status === 502 || status === 504) {
        message = 'Unable to connect to the backend server. Please verify that the server is running.';
      } else {
        message = 'An unexpected error occurred. Please try again.';
      }
    }
    
    const formattedError = new Error(message);
    formattedError.status = error.response?.status || 500;
    formattedError.data = error.response?.data || null;

    return Promise.reject(formattedError);
  }
);

export default api;
