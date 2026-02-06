import { useState, useEffect } from 'react';
import './PurchaseHistory.css';
import './Home.css'; /* product-card 스타일 재사용 */
import api from '../utils/axios.js';

const imgThumbnail = 'https://www.figma.com/api/mcp/asset/29745e78-527b-44cc-9de9-4ef63a65b15f';
const imgComponent592 = 'https://www.figma.com/api/mcp/asset/43b1bb59-9ac5-4ab2-b560-97dce79d6e1a';
const imgFavoriteIcon = 'https://www.figma.com/api/mcp/asset/ef975df3-be81-4998-b3eb-aefab1bab9b1';

function PurchaseHistory({ onClose, onItemClick }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchased = async () => {
      try {
        setLoading(true);
        const res = await api.get('/items/purchased');
        if (res.data.success) {
          setItems(res.data.data || []);
        }
      } catch (err) {
        console.error('내 구매 목록 조회 오류:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchased();
  }, []);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
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

  const formatPrice = (price) => `${parseInt(price).toLocaleString()}원`;

  return (
    <div className="mobile-container">
      <div className="purchase-history-screen">
        <div className="purchase-history-status-bar" aria-hidden="true" />
        <header className="purchase-history-nav">
          <button type="button" className="purchase-history-back" onClick={onClose} aria-label="뒤로">
            <BackIcon />
          </button>
          <h1 className="purchase-history-title">나의 구매내역</h1>
          <div className="purchase-history-nav-right" />
        </header>

        <div className="purchase-history-content">
          {loading ? (
            <div className="purchase-history-loading">로딩 중...</div>
          ) : items.length === 0 ? (
            <div className="purchase-history-empty">구매한 상품이 없습니다</div>
          ) : (
            <div className="purchase-history-list">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="purchase-history-card product-card"
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
                  <div className="product-content">
                    <div className="product-header">
                      <h3 className="product-title">{item.title}</h3>
                    </div>
                    <div className="product-meta">
                      <span className="product-location">{item.neighborhood}</span>
                    </div>
                    <div className="purchase-history-row">
                      <span className="purchase-history-badge">거래완료</span>
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

export default PurchaseHistory;
