import { useState } from 'react';
import './CommunityWritePost.css';
import api from '../utils/axios.js';

// Figma 이미지 URL
const imgChevronLeft = "https://www.figma.com/api/mcp/asset/d51ef680-70fe-4cf5-a813-8a77926678e0";
const imgComponent592 = "https://www.figma.com/api/mcp/asset/649d2c08-c56a-4e2c-9a28-1199e8e6aa72";
const imgShapeChevronLeft = "https://www.figma.com/api/mcp/asset/0d472f74-495e-4a04-ac49-5c373de0780e";
const imgHome5Fill = "https://www.figma.com/api/mcp/asset/81e4c2b0-dddc-4ccf-abe9-420750fa1885";
const imgGroupFill = "https://www.figma.com/api/mcp/asset/93269f18-4cf6-460e-8db9-ccd4cdfc79bd";
const imgAnnouncementFill = "https://www.figma.com/api/mcp/asset/390ed41c-4d5b-461a-8f8d-35236636c7c0";
const imgMore3Fill = "https://www.figma.com/api/mcp/asset/c0a02fa9-fa06-42c0-9a46-356f910a06e7";
const imgChevronUp = "https://www.figma.com/api/mcp/asset/ec090cb6-787b-4fd6-a83f-bc0ca0d5aac2";
const imgVector332 = "https://www.figma.com/api/mcp/asset/bcd013d7-ad14-42ee-84c7-54bd334cc0ea";

function CommunityWritePost({ onClose, onSuccess }) {
  const [selectedTopic, setSelectedTopic] = useState('주제 선택');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showTopicBottomSheet, setShowTopicBottomSheet] = useState(false);
  const [showContentAlert, setShowContentAlert] = useState(false);

  const topicCategories = [
    {
      id: 'neighborhood',
      name: '동네정보',
      icon: imgHome5Fill,
      topics: ['맛집', '생활/편의', '병원/약국', '이사/시공', '주거/부동산', '교육', '미용']
    },
    {
      id: 'together',
      name: '이웃과 함께',
      icon: imgGroupFill,
      topics: ['반려동물', '운동', '고민/사연', '동네/친구', '취미', '동네풍경', '임신/육아']
    },
    {
      id: 'news',
      name: '소식',
      icon: imgAnnouncementFill,
      topics: ['동네행사', '분실/실종', '동네사건사고']
    },
    {
      id: 'etc',
      name: '기타',
      icon: imgMore3Fill,
      topics: ['일반']
    }
  ];

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setShowTopicBottomSheet(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowTopicBottomSheet(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요');
      return;
    }

    // 제목만 입력하고 내용이 없으면 알림 표시
    if (!content.trim()) {
      setShowContentAlert(true);
      // 3초 후 자동으로 알림 숨김
      setTimeout(() => {
        setShowContentAlert(false);
      }, 3000);
      return;
    }

    try {
      const response = await api.post('/community/posts', {
        topic: selectedTopic === '주제 선택' ? null : selectedTopic,
        title: title.trim(),
        content: content.trim() || ''
      });

      if (response.data.success) {
        if (onSuccess) {
          onSuccess(response.data.data.id);
        }
        // 알림 없이 바로 디테일 페이지로 이동 (onClose 호출 안 함)
      }
    } catch (error) {
      console.error('동네생활 글쓰기 오류:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다');
      } else {
        alert('글 작성 중 오류가 발생했습니다');
      }
    }
  };

  // 주제 선택 및 제목 입력 확인
  const isTopicSelected = selectedTopic !== '주제 선택';
  const isTitleFilled = title.trim().length > 0;
  const isFormValid = isTopicSelected && isTitleFilled;

  return (
    <div className="mobile-container">
      <div className="community-write-screen">
        <div className="community-write-status-bar" aria-hidden="true" />
        {/* 네비게이션 바 */}
        <div className="community-write-nav-bar">
          <div className="community-write-nav-content">
            <div className="community-write-nav-left">
              <button className="community-write-back-btn" onClick={onClose}>
                <img alt="back" src={imgChevronLeft} className="community-write-back-icon" />
              </button>
            </div>
            <div className="community-write-nav-right">
              <button 
                className={`community-write-complete-btn ${isFormValid ? 'community-write-complete-btn-active' : ''}`}
                onClick={handleSubmit}
                disabled={!isFormValid}
              >
                완료
              </button>
            </div>
          </div>
        </div>

        {/* 주제 선택 섹션 */}
        <div className="community-write-topic-section">
          <div className="community-write-topic-wrapper">
            <button 
              className="community-write-topic-btn"
              onClick={() => setShowTopicBottomSheet(true)}
            >
              <img alt="topic" src={imgComponent592} className="community-write-topic-icon" />
              <span>{selectedTopic}</span>
              <div className="community-write-chevron-wrapper">
                <img alt="chevron" src={imgShapeChevronLeft} className="community-write-chevron-icon" />
              </div>
            </button>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="community-write-notice">
          <p>
            <span className="notice-bold">안내</span>
            <span>  중고거래 관련, 명예훼손, 광고/홍보 목적의 글은 올리실</span>
          </p>
          <p>수 없어요.</p>
        </div>

        {/* 제목 및 내용 입력 */}
        <div className="community-write-content">
          <div className="community-write-title-wrapper">
            <input
              type="text"
              className="community-write-title"
              placeholder="제목을 입력하세요."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="community-write-textarea-wrapper">
            <textarea
              className="community-write-textarea"
              placeholder="이웃과 이야기를 나눠보세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
            />
          </div>
        </div>

        {/* 주제 선택 바텀시트 */}
        {showTopicBottomSheet && (
          <div className="community-write-bottom-sheet-overlay" onClick={handleBackdropClick}>
            <div className="community-write-bottom-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="community-write-bottom-sheet-title">
                게시글 주제를 선택해주세요.
              </div>
              <div className="community-write-bottom-sheet-content">
                {topicCategories.map((category) => (
                  <div key={category.id} className="community-write-category-group">
                    <div className="community-write-category-header">
                      <img alt={category.name} src={category.icon} className="community-write-category-icon" />
                      <span className="community-write-category-name">{category.name}</span>
                    </div>
                    <div className="community-write-category-topics">
                      {category.topics.map((topic) => (
                        <button
                          key={topic}
                          className={`community-write-topic-tag ${selectedTopic === topic ? 'community-write-topic-tag-active' : ''}`}
                          onClick={() => handleTopicSelect(topic)}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 본문 입력 알림 */}
        {showContentAlert && (
          <div className="community-write-content-alert">
            <p>본문을 입력해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityWritePost;
