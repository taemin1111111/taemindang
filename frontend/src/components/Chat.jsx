import { useState, useEffect } from 'react';
import './Chat.css';
import './Home.css'; /* 하단 네비 홈과 동일 (아이콘·스타일) */
import api, { getImageUrl } from '../utils/axios.js';
import emptyChatIcon from '../assets/empty-chat-icon.svg';
import defaultAvatar from '../assets/ratio.png';

// 하단 네비: Home.jsx와 동일한 이미지 URL
const imgHome = 'https://www.figma.com/api/mcp/asset/707b20f6-6020-4277-be16-9b287c16318d';
const imgCalendar = 'https://www.figma.com/api/mcp/asset/cd973a00-ef54-460c-bb86-0cfef0cae751';
const imgChat = 'https://www.figma.com/api/mcp/asset/de5e9a0c-ff36-4704-b04c-931d926cf31c';
const imgUser = 'https://www.figma.com/api/mcp/asset/4416fe6a-fe9f-4b58-ad21-e1c740c18f45';

function Chat({ onNavigate, embedded = false }) {
  const [selectedFilter, setSelectedFilter] = useState('전체');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestMessages, setLatestMessages] = useState({}); // chat_id: latest message
  const currentScreen = 'chat';

  const filters = ['전체', '판매', '구매', '안 읽은 채팅방'];

  // 시간 포맷팅 함수
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

  // 채팅방 목록 조회
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/chats');
        
        if (response.data.success) {
          const chatsData = response.data.data;
          setChats(chatsData);

          // 최신 메시지 정보를 latestMessages에 저장
          const messagesMap = {};
          chatsData.forEach(chat => {
            if (chat.latest_message) {
              messagesMap[chat.id] = {
                message: chat.latest_message,
                created_at: chat.latest_message_time
              };
            }
          });
          setLatestMessages(messagesMap);
        }
      } catch (error) {
        console.error('채팅방 목록 조회 오류:', error);
        if (error.response?.status === 401) {
          // 로그인 필요
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  // 필터링된 채팅방 목록
  const filteredChats = chats.filter(chat => {
    if (selectedFilter === '전체') return true;
    if (selectedFilter === '판매') return chat.is_seller;
    if (selectedFilter === '구매') return !chat.is_seller;
    if (selectedFilter === '안 읽은 채팅방') return chat.unread_count > 0;
    return true;
  });

  const screen = (
    <div className="chat-screen">
        {/* 상단 44px 상태바 공간 */}
        <div className="chat-status-bar" aria-hidden="true" />
        {/* 네비게이션 바 */}
        <div className="chat-nav-bar">
          <div className="chat-nav-content">
            <div className="chat-nav-title">
              <h1 className="chat-title">채팅</h1>
            </div>
            <div className="chat-nav-right">
              {/* 오른쪽 아이콘들 (현재는 숨김) */}
            </div>
          </div>
        </div>

        {/* 필터 버튼들 */}
        <div className="chat-filters">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`chat-filter-btn ${selectedFilter === filter ? 'chat-filter-btn-active' : ''}`}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="chat-content">
          {/* 채팅방 목록 또는 빈 상태 */}
        {loading ? (
          <div className="chat-loading">
            <p className="chat-loading-text">로딩 중...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="chat-empty">
            <img src={emptyChatIcon} alt="empty chat" className="chat-empty-icon" />
            <p className="chat-empty-text">대화방이 없어요</p>
          </div>
        ) : (
          <div className="chat-list">
            {filteredChats.map((chat) => {
              const latestMessage = latestMessages[chat.id];
              const userStr = localStorage.getItem('user');
              let currentUserNeighborhood = '';
              if (userStr) {
                try {
                  const user = JSON.parse(userStr);
                  currentUserNeighborhood = user.neighborhood || '';
                } catch (error) {
                  console.error('사용자 정보 파싱 오류:', error);
                }
              }

              return (
                <div 
                  key={chat.id} 
                  className="chat-item"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('chatRoom', null, null, chat.id);
                    }
                  }}
                >
                  <div className="chat-item-content">
                    {/* 상대방 프로필 이미지 */}
                    <div className="chat-item-profile">
                      <div className="chat-profile-avatar">
                        <img src={getImageUrl(chat.other_user_profile_image) || defaultAvatar} alt="" className="chat-profile-avatar-img" />
                      </div>
                    </div>

                    {/* 채팅 정보 */}
                    <div className="chat-item-info">
                      <div className="chat-item-header">
                        <span className="chat-item-name">{chat.other_user_nickname || '사용자'}</span>
                        <span className="chat-item-separator">·</span>
                        <span className="chat-item-tag">{currentUserNeighborhood || '동네이름'}</span>
                        {latestMessage && (
                          <>
                            <span className="chat-item-separator">·</span>
                            <span className="chat-item-tag">
                              {formatTimeAgo(latestMessage.created_at)}
                            </span>
                          </>
                        )}
                        {chat.unread_count > 0 && (
                          <div className="chat-unread-badge">
                            {chat.unread_count}
                          </div>
                        )}
                      </div>
                      <p className="chat-item-message">
                        {latestMessage ? latestMessage.message : '메시지가 없습니다'}
                      </p>
                    </div>

                    {/* 상품 썸네일 */}
                    <div className="chat-item-thumbnail">
                      {chat.item_image ? (
                        <img 
                          src={getImageUrl(chat.item_image)} 
                          alt={chat.item_title} 
                          className="chat-thumbnail-image"
                        />
                      ) : (
                        <div className="chat-thumbnail-placeholder" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
  );
  if (embedded) return screen;
  return <div className="mobile-container">{screen}</div>;
}

export default Chat;
