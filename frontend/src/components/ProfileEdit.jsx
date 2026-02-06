import { useState, useEffect, useRef } from 'react';
import './ProfileEdit.css';
import api, { getImageUrl } from '../utils/axios.js';
import ratioImg from '../assets/ratio.png';

function ProfileEdit({ onClose }) {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = localStorage.getItem('user');
        if (u) {
          const parsed = JSON.parse(u);
          setUser(parsed);
          setNickname(parsed.nickname || '');
        }
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.data) {
          setUser(res.data.data);
          setNickname(res.data.data.nickname || '');
        }
      } catch (e) {
        const u = localStorage.getItem('user');
        if (u) {
          try {
            const parsed = JSON.parse(u);
            setNickname(parsed.nickname || '');
          } catch (_) {}
        }
      }
    };
    loadUser();
  }, []);

  const handleComplete = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameError('닉네임을 입력해주세요!');
      return;
    }
    setNicknameError('');
    setSaving(true);
    try {
      const res = await api.put('/auth/nickname', { nickname: trimmed });
      if (res.data.success && res.data.data?.nickname) {
        const newUser = { ...user, nickname: res.data.data.nickname };
        setUser(newUser);
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            localStorage.setItem('user', JSON.stringify({ ...parsed, nickname: res.data.data.nickname }));
          } catch (_) {}
        }
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || '닉네임 변경에 실패했습니다.';
      setNicknameError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profile_image', file);
      const res = await api.put('/auth/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success && res.data.data?.profile_image) {
        const newUser = { ...user, profile_image: res.data.data.profile_image };
        setUser(newUser);
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            localStorage.setItem('user', JSON.stringify({ ...parsed, profile_image: res.data.data.profile_image }));
          } catch (_) {}
        }
      }
    } catch (err) {
      console.error('프로필 사진 업로드 실패:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="mobile-container">
      <div className="profile-edit-screen">
        <div className="profile-edit-status-bar" aria-hidden="true" />
        <header className="profile-edit-nav">
          <button type="button" className="profile-edit-close" onClick={onClose} aria-label="닫기">
            <CloseIcon />
          </button>
          <h1 className="profile-edit-title">프로필 수정</h1>
          <button type="button" className="profile-edit-complete" onClick={handleComplete} disabled={saving}>
            {saving ? '저장 중...' : '완료'}
          </button>
        </header>

        <div className="profile-edit-body">
          {/* 프로필 사진: 좌 121 / 우 122, 아래 30 (사진 수치) */}
          <div className="profile-edit-avatar-wrap">
            <div className="profile-edit-avatar">
              <img src={getImageUrl(user?.profile_image) || ratioImg} alt="" className="profile-edit-avatar-img" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile-edit-file-input"
              aria-label="프로필 사진 선택"
              onChange={handleProfileImageChange}
              disabled={uploading}
            />
            <button
              type="button"
              className="profile-edit-avatar-camera"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="프로필 사진 변경"
            >
              <CameraIcon />
            </button>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="profile-edit-form">
            <div className="profile-edit-field">
              <label htmlFor="profile-edit-nickname" className="profile-edit-label">
                닉네임
              </label>
              <input
                id="profile-edit-nickname"
                type="text"
                className={`profile-edit-input ${nicknameError ? 'profile-edit-input-error' : ''}`}
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (nicknameError) setNicknameError('');
                }}
                placeholder="닉네임을 입력해주세요."
              />
              {nicknameError && (
                <p className="profile-edit-error" role="alert">
                  <WarningIcon />
                  {nicknameError}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* 경고 아이콘 (빈 닉네임 에러) */
function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="profile-edit-warning-icon" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2.5a1 1 0 0 1 .87.514l5.5 9.5A1 1 0 0 1 13.5 14h-11a1 1 0 0 1-.87-1.486l5.5-9.5A1 1 0 0 1 8 2.5zM9 6v3H7V6h2zm0 4v1H7v-1h2z"
        fill="currentColor"
      />
    </svg>
  );
}

/* icon_camera.svg - 카메라 버튼 아이콘 */
function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="profile-edit-camera-svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.16699 5L6.45033 2.85833C6.57533 2.65833 6.85866 2.5 7.07533 2.5H12.9253C13.1503 2.5 13.4253 2.65833 13.5503 2.85833L14.8337 5H16.667C17.5837 5 18.3337 5.74167 18.3337 6.66667V15C18.3337 15.925 17.592 16.6667 16.667 16.6667H3.33366C2.41699 16.6667 1.66699 15.925 1.66699 15V6.66667C1.66699 5.75 2.40866 5 3.33366 5H5.16699ZM9.16715 4.75001C8.79897 4.75001 8.50049 5.04849 8.50049 5.41668C8.50049 5.78487 8.79897 6.08334 9.16715 6.08334H10.8338C11.202 6.08334 11.5005 5.78487 11.5005 5.41668C11.5005 5.04849 11.202 4.75001 10.8338 4.75001H9.16715ZM7.75049 10.8333C7.75049 9.5907 8.75785 8.58334 10.0005 8.58334C11.2431 8.58334 12.2505 9.5907 12.2505 10.8333C12.2505 12.076 11.2431 13.0833 10.0005 13.0833C8.75785 13.0833 7.75049 12.076 7.75049 10.8333ZM10.0005 7.25001C8.02147 7.25001 6.41715 8.85432 6.41715 10.8333C6.41715 12.8124 8.02147 14.4167 10.0005 14.4167C11.9795 14.4167 13.5838 12.8124 13.5838 10.8333C13.5838 8.85432 11.9795 7.25001 10.0005 7.25001Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default ProfileEdit;
