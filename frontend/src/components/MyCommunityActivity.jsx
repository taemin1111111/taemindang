import { useState, useEffect } from 'react';
import './MyCommunityActivity.css';
import api from '../utils/axios.js';

const imgComponent592 = 'https://www.figma.com/api/mcp/asset/43b1bb59-9ac5-4ab2-b560-97dce79d6e1a';

function MyCommunityActivity({ onClose, onPostClick, onWriteCommunityPost, onBrowseCommunity }) {
  const [tab, setTab] = useState('written'); // 'written' | 'commented'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const path = tab === 'written' ? '/community/posts/my/written' : '/community/posts/my/commented';
        const res = await api.get(path);
        if (res.data.success) {
          setPosts(res.data.data || []);
        }
      } catch (err) {
        console.error('동네생활 활동 목록 조회 오류:', err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [tab]);

  const snippet = (content) => {
    if (!content || !content.trim()) return '';
    const text = content.trim().replace(/\s+/g, ' ');
    return text.length > 50 ? text.slice(0, 50) + '...' : text;
  };

  return (
    <div className="mobile-container">
      <div className="my-community-activity-screen">
        {/* 상태바 제거: 네비 top: 0 (Figma 1383-47881) */}
        <header className="my-community-activity-nav">
          <button type="button" className="my-community-activity-back" onClick={onClose} aria-label="뒤로">
            <BackIcon />
          </button>
          <h1 className="my-community-activity-title">동네생활 활동</h1>
          <div className="my-community-activity-nav-right" />
        </header>

        <div className="my-community-activity-tabs">
          <button
            type="button"
            className={`my-community-activity-tab ${tab === 'written' ? 'my-community-activity-tab-active' : ''}`}
            onClick={() => setTab('written')}
          >
            작성한 글
          </button>
          <button
            type="button"
            className={`my-community-activity-tab ${tab === 'commented' ? 'my-community-activity-tab-active' : ''}`}
            onClick={() => setTab('commented')}
          >
            댓글단 글
          </button>
        </div>

        <div className="my-community-activity-content">
          {loading ? (
            <div className="my-community-activity-loading">로딩 중...</div>
          ) : posts.length === 0 ? (
            <div className={`my-community-activity-empty ${tab === 'commented' ? 'my-community-activity-empty-commented' : ''}`}>
              <p className="my-community-activity-empty-text">
                {tab === 'written' ? '첫 동네 이야기를 이웃에게 알려주세요' : '댓글단 글을 확인할 수 있어요.'}
              </p>
              {tab === 'written' ? (
                <button
                  type="button"
                  className="my-community-activity-empty-btn"
                  onClick={() => onWriteCommunityPost && onWriteCommunityPost()}
                >
                  동네생활 글쓰기
                </button>
              ) : (
                <button
                  type="button"
                  className="my-community-activity-empty-btn my-community-activity-empty-btn-commented"
                  onClick={() => onBrowseCommunity && onBrowseCommunity()}
                >
                  동네생활 둘러보기
                </button>
              )}
            </div>
          ) : (
            <ul className="my-community-activity-list">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="my-community-activity-item"
                  onClick={() => onPostClick && onPostClick(post.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onPostClick && onPostClick(post.id)}
                >
                  <h3 className="my-community-activity-item-title">{post.title}</h3>
                  <p className="my-community-activity-item-snippet">{snippet(post.content)}</p>
                  <div className="my-community-activity-item-meta">
                    <span className="my-community-activity-item-comments">
                      <img alt="댓글" src={imgComponent592} className="my-community-activity-comment-icon" />
                      {post.comments ?? 0}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
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

export default MyCommunityActivity;
