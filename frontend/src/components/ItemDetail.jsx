import { useState, useEffect } from 'react';
import './ItemDetail.css';
import api from '../utils/axios.js';

// Figma 이미지 URL
const imgChevronLeft = "https://www.figma.com/api/mcp/asset/212006ba-0ec7-43c9-9d14-d1e24fda4086";
const imgHeart = "https://www.figma.com/api/mcp/asset/332708fe-4719-4185-aa22-00cb290eed7b";
const imgHeartFilled = "https://www.figma.com/api/mcp/asset/630b7fa8-72fc-4e8a-8803-a790725f8258";

function ItemDetail({ itemId, onClose, onItemClick }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const fetchItemDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/items/${itemId}`);
        
        if (response.data.success) {
          const itemData = response.data.data;
          setItem(itemData);
          setIsLiked(itemData.is_liked || false);
          setLikeCount(itemData.like_count || 0);
        }
      } catch (error) {
        console.error('상품 상세 조회 오류:', error);
        alert('상품 정보를 불러올 수 없습니다');
        if (onClose) onClose();
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItemDetail();
    }
  }, [itemId, onClose]);

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

  // 찜 버튼 클릭 핸들러
  const handleLikeClick = async () => {
    try {
      const response = await api.post(`/items/${itemId}/like`);
      
      if (response.data.success) {
        setIsLiked(response.data.data.is_liked);
        setLikeCount(response.data.data.like_count);
      }
    } catch (error) {
      console.error('찜 추가/삭제 오류:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다');
      } else {
        alert('찜 추가/삭제 중 오류가 발생했습니다');
      }
    }
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="item-detail-screen">
          <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  const currentImage = item.images && item.images.length > 0 ? item.images[currentImageIndex] : null;
  const totalImages = item.images ? item.images.length : 0;

  return (
    <div className="mobile-container">
      <div className="item-detail-screen">
        {/* 이미지 슬라이더 */}
        <div className="item-image-section">
          {currentImage ? (
            <img 
              alt={item.title} 
              src={currentImage.image_url} 
              className="item-main-image"
            />
          ) : (
            <div className="item-main-image-placeholder" />
          )}
          {totalImages > 1 && (
            <>
              <div className="item-image-counter">
                {currentImageIndex + 1} / {totalImages}
              </div>
              <button 
                className="item-image-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
                }}
              >
                ‹
              </button>
              <button 
                className="item-image-next"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
                }}
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* 네비게이션 바 */}
        <div className="item-nav-bar">
          <div className="item-nav-content">
            <div className="item-nav-left">
              <button className="item-back-btn" onClick={onClose}>
                <img alt="back" src={imgChevronLeft} className="item-back-icon" />
              </button>
            </div>
            <div className="item-nav-right"></div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="item-content">
          {/* 판매자 정보 */}
          <div className="item-seller-section">
            <div className="item-seller-info">
              <div className="item-seller-avatar">
                {item.seller_nickname ? item.seller_nickname.charAt(0) : '?'}
              </div>
              <div className="item-seller-details">
                <p className="item-seller-name">{item.seller_nickname || '판매자'}</p>
                <p className="item-seller-location">{item.seller_neighborhood || item.neighborhood}</p>
              </div>
            </div>
            <div className="item-seller-temp">
              <span>{item.seller_temperature || 36.5}°C</span>
            </div>
          </div>

          {/* 상품 정보 */}
          <div className="item-info-section">
            <h1 className="item-title">{item.title}</h1>
            <p className="item-price-large">{formatPrice(item.price)}</p>
            <p className="item-time">{formatTimeAgo(item.created_at)}</p>
            <p className="item-description">{item.description}</p>
          </div>

          {/* 판매자의 다른 상품 */}
          {item.other_items && item.other_items.length > 0 && (
            <div className="item-other-section">
              <div className="item-other-header">
                <h2 className="item-other-title">{item.seller_nickname || '판매자'}님의 판매 물품</h2>
              </div>
              <div className="item-other-list">
                {item.other_items.map((otherItem) => (
                  <div 
                    key={otherItem.id} 
                    className="item-other-card"
                    onClick={() => {
                      if (onItemClick) {
                        onItemClick(otherItem.id);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {otherItem.image_url ? (
                      <img 
                        alt={otherItem.title} 
                        src={otherItem.image_url} 
                        className="item-other-image"
                      />
                    ) : (
                      <div className="item-other-image-placeholder" />
                    )}
                    <div className="item-other-info">
                      <p className="item-other-name">{otherItem.title}</p>
                      <p className="item-other-price">{formatPrice(otherItem.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 하단 고정 바 */}
        <div className="item-footer">
          <div className="item-footer-content">
            <button className="item-heart-btn" onClick={handleLikeClick}>
              <img 
                alt="heart" 
                src={isLiked ? imgHeartFilled : imgHeart} 
                className="item-heart-icon" 
              />
            </button>
            <div className="item-footer-price">{formatPrice(item.price)}</div>
            <button className="item-chat-btn">
              대화 중인 채팅 1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetail;
