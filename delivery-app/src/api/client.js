import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuth } from '../store/auth';

function resolveBaseUrl() {
  const configured = Constants.expoConfig?.extra?.API_URL || Constants.manifest?.extra?.API_URL;

  // If app.json has an explicit API_URL (e.g. your LAN IP), trust it for all platforms.
  // This is what works on real phones via Expo Go.
  if (configured) return `${configured.replace(/\/$/, '')}/api`;

  if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api'; // Android emulator
  return 'http://localhost:5000/api';
}

export const BASE_URL = resolveBaseUrl();
export const ROOT_URL = BASE_URL.replace(/\/api$/, '');

const api = axios.create({ baseURL: BASE_URL, timeout: 20_000 });

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) useAuth.getState().logout();
    return Promise.reject(err);
  },
);

export default api;
