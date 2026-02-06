import './Onboarding.css';
import kakaoIcon from '../assets/kakao-icon.svg';

// Figma 이미지 URL
const imgLogo1 = "https://www.figma.com/api/mcp/asset/4a521145-04fd-4f1d-ab96-bd2b9c875452";
const imgLogo2 = "https://www.figma.com/api/mcp/asset/4d667e3f-05d4-49d4-a927-33a80a22a88e";

function Onboarding({ onStartClick, onLoginClick }) {
  return (
    <div className="mobile-container">
      <div className="onboarding-screen">
        
        <div className="onboarding-content">
          <div className="logo-section">
            <div className="logo-container">
              <div className="logo-vector">
                <img alt="logo" src={imgLogo1} className="logo-img" />
              </div>
              <div className="logo-union">
                <img alt="logo" src={imgLogo2} className="logo-img" />
              </div>
            </div>
            
            <div className="text-section">
              <h1 className="main-title">당신 근처의 당근</h1>
              <div className="subtitle-section">
                <p className="subtitle">동네라서 가능한 모든 것</p>
                <p className="subtitle">지금 내 동네를 선택하고 시작해보세요!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="onboarding-footer">
          <div className="button-section">
            <div className="buttons-wrapper">
              <button className="btn-kakao">
                <div className="kakao-icon">
                  <img alt="카카오" src={kakaoIcon} width={24} height={24} />
                </div>
                <span className="btn-kakao-text">카카오로 시작하기</span>
              </button>
              
              <button className="btn-start" onClick={onStartClick}>
                <span>시작하기</span>
              </button>
            </div>
            
            <div className="login-link">
              <span className="login-text">이미 계정이 있나요?</span>
              <span className="login-link-text" onClick={onLoginClick}>로그인</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
