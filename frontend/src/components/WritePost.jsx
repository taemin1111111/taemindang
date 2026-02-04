import { useState, useRef } from 'react';
import './WritePost.css';
import api from '../utils/axios.js';
import PostSuccessModal from './PostSuccessModal.jsx';

// Figma 이미지 URL
const imgIconClose = "https://www.figma.com/api/mcp/asset/7b5eba5e-c24d-4557-a0e9-8958985190c9";
const imgIconCamera = "https://www.figma.com/api/mcp/asset/78f2dee0-ad24-4fa0-ac2d-9e12bb92cd89";
const imgImage = "https://www.figma.com/api/mcp/asset/170dfe72-f5b8-497a-8282-e0d6632cb782";
const imgClose = "https://www.figma.com/api/mcp/asset/926ccd2e-cd63-400e-b63f-c2ffd4d10667";
const imgAlertFill = "https://www.figma.com/api/mcp/asset/be4360c6-387d-4c5e-80c1-166e487f540c";

function WritePost({ onClose, onSuccess }) {
  const [images, setImages] = useState([]); // [{ file: File, preview: string }, ...]
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdItemId, setCreatedItemId] = useState(null);
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    price: '',
    images: '',
    category: ''
  });
  const categoryButtonsRef = useRef(null);
  const fileInputRef = useRef(null);

  const categories = ['바지', '양복', '잠옷', '등산복', '신발', '기타'];
  
  // 마우스 드래그 스크롤
  const handleCategoryMouseDown = (e) => {
    const container = categoryButtonsRef.current;
    if (!container) return;
    
    const startX = e.pageX - container.offsetLeft;
    const scrollLeft = container.scrollLeft;
    let isDown = true;
    
    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    };
    
    const handleMouseUp = () => {
      isDown = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 이미지 업로드 개수 계산
  const imageCount = images.length;
  const maxImages = 5;

  // 이미지 업로드 핸들러
  const handleImageUpload = () => {
    if (imageCount >= maxImages) return;
    fileInputRef.current?.click();
  };

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = maxImages - imageCount;
    const filesToAdd = files.slice(0, remainingSlots);
    
    filesToAdd.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          // File 객체와 preview URL을 함께 저장
          setImages(prev => [...prev, {
            file: file,
            preview: event.target.result
          }]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    // 파일 입력 초기화
    e.target.value = '';
  };

  // 이미지 삭제 핸들러
  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    // 이미지 에러 초기화
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  // 이미지 클릭 핸들러 (대표사진 변경)
  const handleImageClick = (index, e) => {
    // X 버튼 클릭은 무시
    if (e.target.closest('.write-image-remove')) {
      return;
    }
    
    // 첫 번째 이미지가 아니면 대표사진 변경 확인
    if (index !== 0) {
      const confirmChange = window.confirm('대표사진으로 변경하시겠습니까?');
      if (confirmChange) {
        setImages(prev => {
          const newImages = [...prev];
          const selectedImage = newImages[index];
          newImages.splice(index, 1);
          newImages.unshift(selectedImage);
          return newImages;
        });
      }
    }
  };

  // 가격 입력 핸들러 (숫자만 입력 가능)
  const handlePriceChange = (e) => {
    // ₩와 쉼표를 제거하고 숫자만 추출
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPrice(value);
  };

  // 폼 유효성 검사
  const isFormValid = () => {
    return (
      images.length > 0 &&
      title.trim() !== '' &&
      description.trim() !== '' &&
      price && price !== '' &&
      selectedCategory && selectedCategory !== ''
    );
  };

  // 폼이 부분적으로 채워져 있는지 확인
  const isFormPartiallyFilled = () => {
    return (
      images.length > 0 ||
      title.trim() !== '' ||
      description.trim() !== '' ||
      (price && price !== '') ||
      (selectedCategory && selectedCategory !== '')
    );
  };

  const handleSubmit = async () => {
    // 회색 버튼일 때는 API 호출 차단하고 에러 메시지만 표시
    if (!isFormValid()) {
      const newErrors = {
        title: '',
        description: '',
        price: '',
        images: '',
        category: ''
      };

      // 입력값 검증 및 에러 설정
      if (!title.trim()) {
        newErrors.title = '제목을 적어주세요';
      }
      if (!description.trim()) {
        newErrors.description = '설명을 적어주세요';
      }
      if (!price || price === '') {
        newErrors.price = '가격을 적어주세요';
      }
      // 사진은 예외처리 메시지 없이 등록만 차단
      if (!selectedCategory || selectedCategory === '') {
        newErrors.category = '카테고리를 선택해주세요';
      }

      setErrors(newErrors);
      return; // API 호출 차단
    }

    setIsSubmitting(true);

    try {
      // 사용자 정보 가져오기 (동네 정보 포함)
      const userResponse = await api.get('/auth/me');
      const user = userResponse.data.data;

      if (!user.neighborhood) {
        alert('동네를 먼저 설정해주세요');
        setIsSubmitting(false);
        return;
      }

      // FormData 생성
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', price);
      formData.append('category', selectedCategory);
      formData.append('neighborhood', user.neighborhood);

      // 이미지 파일 추가
      images.forEach((imageData) => {
        formData.append('images', imageData.file);
      });

      // API 호출 (multipart/form-data)
      const response = await api.post('/items', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const itemId = response.data.data.itemId;
        setCreatedItemId(itemId);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('상품 등록 오류:', error);
      const errorMessage = error.response?.data?.message || '상품 등록 중 오류가 발생했습니다';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mobile-container">
      <div className="write-post-screen">
        {/* 네비게이션 바 */}
        <div className="write-nav-bar">
          <div className="write-nav-content">
            <div className="write-nav-left">
              <button className="write-back-btn" onClick={onClose}>
                <img alt="close" src={imgIconClose} className="write-back-icon" />
              </button>
            </div>
            <div className="write-nav-title">
              <h1>내 물건 팔기</h1>
            </div>
            <div className="write-nav-right"></div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="write-content">
          {/* 이미지 업로드 섹션 */}
          <div className="write-image-section">
            {errors.images && (
              <div className="write-error-message write-error-message-images">
                <img alt="alert" src={imgAlertFill} className="write-error-icon" />
                <p className="write-error-text">{errors.images}</p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
            <div className="write-image-upload" onClick={handleImageUpload}>
              <img alt="camera" src={imgIconCamera} className="write-camera-icon" />
              <p className="write-image-count">
                <span className="write-image-count-active">{imageCount}</span>/{maxImages}
              </p>
            </div>
            {images.map((imageData, index) => (
              <div key={index} className="write-image-slot" onClick={(e) => handleImageClick(index, e)}>
                <img alt={`upload-${index}`} src={imageData.preview} className="write-image-preview" />
                <button 
                  className="write-image-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(index);
                  }}
                >
                  <img alt="close" src={imgClose} className="write-close-icon" />
                </button>
                {index === 0 && (
                  <div className="write-image-badge">대표사진</div>
                )}
              </div>
            ))}
          </div>

          {/* 입력 필드들 */}
          <div className="write-form">
            {/* 제목 */}
            <div className="write-input-group">
              <label className="write-input-label">제목</label>
              <div className={`write-input-field ${errors.title ? 'write-input-field-error' : ''}`}>
                <input
                  type="text"
                  placeholder="글 제목"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) {
                      setErrors(prev => ({ ...prev, title: '' }));
                    }
                  }}
                  className="write-input"
                />
              </div>
              {errors.title && (
                <div className="write-error-message">
                  <img alt="alert" src={imgAlertFill} className="write-error-icon" />
                  <p className="write-error-text">{errors.title}</p>
                </div>
              )}
            </div>

            {/* 자세한 설명 */}
            <div className="write-input-group">
              <label className="write-input-label">자세한 설명</label>
              <div className={`write-textarea-field ${errors.description ? 'write-textarea-field-error' : ''}`}>
                <textarea
                  placeholder="게시글 내용을 작성해 주세요. (판매 금지 물품은 게시가 제한될 수 있어요.)"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) {
                      setErrors(prev => ({ ...prev, description: '' }));
                    }
                  }}
                  className="write-textarea"
                />
              </div>
              {errors.description && (
                <div className="write-error-message">
                  <img alt="alert" src={imgAlertFill} className="write-error-icon" />
                  <p className="write-error-text">{errors.description}</p>
                </div>
              )}
            </div>

            {/* 가격 */}
            <div className="write-input-group">
              <label className="write-input-label">가격</label>
              <div className={`write-input-field ${errors.price ? 'write-input-field-error' : ''}`}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="₩ 가격을 입력해주세요."
                  value={price && price !== '' ? `₩ ${parseInt(price, 10).toLocaleString()}` : ''}
                  onChange={(e) => {
                    handlePriceChange(e);
                    if (errors.price) {
                      setErrors(prev => ({ ...prev, price: '' }));
                    }
                  }}
                  className="write-input"
                />
              </div>
              {errors.price && (
                <div className="write-error-message">
                  <img alt="alert" src={imgAlertFill} className="write-error-icon" />
                  <p className="write-error-text">{errors.price}</p>
                </div>
              )}
            </div>

            {/* 카테고리 */}
            <div className="write-input-group">
              <label className="write-input-label">카테고리</label>
              <div 
                className="write-category-buttons"
                ref={categoryButtonsRef}
                onMouseDown={handleCategoryMouseDown}
              >
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`write-category-btn ${selectedCategory === category ? 'write-category-btn-active' : ''}`}
                    onClick={() => {
                      setSelectedCategory(category);
                      if (errors.category) {
                        setErrors(prev => ({ ...prev, category: '' }));
                      }
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {errors.category && (
                <div className="write-error-message">
                  <img alt="alert" src={imgAlertFill} className="write-error-icon" />
                  <p className="write-error-text">{errors.category}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="write-footer">
          <button 
            className={`write-submit-btn ${isFormValid() ? 'write-submit-btn-active' : 'write-submit-btn-inactive'}`}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '등록 중...' : '작성 완료'}
          </button>
        </div>
      </div>

      {/* 성공 모달 */}
      {showSuccessModal && (
        <PostSuccessModal 
          onConfirm={() => {
            setShowSuccessModal(false);
            if (onSuccess && createdItemId) {
              onSuccess(createdItemId);
            } else if (onClose) {
              onClose();
            }
          }} 
        />
      )}
    </div>
  );
}

export default WritePost;
