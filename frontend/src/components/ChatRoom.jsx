import { useState, useEffect, useRef } from 'react';
import './ChatRoom.css';
import api from '../utils/axios.js';
import defaultAvatar from '../assets/ratio.png';

// Figma 이미지 URL
const imgChevronLeft = "https://www.figma.com/api/mcp/asset/d51ef680-70fe-4cf5-a813-8a77926678e0";
const imgPicFill = "https://www.figma.com/api/mcp/asset/b53971d4-458b-4ca7-87f9-5ce95bdfb295";
const imgChattingSend = "https://www.figma.com/api/mcp/asset/4208ac66-e279-4115-8ccf-c4c8c02cc090";
// 약속잡기 버튼용 캘린더 아이콘 (Iconly Bold Calendar, 12px)
const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="chat-room-appointment-icon" aria-hidden>
    <path fillRule="evenodd" clipRule="evenodd" d="M8.20544 1.38431L8.20593 1.75912C9.58326 1.86707 10.4931 2.8056 10.4946 4.24488L10.5 8.45777C10.502 10.027 9.51612 10.9925 7.9359 10.995L4.07594 11C2.5056 11.002 1.50741 10.0135 1.50543 8.43977L1.5 4.27636C1.49803 2.82759 2.37576 1.89155 3.75309 1.76512L3.75259 1.39031C3.7521 1.17042 3.91501 1.005 4.13222 1.005C4.34943 1.0045 4.51234 1.16942 4.51283 1.38931L4.51333 1.73913L7.44569 1.73513L7.4452 1.38531C7.4447 1.16542 7.60761 1.0005 7.82482 1C8.0371 0.999501 8.20495 1.16442 8.20544 1.38431ZM2.26074 4.43078L9.73481 4.42079V4.24587C9.71358 3.17141 9.1745 2.60769 8.20692 2.52374L8.20741 2.90854C8.20741 3.12344 8.04006 3.29385 7.82778 3.29385C7.61057 3.29435 7.44717 3.12444 7.44717 2.90954L7.44668 2.50475L4.51431 2.50874L4.51481 2.91304C4.51481 3.12843 4.35239 3.29835 4.13518 3.29835C3.91797 3.29885 3.75456 3.12943 3.75456 2.91404L3.75407 2.52923C2.79142 2.62569 2.25876 3.1914 2.26024 4.27536L2.26074 4.43078ZM7.61995 6.70214V6.70764C7.62489 6.93753 7.81248 7.11194 8.04006 7.10694C8.26221 7.10144 8.43943 6.91104 8.4345 6.68115C8.42413 6.46127 8.24592 6.28185 8.02426 6.28235C7.79718 6.28735 7.61946 6.47226 7.61995 6.70214ZM8.02772 8.94602C7.80063 8.94102 7.61748 8.75162 7.61699 8.52173C7.61205 8.29185 7.79421 8.10144 8.0213 8.09595H8.02624C8.25826 8.09595 8.44635 8.28535 8.44635 8.52023C8.44684 8.75512 8.25925 8.94552 8.02772 8.94602ZM5.58606 6.71014C5.59593 6.94002 5.78402 7.11943 6.0111 7.10944C6.23325 7.09895 6.41048 6.90904 6.4006 6.67916C6.39517 6.45427 6.21252 6.27936 5.99037 6.27986C5.76328 6.28985 5.58556 6.48026 5.58606 6.71014ZM6.01308 8.92353C5.78599 8.93353 5.5984 8.75412 5.58803 8.52423C5.58803 8.29435 5.76526 8.10444 5.99234 8.09395C6.21449 8.09345 6.39764 8.26836 6.40258 8.49275C6.41294 8.72313 6.23522 8.91304 6.01308 8.92353ZM3.55216 6.72763C3.56203 6.95752 3.75012 7.13743 3.97721 7.12693C4.19935 7.11694 4.37658 6.92653 4.36621 6.69665C4.36128 6.47176 4.17862 6.29685 3.95598 6.29735C3.72889 6.30734 3.55167 6.49775 3.55216 6.72763ZM3.97918 8.92603C3.75209 8.93653 3.5645 8.75662 3.55414 8.52673C3.55364 8.29685 3.73136 8.10644 3.95845 8.09645C4.1806 8.09595 4.36374 8.27086 4.36868 8.49575C4.37905 8.72563 4.20182 8.91604 3.97918 8.92603Z" fill="#2B2B2B"/>
  </svg>
);
// 판매중 오른쪽 아래 방향 화살표 (상품 상세 펼치기용)
const ArrowDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="chat-room-item-arrow-svg">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function ChatRoom({ chatId, onClose, onNavigateToAppointment }) {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [sendingImage, setSendingImage] = useState(false);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [statusModalMessage, setStatusModalMessage] = useState(null);

  useEffect(() => {
    // 현재 로그인한 사용자 ID 가져오기
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
      }
    }

    if (!chatId) {
      console.error('chatId가 없습니다!');
      return;
    }

    const fetchChatRoom = async () => {
      try {
        setLoading(true);
        
        // 채팅방 상세 정보 조회
        const chatResponse = await api.get(`/chats/${chatId}`);
        if (chatResponse.data.success) {
          const chatData = chatResponse.data.data;
          setChat(chatData);
          
          // 상품 정보 조회
          if (chatData.item_id) {
            const itemResponse = await api.get(`/items/${chatData.item_id}`);
            if (itemResponse.data.success) {
              setItem(itemResponse.data.data);
            }
          }
        } else {
          alert(chatResponse.data.message || '채팅방 정보를 불러올 수 없습니다');
          if (onClose) onClose();
          return;
        }
        
        // 채팅방 메시지 조회
        const messagesResponse = await api.get(`/chats/${chatId}/messages`);
        if (messagesResponse.data.success) {
          const messagesData = messagesResponse.data.data.messages || [];
          setMessages(messagesData);
        }
      } catch (error) {
        console.error('채팅방 조회 오류:', error);
        alert(error.response?.data?.message || '채팅방 정보를 불러올 수 없습니다');
        if (onClose) onClose();
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      fetchChatRoom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      return;
    }

    try {
      const response = await api.post(`/chats/${chatId}/messages`, {
        message: messageText.trim()
      });

      if (response.data.success) {
        setMessageText('');
        
        // 메시지 목록 다시 조회
        const messagesResponse = await api.get(`/chats/${chatId}/messages`);
        if (messagesResponse.data.success) {
          setMessages(messagesResponse.data.data.messages || []);
        }
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다');
      } else {
        alert(error.response?.data?.message || '메시지 전송 중 오류가 발생했습니다');
      }
    }
  };

  // 사진 전송 (MESSAGE는 ''로 전송, image_url에 저장)
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;
    e.target.value = '';

    const formData = new FormData();
    formData.append('image', file);
    formData.append('message', messageText.trim() || '');

    try {
      setSendingImage(true);
      const response = await api.post(`/chats/${chatId}/messages`, formData);
      if (response.data.success) {
        setMessageText('');
        const messagesResponse = await api.get(`/chats/${chatId}/messages`);
        if (messagesResponse.data.success) {
          setMessages(messagesResponse.data.data.messages || []);
        }
      }
    } catch (error) {
      console.error('사진 전송 오류:', error);
      alert(error.response?.data?.message || '사진 전송 중 오류가 발생했습니다');
    } finally {
      setSendingImage(false);
    }
  };

  // 거래 상태 변경 (거래완료 → SOLD + buyer_id 저장, 판매중 되돌리기 → SELLING + buyer_id NULL)
  const handleItemStatusChange = async (status) => {
    if (!chatId || !item) return;
    try {
      const response = await api.patch(`/chats/${chatId}/item-status`, { status });
      if (response.data.success) {
        setShowStatusSheet(false);
        setStatusModalMessage(status === 'SOLD' ? 'SOLD' : 'SELLING');
        const itemResponse = await api.get(`/items/${item.id}`);
        if (itemResponse.data.success) {
          setItem(itemResponse.data.data);
        }
      }
    } catch (error) {
      console.error('거래 상태 변경 오류:', error);
      alert(error.response?.data?.message || '거래 상태 변경 중 오류가 발생했습니다');
    }
  };

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
    if (diffDays < 30) return `${diffDays}일 전`;
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 시간 포맷팅 (오전/오후)
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;
    return `${ampm} ${displayHours}:${String(minutes).padStart(2, '0')}`;
  };

  // 약속 메시지용: 날짜 "M월 D일 (요일)" (DB: YYYY-MM-DD 또는 ISO 문자열)
  const formatAppointmentDate = (dateStr) => {
    if (!dateStr) return '';
    const str = String(dateStr);
    const d = str.includes('T') ? new Date(str) : new Date(str + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return '';
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
  };
  // 약속 메시지용: 시간 "HH:mm" (서버가 "14:00:00" 형태일 수 있음)
  const formatAppointmentTime = (timeStr) => {
    if (!timeStr) return '';
    const s = String(timeStr);
    return s.length >= 5 ? s.slice(0, 5) : s;
  };

  // 메시지 그룹화 (날짜별)
  const groupMessagesByDate = (messages) => {
    if (!messages || messages.length === 0) {
      return [];
    }

    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach((message, index) => {
      const messageDate = new Date(message.created_at).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            messages: currentGroup
          });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }

      // 마지막 메시지인 경우
      if (index === messages.length - 1) {
        groups.push({
          date: currentDate,
          messages: currentGroup
        });
      }
    });

    return groups;
  };

  // 스크롤을 맨 아래로
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="chat-room-screen">
          <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!chat && !loading) {
    return (
      <div className="mobile-container">
        <div className="chat-room-screen">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>채팅방 정보를 불러올 수 없습니다.</p>
            <button onClick={onClose}>돌아가기</button>
          </div>
        </div>
      </div>
    );
  }

  if (!chat) {
    return null;
  }

  const messageGroups = groupMessagesByDate(messages);
  const otherUserNickname = chat.other_user_nickname || '사용자';
  const otherUserTemperature = chat.other_user_temperature || 36.5;

  return (
    <div className="mobile-container">
      <div className={`chat-room-screen ${item ? 'chat-room-screen--with-item' : ''}`}>
        {/* 상단 44px 상태바 공간 */}
        <div className="chat-room-status-bar" aria-hidden="true" />
        {/* 네비게이션 바 */}
        <div className="chat-room-nav-bar">
          <div className="chat-room-nav-content">
            <div className="chat-room-nav-left">
              <button className="chat-room-back-btn" onClick={onClose}>
                <img alt="back" src={imgChevronLeft} className="chat-room-back-icon" />
              </button>
            </div>
            <div className="chat-room-nav-center">
              <span className="chat-room-nav-name">{otherUserNickname}</span>
              <div className="chat-room-nav-badge">
                <span>{otherUserTemperature}°C</span>
              </div>
            </div>
            <div className="chat-room-nav-right"></div>
          </div>
        </div>

        {/* 상품 정보 섹션 */}
        {item && (
          <div className="chat-room-item-section">
            <div className="chat-room-item-info">
              <div className="chat-room-item-thumbnail">
                {item.images && item.images.length > 0 ? (
                  <img 
                    src={item.images[0].image_url} 
                    alt={item.title}
                    className="chat-room-item-thumbnail-img"
                  />
                ) : (
                  <div className="chat-room-item-thumbnail-placeholder" />
                )}
              </div>
              <div className="chat-room-item-details">
                <div className="chat-room-item-status-row">
                  {chat.is_seller ? (
                    <button
                      type="button"
                      className="chat-room-item-status-btn"
                      onClick={() => setShowStatusSheet(true)}
                      aria-expanded={showStatusSheet}
                      aria-haspopup="dialog"
                    >
                      <span className="chat-room-item-status">
                        {item.status === 'SOLD' ? '거래완료' : '판매중'}
                      </span>
                      <span className="chat-room-item-arrow-wrapper" aria-hidden>
                        <ArrowDownIcon />
                      </span>
                    </button>
                  ) : (
                    <span className="chat-room-item-status chat-room-item-status-text">
                      {item.status === 'SOLD' ? '거래완료' : '판매중'}
                    </span>
                  )}
                  <p className="chat-room-item-title">{item.title}</p>
                </div>
                <p className="chat-room-item-price">{parseInt(item.price).toLocaleString()}원</p>
              </div>
            </div>
            <button type="button" className="chat-room-appointment-btn" onClick={() => onNavigateToAppointment?.()}>
              <CalendarIcon />
              <span>약속잡기</span>
            </button>
          </div>
        )}

        {/* 메시지 영역 */}
        <div className="chat-room-messages">
          {messageGroups.length === 0 ? (
            <div className="chat-room-empty-messages">
              <p>아직 메시지가 없습니다.</p>
            </div>
          ) : (
            messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="chat-room-message-group">
              <div className="chat-room-date-separator">
                {formatDate(group.messages[0].created_at)}
              </div>
              {group.messages.map((message) => {
                if (message.msg_type === 'APPOINTMENT_CONFIRMED') return null;
                const hasConfirmedBelow = message.msg_type === 'APPOINTMENT' && message.appointment_status === 'CONFIRMED';
                return (
                <div 
                  key={message.id} 
                  className={`chat-room-message-item ${message.is_mine ? 'chat-room-message-mine' : ''} ${hasConfirmedBelow ? 'chat-room-message-item-has-confirmed' : ''}`}
                >
                  <div className="chat-room-message-item-row">
                    {!message.is_mine && (
                      <div className="chat-room-message-avatar">
                        <img src={chat?.other_user_profile_image || defaultAvatar} alt="" className="chat-room-message-avatar-img" />
                      </div>
                    )}
                    <div className="chat-room-message-content-wrapper">
                      <div className="chat-room-message-body">
                        {message.msg_type === 'APPOINTMENT' ? (
                          <div className={`chat-room-appointment-card ${message.is_mine ? 'chat-room-appointment-card-mine' : ''}`}>
                            <p className="chat-room-appointment-card-title">{message.message}</p>
                            {message.meet_date && (
                              <p className="chat-room-appointment-card-detail">날짜 : {formatAppointmentDate(message.meet_date)}</p>
                            )}
                            {message.meet_time != null && message.meet_time !== '' && (
                              <p className="chat-room-appointment-card-detail">시간 : {formatAppointmentTime(message.meet_time)}</p>
                            )}
                            <button type="button" className="chat-room-appointment-card-btn" onClick={() => onNavigateToAppointment?.(message.appointment_id)}>
                              약속 보기
                            </button>
                          </div>
                        ) : (
                          <>
                            {message.message != null && message.message !== '' && (
                              <div className={`chat-room-message-bubble ${message.is_mine ? 'chat-room-message-bubble-mine' : ''}`}>
                                {message.message}
                              </div>
                            )}
                            {message.image_url && (
                              <div className={`chat-room-message-bubble chat-room-message-image-wrap ${message.is_mine ? 'chat-room-message-bubble-mine' : ''}`}>
                                <img src={message.image_url} alt="전송된 사진" className="chat-room-message-image" />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <span className={`chat-room-message-time ${message.is_mine ? 'chat-room-message-time-mine' : ''}`}>
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                  {hasConfirmedBelow && (
                    <p className="chat-room-appointment-confirmed-below">
                      {message.sender_nickname || '상대방'}님이 약속을 잡았어요.
                    </p>
                  )}
                </div>
                );
              })}
            </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 하단 입력 바 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          className="chat-room-file-input"
          onChange={handleImageSelect}
          aria-label="사진 첨부"
        />
        <div className="chat-room-input-bar">
          <button
            type="button"
            className="chat-room-pic-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendingImage}
            aria-label="사진 보내기"
          >
            <img alt="pic" src={imgPicFill} className="chat-room-pic-icon" />
          </button>
          <div className="chat-room-input-wrapper">
            <input
              type="text"
              className="chat-room-input"
              placeholder="메세지 보내기"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
          </div>
          <button 
            className={`chat-room-send-btn ${messageText.trim() ? 'chat-room-send-btn-active' : ''}`}
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <img alt="send" src={imgChattingSend} className="chat-room-send-icon" />
          </button>
        </div>

        {/* 판매 상태 선택 바텀시트 (Figma 1383-46928) */}
        {showStatusSheet && (
          <>
            <div
              className="chat-room-status-sheet-overlay"
              onClick={() => setShowStatusSheet(false)}
              onKeyDown={(e) => e.key === 'Escape' && setShowStatusSheet(false)}
              role="button"
              tabIndex={0}
              aria-label="닫기"
            />
            <div className="chat-room-status-sheet" role="dialog" aria-modal="true" aria-label="판매 상태 선택">
              <button
                type="button"
                className="chat-room-status-sheet-option"
                onClick={() => item.status === 'SOLD' ? handleItemStatusChange('SELLING') : setShowStatusSheet(false)}
              >
                판매중
              </button>
              <div className="chat-room-status-sheet-divider" />
              <button
                type="button"
                className="chat-room-status-sheet-option"
                onClick={() => item.status !== 'SOLD' ? handleItemStatusChange('SOLD') : setShowStatusSheet(false)}
              >
                거래완료
              </button>
              <div className="chat-room-status-sheet-divider" />
              <button type="button" className="chat-room-status-sheet-option chat-room-status-sheet-close" onClick={() => setShowStatusSheet(false)}>
                닫기
              </button>
            </div>
          </>
        )}

        {/* 거래 상태 변경 확인 모달: 확인 눌러야 사라짐, 양옆 65px·아래 402px */}
        {statusModalMessage && (
          <>
            <div
              className="chat-room-sold-modal-overlay"
              onClick={() => setStatusModalMessage(null)}
              onKeyDown={(e) => e.key === 'Escape' && setStatusModalMessage(null)}
              role="button"
              tabIndex={0}
              aria-label="닫기"
            />
            <div className="chat-room-sold-modal" role="dialog" aria-modal="true" aria-labelledby="chat-room-sold-modal-title">
              <p id="chat-room-sold-modal-title" className="chat-room-sold-modal-text">
                {statusModalMessage === 'SOLD' ? '상태가 거래 완료로 변경됐어요' : '상태가 판매중으로 변경됐어요'}
              </p>
              <button type="button" className="chat-room-sold-modal-btn" onClick={() => setStatusModalMessage(null)}>
                확인
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ChatRoom;
