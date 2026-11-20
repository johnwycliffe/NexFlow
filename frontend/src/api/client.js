import axios from 'axios';

// Base API configuration mirroring future FastAPI backend
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach auth headers or active role simulation headers
apiClient.interceptors.request.use(
  (config) => {
    const activeRole = localStorage.getItem('nexflow_active_role') || 'Administrator';
    config.headers['X-ERP-Role'] = activeRole;
    config.headers['X-ERP-Tenant'] = 'MFG-PLANT-01';
    
    // In demo/mock mode, we can log or decorate
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;

