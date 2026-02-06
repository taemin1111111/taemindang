import { useState, useEffect } from 'react';
import './ProfileDetail.css';
import api from '../utils/axios.js';
import defaultAvatar from '../assets/ratio.png';

function ProfileDetail({ onClose, onNavigate }) {
  const [user, setUser] = useState(null);
  const [sellingCount, setSellingCount] = useState(0);

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

  useEffect(() => {
    const fetchSellingCount = async () => {
      try {
        const res = await api.get('/items/my', { params: { status: 'SELLING' } });
        if (res.data.success && Array.isArray(res.data.data)) {
          setSellingCount(res.data.data.length);
        }
      } catch (_) {}
    };
    fetchSellingCount();
  }, []);

  const nickname = user?.nickname || '사용자 닉네임';
  const temperature = user?.temperature != null ? Number(user.temperature).toFixed(1) : '43.1';
  const badgeCount = 1; // 활동 배지: 하드코딩 1개

  return (
    <div className="mobile-container">
      <div className="profile-detail-screen">
        <div className="profile-detail-status-bar" aria-hidden="true" />
        <header className="profile-detail-nav">
          <button type="button" className="profile-detail-back" onClick={onClose} aria-label="뒤로">
            <BackIcon />
          </button>
          <h1 className="profile-detail-title">프로필</h1>
          <div className="profile-detail-nav-right" />
        </header>

        <div className="profile-detail-body">
          <section className="profile-detail-top">
            <div className="profile-detail-avatar">
              <img src={user?.profile_image || defaultAvatar} alt="" className="profile-detail-avatar-img" />
            </div>
            <div className="profile-detail-info">
              <span className="profile-detail-name">{nickname}</span>
              <span className="profile-detail-temp">{temperature}°C</span>
            </div>
          </section>

          <button type="button" className="profile-detail-edit-btn" onClick={() => onNavigate && onNavigate('profileEdit')}>
            프로필 수정
          </button>

          <ul className="profile-detail-list">
            <li
              className="profile-detail-list-item"
              role="button"
              tabIndex={0}
              onClick={() => onNavigate && onNavigate('activityBadges')}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate && onNavigate('activityBadges')}
            >
              <span>활동 배지 {badgeCount}개</span>
              <ChevronIcon />
            </li>
            <li
              className="profile-detail-list-item"
              role="button"
              tabIndex={0}
              onClick={() => onNavigate && onNavigate('salesHistory')}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate && onNavigate('salesHistory')}
            >
              <span>판매물품 {sellingCount}개</span>
              <ChevronIcon />
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default ProfileDetail;
