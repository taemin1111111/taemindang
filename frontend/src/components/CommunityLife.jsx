import { useState, useRef, useEffect } from 'react';
import './CommunityLife.css';
import api from '../utils/axios.js';

// Figma 이미지 URL
const imgIconSearch = "https://www.figma.com/api/mcp/asset/26bbd05b-92fc-44eb-84c3-f18c6c78bcd3";
const imgHome = "https://www.figma.com/api/mcp/asset/707b20f6-6020-4277-be16-9b287c16318d";
const imgCalendar = "https://www.figma.com/api/mcp/asset/cd973a00-ef54-460c-bb86-0cfef0cae751";
const imgChat = "https://www.figma.com/api/mcp/asset/de5e9a0c-ff36-4704-b04c-931d926cf31c";
const imgUser = "https://www.figma.com/api/mcp/asset/4416fe6a-fe9f-4b58-ad21-e1c740c18f45";
const imgPlus = "https://www.figma.com/api/mcp/asset/af8e3bc3-dfcc-4608-b500-8c3e35ef714a";
const imgFire = "https://www.figma.com/api/mcp/asset/e40549e6-3844-45f0-841b-ce423abe1f87";
const imgFireActive = "https://www.figma.com/api/mcp/asset/dc2a9bd2-1d41-41c5-ac84-9c4e62e67bc1";
const imgComponent592 = "https://www.figma.com/api/mcp/asset/5eb69b2d-e44d-4724-b376-424276b67cec";
const imgComponent593 = "https://www.figma.com/api/mcp/asset/bd0d3a69-ded4-460c-b4ac-957f42697e6c";
const imgFire1 = "https://www.figma.com/api/mcp/asset/d6361d4f-c2cf-43f7-ab1f-0664bca22f9f";
const imgRightSide = "https://www.figma.com/api/mcp/asset/f658ba47-688b-40cb-9276-78eb4769800a";
const imgIconStroke = "https://www.figma.com/api/mcp/asset/312d63e1-ecfc-4ea1-ab02-2f7860191062";
const imgIconStroke1 = "https://www.figma.com/api/mcp/asset/c72bd319-9438-4690-ac60-33dd5dde5785";
const imgVector332 = "https://www.figma.com/api/mcp/asset/40e5a679-0fb7-4a2c-a391-a4251b57b09a";
const imgHomeIcon = "https://www.figma.com/api/mcp/asset/71d4198b-76c2-4231-bb31-aa91c6b2feb5";

