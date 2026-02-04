import './PostSuccessModal.css';

function PostSuccessModal({ onConfirm }) {
  return (
    <div className="post-success-overlay">
      <div className="post-success-modal">
        <div className="post-success-content">
          <p className="post-success-message">게시물을 올렸어요.</p>
        </div>
        <div className="post-success-footer">
          <button className="post-success-confirm-btn" onClick={onConfirm}>
            확인
          </button>
        </div>
        <div className="post-success-indicator-space"></div>
      </div>
    </div>
  );
}

export default PostSuccessModal;
