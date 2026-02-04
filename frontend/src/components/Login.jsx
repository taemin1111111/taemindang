import { useState } from 'react';
import axios from 'axios';
import './Login.css';

// Figma 이미지 URL
const imgIconClose = "https://www.figma.com/api/mcp/asset/7b5eba5e-c24d-4557-a0e9-8958985190c9";
const imgAlertFill = "https://www.figma.com/api/mcp/asset/e86115e9-3add-471c-9fe7-5f9f088ae0b8";

function Login({ onClose, onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

  // 이메일 형식 검증
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 입력 중에는 에러 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLogin = async () => {
    const newErrors = {
      email: '',
      password: ''
    };

    // 이메일 검증
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '올바른 이메일 형식으로 입력해주세요';
    }

    // 비밀번호 검증
    if (!formData.password.trim()) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자리 이상으로 입력해주세요';
    }

    setErrors(newErrors);

    // 모든 필드가 채워져 있고 검증 통과하면 로그인 API 호출
    if (!newErrors.email && !newErrors.password) {
      try {
        const response = await axios.post('/api/auth/login', {
          email: formData.email.trim(),
          password: formData.password
        });

        if (response.data.success) {
          // 로그인 성공
          const { token, ...userData } = response.data.data;
          
          // JWT 토큰을 localStorage에 저장
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          
          // neighborhood 확인하여 화면 전환
          if (onLoginSuccess) {
            onLoginSuccess(userData.neighborhood);
          } else {
            alert('로그인 성공!');
          }
        }
      } catch (error) {
        console.error('로그인 오류:', error);
        if (error.response && error.response.data && error.response.data.message) {
          // 서버에서 보낸 에러 메시지를 화면 중앙 알림으로 표시
          const errorMessage = error.response.data.message;
          alert(errorMessage);
        } else {
          alert('로그인 중 오류가 발생했습니다.');
        }
      }
    }
  };

  return (
    <div className="mobile-container">
      <div className="login-screen">
        {/* 네비게이션 바 */}
        <div className="nav-bar">
          <div className="nav-content">
            <div className="nav-left">
              <button className="close-btn" onClick={onClose}>
                <img alt="close" src={imgIconClose} className="close-icon" />
              </button>
            </div>
            <div className="nav-title">
              <h1>로그인</h1>
            </div>
            <div className="nav-right"></div>
          </div>
        </div>

        {/* 입력 폼 */}
        <div className="login-form">
          <div className="input-group">
            <label className="input-label">이메일</label>
            <div className={`input-field ${errors.email ? 'input-field-error' : ''}`}>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="이메일을 입력해주세요"
                className="input-text"
              />
            </div>
            {errors.email && (
              <div className="error-message">
                <img alt="alert" src={imgAlertFill} className="error-icon" />
                <p className="error-text">{errors.email}</p>
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">비밀번호</label>
            <div className={`input-field ${errors.password ? 'input-field-error' : ''}`}>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="비밀번호를 입력해주세요"
                className="input-text"
              />
            </div>
            {errors.password && (
              <div className="error-message">
                <img alt="alert" src={imgAlertFill} className="error-icon" />
                <p className="error-text">{errors.password}</p>
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="login-footer">
          <div className="button-section">
            <button className="btn-login" onClick={handleLogin}>
              <span>로그인</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
