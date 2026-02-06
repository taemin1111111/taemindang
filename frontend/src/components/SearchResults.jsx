import { useState, useEffect, useRef } from 'react';
import './SearchResults.css';
import api from '../utils/axios.js';

// Figma 이미지 URL
const imgChevronLeft = "https://www.figma.com/api/mcp/asset/d51ef680-70fe-4cf5-a813-8a77926678e0";
const imgCloseX = "https://www.figma.com/api/mcp/asset/b6374da6-a08a-4db9-a3d9-024d5f4392fa";
const imgComponent592 = "https://www.figma.com/api/mcp/asset/a4b6fbde-2451-4bd4-ac2c-60858250f84f";
const imgFavorite = "https://www.figma.com/api/mcp/asset/c06d1623-6231-4c6b-a839-e0d42b3fc780";
const imgFavoriteHeart = "https://www.figma.com/api/mcp/asset/b62a9d96-00d4-4640-b7ca-2dde42f9ccea"; // 하트 아이콘 (중고거래용)
const imgArrowDown = "https://www.figma.com/api/mcp/asset/fbd57670-08b7-4b27-bb74-5f07f5ffa5c4";

function SearchResults({ keyword, onClose, onItemClick, onNavigate }) {
  const [items, setItems] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(keyword || '');
  const [showItemsMore, setShowItemsMore] = useState(false);
  const [showPostsMore, setShowPostsMore] = useState(false);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    setSearchQuery(keyword || '');
    setShowItemsMore(false);
    setShowPostsMore(false);
    if (!keyword || !keyword.trim()) {
      setLoading(false);
      setItems([]);
      setPosts([]);
      return;
    }
    const currentId = fetchIdRef.current + 1;
    fetchIdRef.current = currentId;

    setLoading(true);
    const searchKeyword = keyword.trim();

    const fetchSearchResults = async () => {
      try {
        const [itemsResponse, postsResponse] = await Promise.all([
          api.get('/items', { params: { search: searchKeyword } }),
          api.get('/community/posts', { params: { search: searchKeyword } })
        ]);

        // 이 요청이 이미 뒤쳐진 경우 무시 (뒤에 온 요청이 덮어쓰지 않도록)
        if (currentId !== fetchIdRef.current) return;

        const itemsData = itemsResponse?.data?.success ? (itemsResponse.data.data || []) : [];
        const postsData = postsResponse?.data?.success ? (postsResponse.data.data || []) : [];
        setItems(Array.isArray(itemsData) ? itemsData : []);
        setPosts(Array.isArray(postsData) ? postsData : []);
      } catch (error) {
        if (currentId !== fetchIdRef.current) return;
        setItems([]);
        setPosts([]);
      } finally {
        if (currentId === fetchIdRef.current) setLoading(false);
      }
    };

    fetchSearchResults();
  }, [keyword]);

  // 검색 키워드 하이라이트 함수
  const highlightKeyword = (text, keyword) => {
    if (!keyword || !text) return text;
    
    const regex = new RegExp(`(${keyword})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <strong key={index} style={{ fontWeight: 'bold' }}>{part}</strong>
      ) : (
        part
      )
    );
  };

  // 시간 포맷팅
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

  // 가격 포맷팅
  const formatPrice = (price) => {
    return `${parseInt(price).toLocaleString()}원`;
  };

  // 검색어 클리어
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="mobile-container">
      <div className="search-results-screen">
        {/* 상단 44px 상태바 공간 */}
        <div className="search-results-status-bar" aria-hidden="true" />
        {/* 네비게이션 바 */}
        <div className="search-results-nav-bar">
          <div className="search-results-nav-content">
            <div className="search-results-nav-left">
              <button className="search-results-back-btn" onClick={onClose}>
                <img alt="back" src={imgChevronLeft} className="search-results-back-icon" />
              </button>
            </div>
            <div 
              className="search-results-input-wrapper"
              onClick={() => {
                // 검색 화면으로 이동
                if (onNavigate) {
                  onNavigate('search');
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="search-results-input-container">
                {searchQuery && (
                  <span className="search-results-input-text">{searchQuery}</span>
                )}
                {searchQuery && (
                  <button 
                    className="search-results-clear-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSearch();
                    }}
                  >
                    <img alt="clear" src={imgCloseX} className="search-results-clear-icon" />
                  </button>
                )}
              </div>
            </div>
            <div className="search-results-nav-right">
              <button className="search-results-close-btn" onClick={onClose}>
                닫기
              </button>
            </div>
          </div>
        </div>

        {/* 검색 결과 영역 */}
        <div className="search-results-content">
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>
          ) : showItemsMore ? (
            /* 중고거래 더보기 화면 */
            <div className="search-results-items-more">
              <div className="search-results-section-header">
                <h2 className="search-results-section-title">중고거래</h2>
              </div>
              <div className="search-results-items-list">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="search-results-item-card"
                    onClick={() => onItemClick && onItemClick(item.id)}
                  >
                    <div className="search-results-item-thumbnail">
                      {item.image_url ? (
                        <img alt={item.title} src={item.image_url} className="search-results-item-image" />
                      ) : (
                        <div className="search-results-item-placeholder" />
                      )}
                    </div>
                    <div className="search-results-item-content">
                      <div className="search-results-item-header">
                        <h3 className="search-results-item-title">{item.title}</h3>
                      </div>
                      <div className="search-results-item-meta">
                        <span>{item.neighborhood} · {formatTimeAgo(item.created_at)}</span>
                      </div>
                      <div className="search-results-item-price">
                        {formatPrice(item.price)}
                      </div>
                      <div className="search-results-item-footer">
                        <div className="search-results-item-engagement">
                          <img alt="chat" src={imgComponent592} className="search-results-engagement-icon" />
                          <span>{item.chat_count || 0}</span>
                          <img alt="favorite" src={imgFavoriteHeart} className="search-results-engagement-icon-heart" />
                          <span>{item.like_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : showPostsMore ? (
            /* 동네생활 더보기 화면 */
            <div className="search-results-posts-more">
              <div className="search-results-section-header">
                <h2 className="search-results-section-title">동네생활</h2>
              </div>
              <div className="search-results-posts-list">
                {posts.map((post) => (
                  <div 
                    key={post.id} 
                    className="search-results-post-card"
                    onClick={() => onNavigate && onNavigate('communityPostDetail', post.id)}
                  >
                    <div className="search-results-post-badge">{post.topic || post.category}</div>
                    <div className="search-results-post-header">
                      <h3 className="search-results-post-title">{highlightKeyword(post.title, keyword)}</h3>
                    </div>
                    <div className="search-results-post-content">
                      {highlightKeyword(post.content, keyword)}
                    </div>
                    <div className="search-results-post-footer">
                      <div className="search-results-post-meta">
                        <span>{post.location || post.neighborhood} · {formatTimeAgo(post.time || post.created_at)} · 조회 {post.views || post.view_count || 0}</span>
                      </div>
                      <div className="search-results-post-engagement">
                        <img alt="chat" src={imgComponent592} className="search-results-engagement-icon" />
                        <span>{post.comments || post.comment_count || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* 중고거래 섹션 */}
              {items.length > 0 && !showPostsMore && (
                <div className="search-results-section">
                  <div className="search-results-section-header">
                    <h2 className="search-results-section-title">중고거래</h2>
                  </div>
                  <div className="search-results-items-list">
                    {items.slice(0, 3).map((item) => (
                      <div 
                        key={item.id} 
                        className="search-results-item-card"
                        onClick={() => onItemClick && onItemClick(item.id)}
                      >
                        <div className="search-results-item-thumbnail">
                          {item.image_url ? (
                            <img alt={item.title} src={item.image_url} className="search-results-item-image" />
                          ) : (
                            <div className="search-results-item-placeholder" />
                          )}
                        </div>
                        <div className="search-results-item-content">
                          <div className="search-results-item-header">
                            <h3 className="search-results-item-title">{item.title}</h3>
                          </div>
                          <div className="search-results-item-meta">
                            <span>{item.neighborhood} · {formatTimeAgo(item.created_at)}</span>
                          </div>
                          <div className="search-results-item-price">
                            {formatPrice(item.price)}
                          </div>
                          <div className="search-results-item-footer">
                          <div className="search-results-item-engagement">
                            <img alt="chat" src={imgComponent592} className="search-results-engagement-icon" />
                            <span>{item.chat_count || 0}</span>
                            <img alt="favorite" src={imgFavoriteHeart} className="search-results-engagement-icon-heart" />
                            <span>{item.like_count || 0}</span>
                          </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {items.length > 3 && (
                    <div 
                      className="search-results-more-btn"
                      onClick={() => setShowItemsMore(true)}
                    >
                      <span>중고거래 더보기</span>
                      <div className="search-results-arrow-container">
                        <img alt="arrow" src={imgArrowDown} className="search-results-arrow-icon" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 구분선 */}
              {(items.length > 0 && posts.length > 0) && (
                <div className="search-results-divider" />
              )}

              {/* 동네생활 섹션 */}
              {posts.length > 0 && !showPostsMore && (
                <div className="search-results-section">
                  <div className="search-results-section-header">
                    <h2 className="search-results-section-title">동네생활</h2>
                  </div>
                  <div className="search-results-posts-list">
                    {posts.slice(0, 3).map((post) => (
                      <div 
                        key={post.id} 
                        className="search-results-post-card"
                        onClick={() => onNavigate && onNavigate('communityPostDetail', post.id)}
                      >
                        <div className="search-results-post-badge">{post.topic || post.category}</div>
                        <div className="search-results-post-header">
                          <h3 className="search-results-post-title">{post.title}</h3>
                        </div>
                        <div className="search-results-post-content">
                          {post.content}
                        </div>
                        <div className="search-results-post-footer">
                          <div className="search-results-post-meta">
                            <span>{post.location || post.neighborhood} · {formatTimeAgo(post.time || post.created_at)} · 조회 {post.views || post.view_count || 0}</span>
                          </div>
                          <div className="search-results-post-engagement">
                            <img alt="chat" src={imgComponent592} className="search-results-engagement-icon" />
                            <span>{post.comments || post.comment_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {posts.length > 3 && (
                    <div 
                      className="search-results-more-btn"
                      onClick={() => setShowPostsMore(true)}
                    >
                      <span>동네생활 더보기</span>
                      <div className="search-results-arrow-container">
                        <img alt="arrow" src={imgArrowDown} className="search-results-arrow-icon" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 검색 결과가 없을 때 */}
              {items.length === 0 && posts.length === 0 && (
                <div className="search-results-empty">
                  <p>검색 결과가 없습니다.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchResults;
