import { useState, useEffect } from 'react';
import './Profile.css';
import './Home.css'; /* 하단 네비 아이콘/위치 홈과 동일하게 */
import api from '../utils/axios.js';
import defaultAvatar from '../assets/ratio.png';

// 하단 네비: Home.jsx와 동일한 이미지 URL
const imgHome = 'https://www.figma.com/api/mcp/asset/707b20f6-6020-4277-be16-9b287c16318d';
const imgCalendar = 'https://www.figma.com/api/mcp/asset/cd973a00-ef54-460c-bb86-0cfef0cae751';
const imgChat = 'https://www.figma.com/api/mcp/asset/de5e9a0c-ff36-4704-b04c-931d926cf31c';
const imgUser = 'https://www.figma.com/api/mcp/asset/4416fe6a-fe9f-4b58-ad21-e1c740c18f45';

function Profile({ onNavigate, currentScreen = 'profile' }) {
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = localStorage.getItem('user');
        if (u) {
          const parsed = JSON.parse(u);
          setUser(parsed);
        }
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.data) {
          setUser(res.data.data);
          localStorage.setItem('user', JSON.stringify(res.data.data));
        }
      } catch (e) {
        const u = localStorage.getItem('user');
        if (u) {
          try {
            setUser(JSON.parse(u));
          } catch (_) {}
        }
      }
    };
    loadUser();
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onNavigate) onNavigate('onboarding');
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const nickname = user?.nickname || '사용자 닉네임';
  const temperature = user?.temperature != null ? Number(user.temperature).toFixed(1) : '43.1';

  return (
    <div className="mobile-container">
      <div className="profile-screen">
        {/* 상태바 제거: 헤더 top: 0 (Figma 1383-46491) */}
        <header className="profile-header">
          <h1 className="profile-title">나의 당근</h1>
        </header>

        <div className="profile-content">
          {/* 프로필 카드 (클릭 시 프로필 상세 화면, Figma 1383-49077) */}
          <section
            className="profile-card"
            onClick={() => onNavigate && onNavigate('profileDetail')}
            onKeyDown={(e) => e.key === 'Enter' && onNavigate && onNavigate('profileDetail')}
            role="button"
            tabIndex={0}
          >
            <div className="profile-card-avatar">
              <img src={user?.profile_image || defaultAvatar} alt="" className="profile-card-avatar-img" />
            </div>
            <div className="profile-card-info">
              <span className="profile-card-name">{nickname}</span>
              <span className="profile-card-temp">{temperature}°C</span>
            </div>
            <span className="profile-card-chevron" aria-hidden>
              <ChevronIcon />
            </span>
          </section>

          {/* 나의 활동 */}
          <section className="profile-section">
            <h2 className="profile-section-title">나의 활동</h2>
            <ul className="profile-list">
              <li
                className="profile-list-item"
                onClick={() => onNavigate && onNavigate('salesHistory')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onNavigate && onNavigate('salesHistory')}
              >
                <DocumentIcon />
                <span>판매내역</span>
                <ChevronIcon />
              </li>
              <li
                className="profile-list-item"
                onClick={() => onNavigate && onNavigate('purchaseHistory')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onNavigate && onNavigate('purchaseHistory')}
              >
                <DocumentIcon />
                <span>구매내역</span>
                <ChevronIcon />
              </li>
              <li
                className="profile-list-item"
                onClick={() => onNavigate && onNavigate('myCommunityActivity')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onNavigate && onNavigate('myCommunityActivity')}
              >
                <DocumentIcon />
                <span>내 동네 생활 글</span>
                <ChevronIcon />
              </li>
            </ul>
          </section>

          {/* 나의 관심 */}
          <section className="profile-section">
            <h2 className="profile-section-title">나의 관심</h2>
            <ul className="profile-list">
              <li
                className="profile-list-item"
                onClick={() => onNavigate && onNavigate('wishlist')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onNavigate && onNavigate('wishlist')}
              >
                <HeartIcon />
                <span>관심목록</span>
                <ChevronIcon />
              </li>
            </ul>
          </section>

          {/* 설정 */}
          <section className="profile-section">
            <h2 className="profile-section-title">설정</h2>
            <ul className="profile-list">
              <li className="profile-list-item" onClick={() => onNavigate && onNavigate('neighborhood')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onNavigate && onNavigate('neighborhood')}>
                <LocationIcon />
                <span>내 동네 설정</span>
                <ChevronIcon />
              </li>
              <li className="profile-list-item profile-list-item-logout" onClick={handleLogoutClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleLogoutClick()}>
                <PersonIcon />
                <span>로그아웃</span>
                <ChevronIcon />
              </li>
            </ul>
          </section>
        </div>

        {/* 로그아웃 확인 모달 (Figma 1383-48920) */}
        {showLogoutModal && (
          <div
            className="logout-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            onClick={handleLogoutCancel}
            onKeyDown={(e) => e.key === 'Escape' && handleLogoutCancel()}
          >
            <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
              <p id="logout-modal-title" className="logout-modal-text">
                로그아웃 하시겠어요?
              </p>
              <button type="button" className="logout-modal-btn-confirm" onClick={handleLogoutConfirm}>
                로그아웃
              </button>
              <button type="button" className="logout-modal-btn-back" onClick={handleLogoutCancel}>
                뒤로 가기
              </button>
            </div>
          </div>
        )}

        {/* 하단 네비게이션 바 (Home.jsx와 동일) */}
        <div className="bottom-nav">
          <div className="bottom-nav-content">
            <div className={`bottom-nav-item ${currentScreen === 'home' ? 'bottom-nav-item-active' : ''}`} onClick={() => onNavigate && onNavigate('home')}>
              <img alt="home" src={imgHome} className="bottom-nav-icon" />
              <span>홈</span>
            </div>
            <div className={`bottom-nav-item ${currentScreen === 'community' ? 'bottom-nav-item-active' : ''}`} onClick={() => onNavigate && onNavigate('community')}>
              <img alt="calendar" src={imgCalendar} className="bottom-nav-icon" />
              <span>동네생활</span>
            </div>
            <div className={`bottom-nav-item ${currentScreen === 'chat' ? 'bottom-nav-item-active' : ''}`} onClick={() => onNavigate && onNavigate('chat')}>
              <img alt="chat" src={imgChat} className="bottom-nav-icon" />
              <span>채팅</span>
            </div>
            <div className={`bottom-nav-item ${currentScreen === 'profile' ? 'bottom-nav-item-active' : ''}`} onClick={() => onNavigate && onNavigate('profile')}>
              <img alt="user" src={imgUser} className="bottom-nav-icon" />
              <span>나의당근</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default Profile;
