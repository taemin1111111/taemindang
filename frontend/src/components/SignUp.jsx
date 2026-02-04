import { useState } from 'react';
import axios from 'axios';
import './SignUp.css';

// Figma 이미지 URL
const imgIconClose = "https://www.figma.com/api/mcp/asset/f40f048d-59b3-4cbe-a94f-72af916deb30";
const imgEyeOpen = "https://www.figma.com/api/mcp/asset/9b165761-342e-4c20-8edd-fd885ed837ac";
const imgEyeClose = "https://www.figma.com/api/mcp/asset/284b93d0-cd4f-452a-9dee-4d2c88f1711a";
const imgAlertFill = "https://www.figma.com/api/mcp/asset/d40eae40-1337-4ab7-b75a-068cfba2bc43";

function SignUp({ onClose, onSignUpSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    nickname: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    nickname: ''
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

    // 실시간 검증 (비밀번호, 비밀번호 확인만)
    if (name === 'password') {
      if (value.trim() && value.length < 8) {
        setErrors(prev => ({
          ...prev,
          password: '비밀번호는 8자리 이상으로 입력해주세요'
        }));
      } else if (value.trim() && value.length >= 8) {
        setErrors(prev => ({
          ...prev,
          password: ''
        }));
        // 비밀번호가 변경되면 비밀번호 확인도 다시 체크
        if (formData.passwordConfirm) {
          if (value !== formData.passwordConfirm) {
            setErrors(prev => ({
              ...prev,
              passwordConfirm: '비밀번호가 일치 하지 않습니다.'
            }));
          } else {
            setErrors(prev => ({
              ...prev,
              passwordConfirm: ''
            }));
          }
        }
      } else {
        setErrors(prev => ({
          ...prev,
          password: ''
        }));
      }
    } else if (name === 'passwordConfirm') {
      if (value.trim() && value !== formData.password) {
        setErrors(prev => ({
          ...prev,
          passwordConfirm: '비밀번호가 일치 하지 않습니다.'
        }));
      } else if (value.trim() && value === formData.password) {
        setErrors(prev => ({
          ...prev,
          passwordConfirm: ''
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          passwordConfirm: ''
        }));
      }
    } else {
      // 이메일, 닉네임은 입력 중에는 에러 제거 (회원가입 버튼 클릭 시에만 검증)
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  const handleSignUp = async () => {
    const newErrors = {
      email: '',
      password: '',
      passwordConfirm: '',
      nickname: ''
    };

    // 이메일 검증 (회원가입 버튼 클릭 시)
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '올바른 이메일 형식으로 입력해주세요';
    }

    // 비밀번호 검증 (회원가입 버튼 클릭 시)
    if (!formData.password.trim()) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자리 이상으로 입력해주세요';
    }

    // 비밀번호 확인 검증 (회원가입 버튼 클릭 시)
    if (!formData.passwordConfirm.trim()) {
      newErrors.passwordConfirm = '비밀번호를 입력해주세요';
    } else if (formData.passwordConfirm !== formData.password) {
      newErrors.passwordConfirm = '비밀번호가 일치 하지 않습니다.';
    }

    // 닉네임 검증 (회원가입 버튼 클릭 시)
    if (!formData.nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요';
    }

    setErrors(newErrors);

    // 모든 필드가 채워져 있고 검증 통과하면 이메일 중복 확인 후 회원가입 진행
    if (!newErrors.email && !newErrors.password && !newErrors.passwordConfirm && !newErrors.nickname) {
      try {
        // 1. 먼저 이메일 중복 확인
        const emailCheckResponse = await axios.post('/api/auth/check-email', {
          email: formData.email.trim()
        });

        if (emailCheckResponse.data.isDuplicate) {
          // 이메일 중복이면 에러 메시지 표시하고 회원가입 API 호출 안 함
          setErrors(prev => ({
            ...prev,
            email: '중복된 이메일입니다'
          }));
          return;
        }

        // 2. 이메일 중복이 아니면 회원가입 진행
        const response = await axios.post('/api/auth/signup', {
          email: formData.email.trim(),
          password: formData.password,
          nickname: formData.nickname.trim()
        });

        if (response.data.success) {
          alert('회원가입이 완료되었습니다!');
          // 회원가입 성공 후 로그인 화면으로 이동
          if (onSignUpSuccess) {
            onSignUpSuccess();
          } else {
          onClose();
          }
        }
      } catch (error) {
        console.error('회원가입 오류:', error);
        
        // 서버에서 보낸 에러 메시지 처리
        if (error.response && error.response.data && error.response.data.message) {
          // 이메일 중복 확인 API 오류
          if (error.response.config.url.includes('/check-email')) {
            if (error.response.data.isDuplicate) {
              setErrors(prev => ({
                ...prev,
                email: '중복된 이메일입니다'
              }));
            } else {
              alert(error.response.data.message || '이메일 중복 확인 중 오류가 발생했습니다.');
            }
          } else {
            // 회원가입 API 오류
            alert(error.response.data.message || '회원가입 중 오류가 발생했습니다.');
          }
        } else {
          alert('회원가입 중 오류가 발생했습니다.');
        }
      }
    }
  };

  return (
    <div className="mobile-container">
      <div className="signup-screen">
        {/* 네비게이션 바 */}
        <div className="nav-bar">
          <div className="nav-content">
            <div className="nav-left">
              <button className="close-btn" onClick={onClose}>
                <img alt="close" src={imgIconClose} className="close-icon" />
              </button>
            </div>
            <div className="nav-title">
              <h1>회원가입</h1>
            </div>
            <div className="nav-right"></div>
          </div>
        </div>

        {/* 입력 폼 */}
        <div className="signup-form">
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
            <div className={`input-field password-field ${errors.password ? 'input-field-error' : ''}`}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="비밀번호를 입력해주세요"
                className="input-text"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                <img
                  alt={showPassword ? "hide" : "show"}
                  src={showPassword ? imgEyeClose : imgEyeOpen}
                  className="eye-icon"
                />
              </button>
            </div>
            {errors.password && (
              <div className="error-message">
                <img alt="alert" src={imgAlertFill} className="error-icon" />
                <p className="error-text">{errors.password}</p>
              </div>
            )}
            {!errors.password && formData.password && formData.password.length >= 8 && (
              <p className="input-hint">비밀번호는 8자리 이상으로 입력해주세요</p>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">비밀번호 확인</label>
            <div className={`input-field password-field ${errors.passwordConfirm ? 'input-field-error' : ''}`}>
              <input
                type={showPasswordConfirm ? "text" : "password"}
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleInputChange}
                placeholder="비밀번호를 다시 입력해주세요"
                className="input-text"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              >
                <img
                  alt={showPasswordConfirm ? "hide" : "show"}
                  src={showPasswordConfirm ? imgEyeClose : imgEyeOpen}
                  className="eye-icon"
                />
              </button>
            </div>
            {errors.passwordConfirm && (
              <div className="error-message">
                <img alt="alert" src={imgAlertFill} className="error-icon" />
                <p className="error-text">{errors.passwordConfirm}</p>
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">닉네임</label>
            <div className={`input-field ${errors.nickname ? 'input-field-error' : ''}`}>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                placeholder="닉네임을 입력해주세요"
                className="input-text"
              />
            </div>
            {errors.nickname ? (
              <div className="error-message">
                <img alt="alert" src={imgAlertFill} className="error-icon" />
                <p className="error-text">{errors.nickname}</p>
              </div>
            ) : (
              <p className="input-hint">거래 시 사용할 닉네임으로 입력해주세요</p>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="signup-footer">
          <div className="button-section">
            <button className="btn-signup" onClick={handleSignUp}>
              <span>회원가입</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
