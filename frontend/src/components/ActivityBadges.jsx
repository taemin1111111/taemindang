import { useState } from 'react';
import './ActivityBadges.css';

/* Figma 1383-49130: 활동배지 화면 - 3x3 그리드, 1개 해금(걸음마), 나머지 잠금 */
const BADGES = [
  { id: 1, label: '걸음마', unlocked: true },
  { id: 2, label: '동네 탐험가', unlocked: false },
  { id: 3, label: '동네 개척자', unlocked: false },
  { id: 4, label: '동네 답변가', unlocked: false },
  { id: 5, label: '동네 한바퀴', unlocked: false },
  { id: 6, label: '동네 토박이', unlocked: false },
  { id: 7, label: '동네 주민', unlocked: false },
  { id: 8, label: '동네 산책', unlocked: false },
  { id: 9, label: '당근 홀릭', unlocked: false },
];

/* 잠긴 뱃지별 알림 메시지 (Figma 1383-49976) */
const LOCKED_BADGE_MESSAGES = {
  2: '동네 탐험가 뱃지는 동네 글을 더 탐험하면 열려요.',
  3: '동네 개척자 뱃지는 동네에서 첫 거래를 완료하면 열려요.',
  4: '동네 답변가 뱃지는 댓글을 더 달면 열려요.',
  5: '동네 한바퀴 뱃지는 동네 생활 글을 더 읽으면 열려요.',
  6: '동네 토박이 뱃지는 가입 후 일정 기간이 지나면 열려요.',
  7: '동네 주민 뱃지는 동네 인증을 완료하면 열려요.',
  8: '동네 산책 뱃지는 동네에서 만남 기록이 쌓이면 열려요.',
  9: '당근 홀릭 뱃지는 앱 이용 일수가 충족되면 열려요.',
};

function ActivityBadges({ onClose }) {
  const [lockedModalBadge, setLockedModalBadge] = useState(null);

  const handleLockedBadgeClick = (badge) => {
    if (!badge.unlocked) {
      setLockedModalBadge(badge);
    }
  };

  return (
    <div className="mobile-container">
      <div className="activity-badges-screen">
        <header className="activity-badges-nav">
          <button type="button" className="activity-badges-close" onClick={onClose} aria-label="닫기">
            <CloseIcon />
          </button>
          <h1 className="activity-badges-title">활동배지</h1>
          <div className="activity-badges-nav-right" />
        </header>

        <div className="activity-badges-body">
          <div className="activity-badges-grid">
            {BADGES.map((badge) => (
              <div
                key={badge.id}
                className="activity-badges-card"
                onClick={() => handleLockedBadgeClick(badge)}
                role="button"
                tabIndex={badge.unlocked ? -1 : 0}
                onKeyDown={(e) => !badge.unlocked && e.key === 'Enter' && handleLockedBadgeClick(badge)}
              >
                <div
                  className={`activity-badges-card-icon-box ${badge.unlocked ? 'activity-badges-card-icon-box-unlocked' : 'activity-badges-card-icon-box-locked'}`}
                >
                  <div className="activity-badges-card-icon">
                    {badge.unlocked ? (
                      <ShoppingBagIcon />
                    ) : (
                      <LockIcon />
                    )}
                  </div>
                </div>
                <span className="activity-badges-card-label">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 잠긴 뱃지 클릭 시 알림 (Figma 1383-49976) - 확인 눌러야 닫힘 */}
        {lockedModalBadge && (
          <div
            className="activity-badges-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-badges-modal-title"
          >
            <div className="activity-badges-modal" onClick={(e) => e.stopPropagation()}>
              <p id="activity-badges-modal-title" className="activity-badges-modal-text">
                {LOCKED_BADGE_MESSAGES[lockedModalBadge.id]}
              </p>
              <button
                type="button"
                className="activity-badges-modal-btn"
                onClick={() => setLockedModalBadge(null)}
              >
                확인
              </button>
            </div>
          </div>
        )}
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

/* 걸음마 배지: 3번(아래 바디 28×19.72), 4번(위 손잡이 16.43×9.86, top 4.85, left 9.78), 2번(패딩 상하 4.85, 좌우 4) */
function ShoppingBagIcon() {
  return (
    <span className="activity-badges-bag-wrap" aria-hidden>
      <svg className="activity-badges-bag-svg" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 아래: 바디 #FF6F0F - 28×19.7198px, 위치 (4, 14.71) */}
        <path
          transform="translate(4, 14.71) scale(1, 0.986)"
          d="M0.0607088 5.10261C-0.384471 2.43153 1.67534 0 4.38327 0H23.617C26.325 0 28.3848 2.43153 27.9396 5.10261L26.1137 16.0581C25.7615 18.1711 23.9333 19.7198 21.7911 19.7198H6.20918C4.067 19.7198 2.23879 18.1711 1.88662 16.0581L0.0607088 5.10261Z"
          fill="#FF6F0F"
        />
        {/* 위: 손잡이 #FBC7A9 - 16.43×9.86, left 9.78, top 4.85 */}
        <path
          transform="translate(9.7842, 4.8535) scale(0.9666, 0.986)"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0 8.2166C0 3.6787 3.6787 0 8.2166 0C12.7545 0 16.4332 3.6787 16.4332 8.2166C16.4332 9.12418 15.6975 9.85992 14.7899 9.85992H1.64332C0.735739 9.85992 0 9.12418 0 8.2166ZM3.56716 6.57328H12.866C12.1893 4.65849 10.3631 3.28664 8.2166 3.28664C6.07006 3.28664 4.24394 4.65849 3.56716 6.57328Z"
          fill="#FBC7A9"
        />
      </svg>
      <span className="activity-badges-bag-number">1</span>
    </span>
  );
}

/* 잠긴 뱃지 아이콘: Lock.svg */
function LockIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="activity-badges-lock-icon">
      <path d="M13.5 14.6538V10.5C13.5 8.01472 15.5147 6 18 6C20.4853 6 22.5 8.01472 22.5 10.5V14.6538" stroke="#B9B9B9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6" y="12" width="24" height="18" rx="2" fill="#D0D0D0" />
      <path d="M18 18V24" stroke="#F7F8F9" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default ActivityBadges;
