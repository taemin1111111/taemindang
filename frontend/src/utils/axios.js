import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// 에뮬레이터: 10.0.2.2 = PC localhost / 실제 기기: 개발 PC의 로컬 IP 필요
// .env.development에 VITE_ANDROID_API_URL=http://your.local.ip:5000 설정 가능
const ANDROID_API_BASE = import.meta.env.VITE_ANDROID_API_URL || 'http://10.0.2.2:5000';
const WEB_API_BASE = import.meta.env.VITE_API_URL || '/api'; // 웹 환경 (개발 프록시, 실제 배포)

// 앱(Android WebView) 환경 여부 및 적절한 baseURL 반환
function getEffectiveBaseURL() {
  if (typeof window === 'undefined') {
    // SSR (서버 사이드 렌더링) 환경 등 window 객체 없을 때
    return WEB_API_BASE;
  }

  try {
    // 1. Capacitor의 직접적인 플랫폼 감지 (가장 신뢰성 높음)
    if (Capacitor?.isNativePlatform?.() && Capacitor.getPlatform() === 'android') {
      return ANDROID_API_BASE;
    }
    // isNativePlatform이 없거나 오류 발생 시 getPlatform만 확인 (폴백)
    if (Capacitor?.getPlatform?.() === 'android') {
      return ANDROID_API_BASE;
    }
  } catch (e) {
    console.warn('Capacitor detection error:', e);
  }

  // 2. 현재 URL 기반 감지 (Capacitor 웹뷰 환경)
  const href = String(window.location?.href || '');
  const origin = String(window.location?.origin || '');
  const { protocol, hostname } = window.location;

  // Capacitor 개발 서버 또는 배포된 앱의 웹뷰 Origin
  if (href.startsWith('capacitor://') || origin.startsWith('capacitor://')) {
    return ANDROID_API_BASE;
  }
  // Vite 개발 서버가 https://localhost로 Capacitor 웹뷰에 로드되는 경우
  if (origin.startsWith('https://localhost') || origin === 'https://localhost') {
    // hostname이 localhost이고 protocol이 https: 또는 capacitor: 일 때
    // 이전에 놓쳤던 부분: Capacitor가 localhost를 로컬로 처리하는 것을 방지하기 위해 여기서도 Android API Base 사용
    if (hostname === 'localhost' && (protocol === 'https:' || protocol === 'capacitor:')) {
      return ANDROID_API_BASE;
    }
  }

  // 기본적으로 웹 환경 (Vite 개발 서버 또는 웹 배포)
  return WEB_API_BASE;
}

const api = axios.create({
  baseURL: getEffectiveBaseURL(), // ★★★ 이 부분에서 baseURL을 조건부로 설정합니다. ★★★
  headers: {
    'Content-Type': 'application/json'
  }
});

// 요청 인터셉터 (baseURL 변경 로직 제거, 헤더 추가만)
api.interceptors.request.use(
  (config) => {
    // 이 로직은 이제 getEffectiveBaseURL()이 제대로 작동하면 필요 없을 수 있지만, 안전을 위해 남겨둡니다.
    // 하지만 대부분의 경우 getEffectiveBaseURL()에서 올바른 baseURL이 설정되므로 이 조건문은 거의 실행되지 않습니다.
    // 현재 백엔드 `server.js`는 `/auth`, `/items` 등으로 직접 라우팅하고 있으므로, `/api` 접두사를 제거하는 로직은 필요 없습니다.
    // 따라서 아래 `config.url` 수정 로직은 제거합니다.
    /*
    if (config.baseURL === ANDROID_API_BASE && typeof config.url === 'string' && config.url.startsWith('/api')) {
      config.url = config.url.replace(/^\/api/, '') || '/';
    }
    */

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

// 응답 인터셉터 (기존 코드 유지)
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

/** API에서 받은 이미지 URL을 환경에 맞게 변환 (Android: localhost → 10.0.2.2) */
export function getImageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const base = getEffectiveBaseURL();
  // Android 환경에서 localhost:5000 → 10.0.2.2:5000 변환
  if (base === ANDROID_API_BASE) {
    return url
      .replace(/http:\/\/localhost:5000/g, ANDROID_API_BASE)
      .replace(/https:\/\/localhost:5000/g, ANDROID_API_BASE);
  }
  return url;
}

export default api;
