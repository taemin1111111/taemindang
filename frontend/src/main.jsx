import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App.jsx'
import './index.css'

// Capacitor 네이티브(WebView)에서만 풀스크린 레이아웃 오버라이드 적용
if (typeof window !== 'undefined') {
  try {
    if (Capacitor?.isNativePlatform?.()) {
      document.documentElement.classList.add('native-app')
    }
  } catch (_) {
    // noop
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
