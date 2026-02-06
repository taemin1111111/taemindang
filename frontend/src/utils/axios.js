import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const ANDROID_API_BASE = 'http://10.0.2.2:5000';

// 앱(Android WebView)인지: 요청 시점에 매번 확인
function isAndroidApp() {
  if (typeof window === 'undefined' || !window.location) return false;
  try {
    if (Capacitor?.isNativePlatform?.() && Capacitor.getPlatform() === 'android') return true;
  } catch (_) {}
  const { protocol, hostname } = window.location;
  if (hostname === 'localhost' && (protocol === 'https:' || protocol === 'capacitor:')) return true;
  if (String(window.location.origin || '').startsWith('capacitor://')) return true;
  return false;
}

const defaultBaseURL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({
  baseURL: defaultBaseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 요청 직전에 앱이면 10.0.2.2로 보내기 (Capacitor가 localhost를 로컬로 잡아서 네트워크 요청이 안 나감)
api.interceptors.request.use(
  (config) => {
    if (isAndroidApp()) {
      config.baseURL = ANDROID_API_BASE;
      if (typeof config.url === 'string' && config.url.startsWith('/api')) {
        config.url = config.url.replace(/^\/api/, '') || '/';
      }
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FormData인 경우 Content-Type을 자동으로 설정하지 않음 (브라우저가 자동 설정)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 토큰 만료 시 처리
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 또는 인증 실패
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 로그인 페이지로 리다이렉트 (필요시)
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
