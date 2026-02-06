import { useState, useEffect, useRef } from 'react';
import './Search.css';
import api from '../utils/axios.js';

// Figma 이미지 URL
const imgChevronLeft = "https://www.figma.com/api/mcp/asset/d51ef680-70fe-4cf5-a813-8a77926678e0";
const imgCloseX = "https://www.figma.com/api/mcp/asset/b6374da6-a08a-4db9-a3d9-024d5f4392fa";
const imgSearchIcon = "https://www.figma.com/api/mcp/asset/8044d75f-9a28-4e95-930e-f7f96ddfa0ff";

function Search({ onClose, onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [neighborhood, setNeighborhood] = useState('무슨동');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success && response.data.data.neighborhood) {
          setNeighborhood(response.data.data.neighborhood);
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error);
      }
    };

    fetchUserInfo();
  }, []);

  // 연관 검색어 가져오기
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery || searchQuery.trim().length === 0) {
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get('/search/suggestions', {
          params: { keyword: searchQuery.trim() }
        });

        if (response.data.success) {
          setSuggestions(response.data.data || []);
        }
      } catch (error) {
        console.error('연관 검색어 가져오기 오류:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    // 디바운싱: 300ms 후에 검색
    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 검색 실행
  const handleSearch = (keyword) => {
    if (!keyword || !keyword.trim()) return;
    const trimmedKeyword = keyword.trim();
    if (onNavigate) onNavigate('searchResults', null, trimmedKeyword);
  };

  // Enter 키로 검색
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  // 검색어 클리어
  const handleClearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 연관 검색어 클릭
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
    handleSearch(suggestion);
  };

  // 검색어 하이라이트
  const highlightKeyword = (text, keyword) => {
    if (!keyword || !text) return text;
    const index = text.indexOf(keyword);
    if (index === -1) return text;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + keyword.length);
    const after = text.substring(index + keyword.length);
    
    return (
      <>
        {before}
        <span className="search-suggestion-highlight">{match}</span>
        {after}
      </>
    );
  };

  return (
    <div className="mobile-container">
      <div className="search-screen">
        {/* 네비게이션 바 - top: 0으로 배치 (상태바 제거) */}
        <div className="search-nav-bar">
          <div className="search-nav-content">
            <div className="search-nav-left">
              <button className="search-back-btn" onClick={onClose}>
                <img alt="back" src={imgChevronLeft} className="search-back-icon" />
              </button>
            </div>
            <div className="search-input-wrapper">
              <div className="search-input-container">
                {searchQuery && (
                  <span className="search-input-text">{searchQuery}</span>
                )}
                {!searchQuery && (
                  <span className="search-input-placeholder">{neighborhood} 근처에서 검색</span>
                )}
                {searchQuery && (
                  <button className="search-clear-btn" onClick={handleClearSearch}>
                    <img alt="clear" src={imgCloseX} className="search-clear-icon" />
                  </button>
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                className="search-input-hidden"
                placeholder={`${neighborhood} 근처에서 검색`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />
            </div>
            <div className="search-nav-right">
              <button className="search-close-btn" onClick={onClose}>
                닫기
              </button>
            </div>
          </div>
        </div>

        {/* 연관 검색어 영역 */}
        {searchQuery && suggestions.length > 0 && (
          <div className="search-suggestions-section">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className="search-suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <img alt="search" src={imgSearchIcon} className="search-suggestion-icon" />
                <span className="search-suggestion-text">
                  {highlightKeyword(suggestion, searchQuery)}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default Search;
