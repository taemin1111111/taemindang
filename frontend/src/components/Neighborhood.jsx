import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import './Neighborhood.css';

// Figma 이미지 URL
const imgIconClose = "https://www.figma.com/api/mcp/asset/d2a01b8d-55e6-4814-94ed-8a3112f4bb04";
const imgComponent592 = "https://www.figma.com/api/mcp/asset/266af999-0ce5-4b3f-8634-653ac3e1facf";
const imgShapeChevronLeft = "https://www.figma.com/api/mcp/asset/c93d445c-71f8-4dad-9ee9-c53a449009ac";

// 동네 리스트
const neighborhoods = [
  '부평동',
  '부평 1동',
  '부평 2동',
  '부평 3동',
  '부평 4동'
];

function Neighborhood({ onClose, onConfirm }) {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);

  useEffect(() => {
    const loadCurrentNeighborhood = async () => {
      try {
        const u = localStorage.getItem('user');
        if (u) {
          const parsed = JSON.parse(u);
          if (parsed.neighborhood) {
            setSelectedNeighborhood(parsed.neighborhood);
            return;
          }
        }
        const res = await axios.get('/auth/me');
        if (res.data.success && res.data.data?.neighborhood) {
          setSelectedNeighborhood(res.data.data.neighborhood);
        }
      } catch (_) {}
    };
    loadCurrentNeighborhood();
  }, []);

  const handleSelectClick = () => {
    setShowBottomSheet(true);
  };

  const handleNeighborhoodSelect = (neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    setShowBottomSheet(false);
  };

  const handleConfirm = async () => {
    if (!selectedNeighborhood) {
      return;
    }

    try {
      const response = await axios.put('/auth/neighborhood', {
        neighborhood: selectedNeighborhood
      });

      if (response.data.success) {
        const u = localStorage.getItem('user');
        if (u) {
          try {
            const parsed = JSON.parse(u);
            localStorage.setItem('user', JSON.stringify({ ...parsed, neighborhood: selectedNeighborhood }));
          } catch (_) {}
        }
        if (onConfirm) {
          onConfirm();
        } else if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      console.error('동네 설정 오류:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert('동네 설정 중 오류가 발생했습니다.');
      }
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowBottomSheet(false);
    }
  };

  return (
    <div className="mobile-container">
      <div className="neighborhood-screen">
        <div className="neighborhood-status-bar" aria-hidden="true" />
        {/* 네비게이션 바 */}
        <div className="nav-bar">
          <div className="nav-content">
            <div className="nav-left">
              <button className="close-btn" onClick={onClose}>
                <img alt="close" src={imgIconClose} className="close-icon" />
              </button>
            </div>
            <div className="nav-title">
              <h1>내 동네 설정</h1>
            </div>
            <div className="nav-right"></div>
          </div>
        </div>

        {/* 동네 선택 버튼 */}
        <div className="neighborhood-content">
          <button className="neighborhood-select-btn" onClick={handleSelectClick}>
            <img alt="icon" src={imgComponent592} className="neighborhood-icon" />
            <span className="neighborhood-text">
              {selectedNeighborhood || '동네 선택'}
            </span>
            <div className="chevron-wrapper">
              <img alt="chevron" src={imgShapeChevronLeft} className="chevron-icon" />
            </div>
          </button>
        </div>

        {/* 하단 버튼 */}
        <div className="neighborhood-footer">
          <div className="button-section">
            <button 
              className={`btn-confirm ${selectedNeighborhood ? 'btn-confirm-active' : 'btn-confirm-inactive'}`}
              onClick={handleConfirm}
              disabled={!selectedNeighborhood}
            >
              <span>확인</span>
            </button>
          </div>
        </div>

        {/* 바텀시트 오버레이 */}
        {showBottomSheet && (
          <div className="bottom-sheet-overlay" onClick={handleBackdropClick}>
            <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
              {/* 네비게이션 바 공간 */}
              <div className="bottom-sheet-nav">
              </div>
              
              {/* 동네 리스트 */}
              <div className="bottom-sheet-content">
                {neighborhoods.map((neighborhood, index) => (
                  <div
                    key={index}
                    className={`neighborhood-item ${index === 0 ? 'neighborhood-item-first' : ''}`}
                    onClick={() => handleNeighborhoodSelect(neighborhood)}
                  >
                    <span>{neighborhood}</span>
                  </div>
                ))}
                <div className="bottom-sheet-spacer"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Neighborhood;
