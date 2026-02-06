import './Home.css';

const imgHome = 'https://www.figma.com/api/mcp/asset/707b20f6-6020-4277-be16-9b287c16318d';
const imgCalendar = 'https://www.figma.com/api/mcp/asset/cd973a00-ef54-460c-bb86-0cfef0cae751';
const imgChat = 'https://www.figma.com/api/mcp/asset/de5e9a0c-ff36-4704-b04c-931d926cf31c';
const imgUser = 'https://www.figma.com/api/mcp/asset/4416fe6a-fe9f-4b58-ad21-e1c740c18f45';

function BottomNav({ currentScreen, onNavigate }) {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="하단 메뉴">
      <div className="bottom-nav-content">
        <button
          type="button"
          className={`bottom-nav-item ${currentScreen === 'home' ? 'bottom-nav-item-active' : ''}`}
          onClick={() => onNavigate && onNavigate('home')}
          aria-current={currentScreen === 'home' ? 'page' : undefined}
        >
          <img alt="홈" src={imgHome} className="bottom-nav-icon" />
          <span>홈</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${currentScreen === 'community' ? 'bottom-nav-item-active' : ''}`}
          onClick={() => onNavigate && onNavigate('community')}
          aria-current={currentScreen === 'community' ? 'page' : undefined}
        >
          <img alt="동네생활" src={imgCalendar} className="bottom-nav-icon" />
          <span>동네생활</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${currentScreen === 'chat' ? 'bottom-nav-item-active' : ''}`}
          onClick={() => onNavigate && onNavigate('chat')}
          aria-current={currentScreen === 'chat' ? 'page' : undefined}
        >
          <img alt="채팅" src={imgChat} className="bottom-nav-icon" />
          <span>채팅</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${currentScreen === 'profile' ? 'bottom-nav-item-active' : ''}`}
          onClick={() => onNavigate && onNavigate('profile')}
          aria-current={currentScreen === 'profile' ? 'page' : undefined}
        >
          <img alt="나의당근" src={imgUser} className="bottom-nav-icon" />
          <span>나의당근</span>
        </button>
      </div>
    </nav>
  );
}

export default BottomNav;
