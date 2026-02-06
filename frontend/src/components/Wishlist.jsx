import { useState, useEffect } from 'react';
import './Wishlist.css';
import './Home.css'; /* product-card 스타일 재사용 */
import api from '../utils/axios.js';

const imgThumbnail = 'https://www.figma.com/api/mcp/asset/29745e78-527b-44cc-9de9-4ef63a65b15f';
const imgComponent592 = 'https://www.figma.com/api/mcp/asset/43b1bb59-9ac5-4ab2-b560-97dce79d6e1a';
const imgFavoriteIcon = 'https://www.figma.com/api/mcp/asset/ef975df3-be81-4998-b3eb-aefab1bab9b1';

function Wishlist({ onClose, onItemClick }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiked = async () => {
      try {
        setLoading(true);
        const res = await api.get('/items/liked');
        if (res.data.success) {
          setItems(res.data.data || []);
        }
      } catch (err) {
        console.error('관심목록 조회 오류:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLiked();
  }, []);

  const formatPrice = (price) => `${parseInt(price).toLocaleString()}원`;

  // 찜 취소 (기존 POST /items/:id/like 토글 로직 사용)
  const handleUnlike = async (itemId, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/items/${itemId}/like`);
      if (res.data.success && res.data.data?.is_liked === false) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    } catch (err) {
      console.error('찜 해제 오류:', err);
      if (err.response?.status === 401) {
        alert('로그인이 필요합니다');
      } else {
        alert('찜 해제 중 오류가 발생했습니다');
      }
    }
  };

  return (
    <div className="mobile-container">
      <div className="wishlist-screen">
        {/* 상태바 제거: 네비 top: 0 (Figma 1383-46696) */}
        <header className="wishlist-nav">
          <button type="button" className="wishlist-back" onClick={onClose} aria-label="뒤로">
            <BackIcon />
          </button>
          <h1 className="wishlist-title">관심목록</h1>
          <div className="wishlist-nav-right" />
        </header>

        <div className="wishlist-content">
          {loading ? (
            <div className="wishlist-loading">로딩 중...</div>
          ) : items.length === 0 ? (
            <div className="wishlist-empty">관심목록이 비어있습니다</div>
          ) : (
            <div className="wishlist-list">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="wishlist-card product-card"
                  onClick={() => onItemClick && onItemClick(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onItemClick && onItemClick(item.id)}
                >
                  <div className="product-thumbnail">
                    {item.image_url ? (
                      <img alt={item.title} src={item.image_url} />
                    ) : (
                      <img alt="product" src={imgThumbnail} />
                    )}
                  </div>
                  <div className="product-content wishlist-product-content">
                    <button
                      type="button"
                      className="wishlist-heart"
                      onClick={(e) => handleUnlike(item.id, e)}
                      aria-label="찜 취소"
                    >
                      <HeartFilledIcon />
                    </button>
                    <div className="product-header">
                      <h3 className="product-title">{item.title}</h3>
                    </div>
                    <div className="product-meta">
                      <span className="product-location">{item.neighborhood}</span>
                    </div>
                    <div className="wishlist-row">
                      {item.status === 'SOLD' && (
                        <span className="wishlist-badge">거래완료</span>
                      )}
                      <span className="product-price">
                        <span>{formatPrice(item.price)}</span>
                      </span>
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
              ))}
            </div>
          )}
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

function HeartFilledIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#E84C4C" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

export default Wishlist;
