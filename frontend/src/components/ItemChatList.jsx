import { useState, useEffect } from 'react';
import './ItemChatList.css';
import api from '../utils/axios.js';
import emptyChatIcon from '../assets/empty-chat-icon.svg';
import defaultAvatar from '../assets/ratio.png';

function ItemChatList({ itemId, onClose, onNavigate }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestMessages, setLatestMessages] = useState({});

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

  useEffect(() => {
    const fetchChats = async () => {
      if (!itemId) return;
      try {
        setLoading(true);
        const response = await api.get('/chats');
        if (response.data.success) {
          const allChats = response.data.data || [];
          const forItem = allChats.filter((c) => c.item_id === parseInt(itemId, 10));
          setChats(forItem);
          const messagesMap = {};
          forItem.forEach((chat) => {
            if (chat.latest_message != null) {
              messagesMap[chat.id] = {
                message: chat.latest_message,
                created_at: chat.latest_message_time
              };
            }
          });
          setLatestMessages(messagesMap);
        }
      } catch (error) {
        console.error('채팅 목록 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [itemId]);

  let currentUserNeighborhood = '';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      currentUserNeighborhood = user.neighborhood || '';
    }
  } catch (e) {}

  return (
    <div className="mobile-container">
      <div className="item-chat-list-screen">
        {/* 네비게이션 바 - top: 0 (상태바 제거), Figma 1876-4993 */}
        <div className="item-chat-list-nav">
          <button type="button" className="item-chat-list-back" onClick={onClose} aria-label="뒤로">
            <BackIcon />
          </button>
          <h1 className="item-chat-list-title">대화중인 채팅</h1>
          <div className="item-chat-list-nav-right" />
        </div>

        <div className="item-chat-list-content">
          {loading ? (
            <div className="item-chat-list-loading">
              <p className="item-chat-list-loading-text">로딩 중...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="item-chat-list-empty">
              <img src={emptyChatIcon} alt="" className="item-chat-list-empty-icon" />
              <p className="item-chat-list-empty-text">대화방이 없어요</p>
            </div>
          ) : (
            <div className="item-chat-list-list">
              {chats.map((chat) => {
                const latestMessage = latestMessages[chat.id];
                return (
                  <div
                    key={chat.id}
                    className="item-chat-list-item"
                    onClick={() => onNavigate && onNavigate('chatRoom', null, null, chat.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onNavigate && onNavigate('chatRoom', null, null, chat.id)}
                  >
                    <div className="item-chat-list-item-content">
                      <div className="item-chat-list-profile">
                        <div className="item-chat-list-avatar">
                          <img src={chat.other_user_profile_image || defaultAvatar} alt="" className="item-chat-list-avatar-img" />
                        </div>
                      </div>
                      <div className="item-chat-list-info">
                        <div className="item-chat-list-header">
                          <span className="item-chat-list-name">{chat.other_user_nickname || '사용자'}</span>
                          <span className="item-chat-list-sep">·</span>
                          <span className="item-chat-list-tag">{currentUserNeighborhood || '동네'}</span>
                          {latestMessage && (
                            <>
                              <span className="item-chat-list-sep">·</span>
                              <span className="item-chat-list-tag">{formatTimeAgo(latestMessage.created_at)}</span>
                            </>
                          )}
                          {chat.unread_count > 0 && (
                            <div className="item-chat-list-unread">{chat.unread_count}</div>
                          )}
                        </div>
                        <p className="item-chat-list-message">
                          {latestMessage ? latestMessage.message : '메시지가 없습니다'}
                        </p>
                      </div>
                      <div className="item-chat-list-thumb">
                        {chat.item_image ? (
                          <img src={chat.item_image} alt="" className="item-chat-list-thumb-img" />
                        ) : (
                          <div className="item-chat-list-thumb-placeholder" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Indicator 제거, 공간만 padding-bottom: 34px 유지 */}
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

export default ItemChatList;
