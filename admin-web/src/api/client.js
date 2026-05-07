import axios from 'axios';
import { useAuth } from '../store/auth';

const api = axios.create({
  baseURL: '/api',
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      useAuth.getState().logout();
    }
    return Promise.reject(err);
  },
);

export default api;