function CommunityLife({ onNavigate, onWritePost, onSearch, currentScreen = 'community' }) {
  const [selectedFilter, setSelectedFilter] = useState('추천');
  const [neighborhood, setNeighborhood] = useState('선택한주소');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const filterButtonsRef = useRef(null);
  const popularCardsRef = useRef(null);
  const postListRef = useRef(null);
  
  const filterOptions = [
    { label: '추천', hasIcon: false },
    { label: '인기', hasIcon: true },
    { label: '맛집', hasIcon: false },
    { label: '생활/편의', hasIcon: false },
    { label: '이사/시공', hasIcon: false },
    { label: '주거/부동산', hasIcon: false },
    { label: '교육', hasIcon: false },
    { label: '미용', hasIcon: false },
    { label: '반려동물', hasIcon: false },
    { label: '운동', hasIcon: false },
    { label: '고민/사연', hasIcon: false },
    { label: '동네/친구', hasIcon: false },
    { label: '취미', hasIcon: false },
    { label: '동네풍경', hasIcon: false },
    { label: '임신/육아', hasIcon: false },
    { label: '동네행사', hasIcon: false },
    { label: '분실/실종', hasIcon: false },
    { label: '동네사건사고', hasIcon: false },
    { label: '일반', hasIcon: false }
  ];
  
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

  // 시간 포맷팅 함수
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };
  
  // 필터 버튼 마우스 드래그 스크롤
  const handleFilterMouseDown = (e) => {
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

  // 인기 소식 카드 마우스 드래그 스크롤
  const handlePopularCardsMouseDown = (e) => {
    const container = popularCardsRef.current;
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

  // 인기 소식 더보기 버튼 클릭 핸들러
  const handlePopularMoreClick = () => {
    setSelectedFilter('인기');
    // 스크롤을 맨 위로 이동
    setTimeout(() => {
      if (postListRef.current) {
        postListRef.current.scrollTop = 0;
      }
    }, 100);
  };

  // 게시글 목록 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/community/posts', {
          params: {
            filter: selectedFilter,
            neighborhood: neighborhood !== '선택한주소' ? neighborhood : undefined
          }
        });

        if (response.data.success) {
          // 시간 포맷팅 적용
          const formattedPosts = response.data.data.map(post => ({
            ...post,
            time: formatTimeAgo(post.time)
          }));
          setPosts(formattedPosts);
        }
      } catch (error) {
        console.error('게시글 목록 가져오기 오류:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [selectedFilter, neighborhood]);

  return (
    <div className="mobile-container">
      <div className="community-life-screen">
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
            onMouseDown={handleFilterMouseDown}
          >
            {filterOptions.map((filter, index) => {
              const isActive = selectedFilter === filter.label;
              return (
                <button
                  key={index}
                  className={`filter-btn ${isActive ? 'filter-btn-active' : ''} ${filter.hasIcon ? 'filter-btn-with-icon' : ''}`}
                  onClick={() => setSelectedFilter(filter.label)}
                >
                  {filter.hasIcon && (
                    <img 
                      alt="fire" 
                      src={isActive ? imgFireActive : imgFire} 
                      className="filter-icon" 
                    />
                  )}
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 게시글 리스트 */}
        <div className="post-list" ref={postListRef}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>
          ) : (
            <>
              {/* 글 3개만 먼저 표시, 그 다음에 지금 인기 소식 */}
              {posts.slice(0, 3).map((post) => (
                <div 
                  key={post.id} 
                  className="post-card"
                  onClick={() => onNavigate && onNavigate('communityPostDetail', post.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="post-content">
                    <div className="post-badge">{post.topic}</div>
                    <div className="post-header-body">
                      <div className="post-title">{post.title}</div>
                      <div className="post-description">{post.content}</div>
                    </div>
                  </div>
                  <div className="post-footer">
                    <div className="post-meta">
                      {post.location} · {post.time} · 조회 {post.views}
                    </div>
                    <div className="post-comments">
                      <img alt="chat" src={imgComponent592} className="comment-icon" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* 지금 인기 소식 - 글 3개 뒤에만 노출, 그 밑에는 없음 */}
              <div className="popular-section">
                <div className="popular-header">
                  <img alt="fire" src={imgFire1} className="popular-fire-icon" />
                  <h2>지금 인기 소식</h2>
                  <div 
                    className="popular-arrow"
                    onClick={handlePopularMoreClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <img alt="arrow" src={imgIconStroke} className="arrow-icon" />
                  </div>
                </div>
                <div 
                  className="popular-cards"
                  ref={popularCardsRef}
                  onMouseDown={handlePopularCardsMouseDown}
                >
                  {posts.slice(0, 3).map((post) => (
                    <div 
                      key={`popular-${post.id}`} 
                      className="popular-card"
                      onClick={() => onNavigate && onNavigate('communityPostDetail', post.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="popular-card-content">
                        <div className="popular-badge">{post.topic}</div>
                        <div className="popular-text">{post.content}</div>
                        <div className="popular-comments">
                          <img alt="chat" src={imgComponent593} className="popular-comment-icon" />
                          <span>{post.comments}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="popular-divider">
                  <img alt="divider" src={imgVector332} className="divider-img" />
                </div>
              </div>

              {/* 지금 인기 소식 아래: 나머지 글들 차례대로 세로로 */}
              {posts.slice(3).map((post) => (
                <div 
                  key={post.id} 
                  className="post-card"
                  onClick={() => onNavigate && onNavigate('communityPostDetail', post.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="post-content">
                    <div className="post-badge">{post.topic}</div>
                    <div className="post-header-body">
                      <div className="post-title">{post.title}</div>
                      <div className="post-description">{post.content}</div>
                    </div>
                  </div>
                  <div className="post-footer">
                    <div className="post-meta">
                      {post.location} · {post.time} · 조회 {post.views}
                    </div>
                    <div className="post-comments">
                      <img alt="chat" src={imgComponent592} className="comment-icon" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* 하단 네비게이션 바 */}
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

        {/* 글쓰기 플로팅 버튼 */}
        <button className="write-btn" onClick={onWritePost}>
          <img alt="plus" src={imgPlus} className="write-icon" />
          <span>글쓰기</span>
        </button>
      </div>
    </div>
  );
}

export default CommunityLife;
