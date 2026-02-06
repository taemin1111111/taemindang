import { useState, useEffect } from 'react';
import './CommunityPostDetail.css';
import api from '../utils/axios.js';
import defaultAvatar from '../assets/ratio.png';

// Figma 이미지 URL
const imgChevronLeft = "https://www.figma.com/api/mcp/asset/d51ef680-70fe-4cf5-a813-8a77926678e0";
const imgComponent592 = "https://www.figma.com/api/mcp/asset/649d2c08-c56a-4e2c-9a28-1199e8e6aa72";
const imgShow = "https://www.figma.com/api/mcp/asset/76ed8b42-7d78-417f-9cef-1bf1d319fef3";
function CommunityPostDetail({ postId, onClose }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/community/posts/${postId}`);
        
        if (response.data.success) {
          setPost(response.data.data);
        }
      } catch (error) {
        console.error('게시글 상세 조회 오류:', error);
        alert('게시글 정보를 불러올 수 없습니다');
        if (onClose) onClose();
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPostDetail();
    }
  }, [postId, onClose]);

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
    if (diffDays < 30) return `${diffDays}일 전`;
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 댓글 작성 핸들러
  const handleCommentSubmit = async () => {
    if (!commentText.trim()) {
      return;
    }

    try {
      const response = await api.post(`/community/posts/${postId}/comments`, {
        content: commentText.trim()
      });

      if (response.data.success) {
        // 댓글 작성 성공
        setCommentText('');
        
        // 게시글 정보 다시 불러오기 (댓글 개수 업데이트)
        const postResponse = await api.get(`/community/posts/${postId}`);
        if (postResponse.data.success) {
          setPost(postResponse.data.data);
        }
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다');
      } else {
        alert('댓글 작성 중 오류가 발생했습니다');
      }
    }
  };

  // 엔터 키 핸들러
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit();
    }
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="community-post-detail-screen">
          <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="mobile-container">
      <div className="community-post-detail-screen">
        {/* 상단 44px 상태바 공간 */}
        <div className="community-post-detail-status-bar" aria-hidden="true" />
        {/* 네비게이션 바 */}
        <div className="community-post-detail-nav-bar">
          <div className="community-post-detail-nav-content">
            <div className="community-post-detail-nav-left">
              <button className="community-post-detail-back-btn" onClick={onClose}>
                <img alt="back" src={imgChevronLeft} className="community-post-detail-back-icon" />
              </button>
            </div>
            <div className="community-post-detail-nav-right">
              <div className="community-post-detail-nav-title" style={{ opacity: 0 }}>
                완료
              </div>
            </div>
          </div>
        </div>

        {/* 게시글 내용 영역 */}
        <div className="community-post-detail-main">
          <div className="community-post-detail-content">
            <div className="community-post-detail-header">
              <div className="community-post-detail-badge">
                <img alt="category" src={imgComponent592} className="community-post-detail-badge-icon" />
                <span>{post.category}</span>
              </div>
              <div className="community-post-detail-user-info">
                <div className="community-post-detail-user-avatar">
                  <img alt="user" src={post.user_profile_image || defaultAvatar} className="community-post-detail-avatar-img" />
                </div>
                <div className="community-post-detail-user-details">
                  <p className="community-post-detail-username">{post.user_nickname || '사용자명'}</p>
                  <p className="community-post-detail-user-meta">
                    {post.neighborhood} · {formatTimeAgo(post.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="community-post-detail-body">
              <h1 className="community-post-detail-title">{post.title}</h1>
              <p className="community-post-detail-text">{post.content}</p>
            </div>

            <div className="community-post-detail-footer">
              <img alt="view" src={imgShow} className="community-post-detail-view-icon" />
              <span className="community-post-detail-view-count">{post.view_count}명이 봤어요</span>
            </div>
          </div>

          {/* 구분선 */}
          <div className="community-post-detail-divider"></div>

          {/* 댓글 섹션 */}
          <div className="community-post-detail-comments">
          <h2 className="community-post-detail-comments-title">댓글 {post.comment_count || 0}</h2>
          {(!post.comments || post.comments.length === 0) ? (
            <div className="community-post-detail-no-comments">
              <p>아직 댓글이 없어요.</p>
              <p>가장 먼저 댓글을 남겨보세요.</p>
            </div>
          ) : (
            <div className="community-post-detail-comments-list">
              {post.comments.map((comment) => (
                <div key={comment.id} className="community-post-detail-comment-item">
                  <div className="community-post-detail-comment-user-info">
                    <div className="community-post-detail-comment-avatar">
                      <img alt="user" src={comment.user_profile_image || defaultAvatar} className="community-post-detail-comment-avatar-img" />
                    </div>
                    <div className="community-post-detail-comment-user-details">
                      <p className="community-post-detail-comment-username">{comment.user_nickname || '사용자명'}</p>
                      <p className="community-post-detail-comment-time">{formatTimeAgo(comment.created_at)}</p>
                    </div>
                  </div>
                  <p className="community-post-detail-comment-content">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>

        {/* 댓글 입력 바 */}
        <div className="community-post-detail-comment-input-bar">
          <div className="community-post-detail-comment-input-container">
            <input
              type="text"
              className="community-post-detail-comment-input"
              placeholder="댓글을 입력해주세요."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunityPostDetail;
