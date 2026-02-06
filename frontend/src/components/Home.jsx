import { useState, useRef, useEffect } from 'react';
import './Home.css';
import api, { getImageUrl } from '../utils/axios.js';
import { getItemsFromCache, setItemsCache } from '../utils/itemsCache.js';

// Figma 이미지 URL
const imgIconSearch = "https://www.figma.com/api/mcp/asset/26bbd05b-92fc-44eb-84c3-f18c6c78bcd3";
const imgHome = "https://www.figma.com/api/mcp/asset/707b20f6-6020-4277-be16-9b287c16318d";
const imgCalendar = "https://www.figma.com/api/mcp/asset/cd973a00-ef54-460c-bb86-0cfef0cae751";
const imgChat = "https://www.figma.com/api/mcp/asset/de5e9a0c-ff36-4704-b04c-931d926cf31c";
const imgUser = "https://www.figma.com/api/mcp/asset/4416fe6a-fe9f-4b58-ad21-e1c740c18f45";
const imgPlus = "https://www.figma.com/api/mcp/asset/af8e3bc3-dfcc-4608-b500-8c3e35ef714a";
const imgThumbnail = "https://www.figma.com/api/mcp/asset/29745e78-527b-44cc-9de9-4ef63a65b15f";
const imgComponent592 = "https://www.figma.com/api/mcp/asset/43b1bb59-9ac5-4ab2-b560-97dce79d6e1a";
const imgFavorite = "https://www.figma.com/api/mcp/asset/e4e4c007-575f-41a5-84a9-37121e1366a4";
const imgFavoriteIcon = "https://www.figma.com/api/mcp/asset/ef975df3-be81-4998-b3eb-aefab1bab9b1";

function Home({ onWritePost, onItemClick, onNavigate, onSearch, currentScreen = 'home', embedded = false }) {
  const [selectedFilter, setSelectedFilter] = useState('전체');
  const [neighborhood, setNeighborhood] = useState('선택한주소');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const filterButtonsRef = useRef(null);
  
  const filterOptions = ['전체', '바지', '양복', '잠옷', '등산복', '신발'];
  
  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success && response.data.data.neighborhood) {
          setNeighborhood(response.data.data.neighborhood);
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error);
      }
    };

    fetchUserInfo();
  }, []);

  // 상품 리스트 가져오기 (캐시 있으면 재요청 생략, 2분 TTL)
  const fetchItems = async (category = null) => {
    const cached = getItemsFromCache(category);
    if (cached !== null) {
      setItems(cached);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = category && category !== '전체' ? { category } : {};
      const response = await api.get('/items', { params });
      if (response.data.success) {
        const data = response.data.data || [];
        setItems(data);
        setItemsCache(category, data);
      }
    } catch (error) {
      console.error('상품 리스트 가져오기 오류:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // 초기 마운트 및 필터 변경 시 상품 리스트 가져오기
  useEffect(() => {
    fetchItems(selectedFilter);
  }, [selectedFilter]);

  // 시간 포맷팅 함수
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // 1분 미만: "방금 전"
    if (diffMins < 1) return '방금 전';
    // 1분 ~ 1시간: "1분 전", "2분 전" 등
    if (diffMins < 60) return `${diffMins}분 전`;
    // 1시간 ~ 24시간: "1시간 전", "2시간 전" 등
    if (diffHours < 24) return `${diffHours}시간 전`;
    // 24시간 이후: "1일 전", "2일 전" 등
    return `${diffDays}일 전`;
  };

  // 가격 포맷팅 함수
  const formatPrice = (price) => {
    return `${parseInt(price).toLocaleString()}원`;
  };
  
  // 마우스 드래그 스크롤
  const handleMouseDown = (e) => {
    const container = filterButtonsRef.current;
    if (!container) return;
    
    const startX = e.pageX - container.offsetLeft;
    const scrollLeft = container.scrollLeft;
    let isDown = true;
    
    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    };
    
    const handleMouseUp = () => {
      isDown = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  const screen = (
    <div className="home-screen">
      <div className="home-header">
        {/* 상단 44px 상태바 공간 */}
        <div className="home-status-bar" aria-hidden="true" />
        {/* 네비게이션 바 */}
        <div className="nav-bar">
          <div className="nav-content">
            <div className="nav-title-section">
              <h1>{neighborhood || '선택한주소'}</h1>
            </div>
            <div className="nav-right">
              <button className="search-btn" onClick={onSearch}>
                <img alt="search" src={imgIconSearch} className="search-icon" />
              </button>
            </div>
          </div>
        </div>

        {/* 필터 버튼들 */}
        <div className="filter-section">
          <div
            className="filter-buttons"
            ref={filterButtonsRef}
            onMouseDown={handleMouseDown}
          >
            {filterOptions.map((filter) => (
              <button
                key={filter}
                className={`filter-btn ${selectedFilter === filter ? 'filter-btn-active' : ''}`}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

        {/* 상품 리스트 */}
        <div className="product-list" role="region" aria-label="상품 목록">
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>등록된 상품이 없습니다</div>
          ) : (
            items.map((item) => (
              <div 
                key={item.id} 
                className="product-card"
                onClick={() => onItemClick && onItemClick(item.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="product-thumbnail">
                  {item.image_url ? (
                    <img alt={item.title} src={getImageUrl(item.image_url)} />
                  ) : (
                    <img alt="product" src={imgThumbnail} />
                  )}
                </div>
                <div className="product-content">
                  <div className="product-header">
                    <h3 className="product-title">{item.title}</h3>
                  </div>
                  <div className="product-meta">
                    <span className="product-location">
                      {item.neighborhood} · {formatTimeAgo(item.created_at)}
                    </span>
                  </div>
                  <div className="product-price">
                    <span>{formatPrice(item.price)}</span>
                  </div>
                  <div className="product-footer">
                    <div className="product-tags">
                      <div className="product-tag">
                        <img alt="chat" src={imgComponent592} className="tag-icon tag-icon-chat" />
                        <span>{item.chat_count || 0}</span>
                      </div>
                      <div className="product-tag">
                        <img alt="favorite" src={imgFavoriteIcon} className="tag-icon tag-icon-favorite" />
                        <span>{item.like_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 글쓰기 플로팅 버튼 */}
        <button className="write-btn" onClick={onWritePost}>
          <img alt="plus" src={imgPlus} className="write-icon" />
          <span>글쓰기</span>
        </button>
      </div>
  );
  if (embedded) return screen;
  return <div className="mobile-container">{screen}</div>;
}

export default Home;
