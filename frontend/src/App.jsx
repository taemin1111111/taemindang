import { useState, useEffect } from 'react'
import Onboarding from './components/Onboarding'
import SignUp from './components/SignUp'
import Login from './components/Login'
import Neighborhood from './components/Neighborhood'
import Home from './components/Home'
import CommunityLife from './components/CommunityLife'
import WritePost from './components/WritePost'
import CommunityWritePost from './components/CommunityWritePost'
import CommunityPostDetail from './components/CommunityPostDetail'
import ItemDetail from './components/ItemDetail'
import ItemChatList from './components/ItemChatList'
import Search from './components/Search'
import SearchResults from './components/SearchResults'
import Chat from './components/Chat'
import ChatRoom from './components/ChatRoom'
import ChatAppointment from './components/ChatAppointment'
import Profile from './components/Profile'
import ProfileDetail from './components/ProfileDetail'
import ProfileEdit from './components/ProfileEdit'
import ActivityBadges from './components/ActivityBadges'
import SalesHistory from './components/SalesHistory'
import PurchaseHistory from './components/PurchaseHistory'
import MyCommunityActivity from './components/MyCommunityActivity'
import Wishlist from './components/Wishlist'
import BottomNav from './components/BottomNav'
import { invalidateItemsCache } from './utils/itemsCache.js'
import './App.css'

function App() {
  // 새로고침 시 저장된 토큰이 있으면 로그인 상태 유지 (온보딩이 아닌 홈으로 복원)
  const [currentScreen, setCurrentScreen] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('token') ? 'home' : 'onboarding'
  )
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null)
  const [previousScreen, setPreviousScreen] = useState('home')
  const [searchKeyword, setSearchKeyword] = useState(null)
  const [searchOriginScreen, setSearchOriginScreen] = useState('home') // 검색 탭을 연 화면 (뒤로가기 시 여기로)

  const handleStartClick = () => {
    setCurrentScreen('signup')
  }

  const handleCloseSignUp = () => {
    setCurrentScreen('onboarding')
  }

  const handleLoginClick = () => {
    setCurrentScreen('login')
  }

  const handleCloseLogin = () => {
    setCurrentScreen('onboarding')
  }

  const handleSignUpSuccess = () => {
    setCurrentScreen('login')
  }

  const handleLoginSuccess = (neighborhood) => {
    // neighborhood가 null이면 동네 설정 화면으로
    if (neighborhood === null || neighborhood === undefined) {
      setPreviousScreen('onboarding')
      setCurrentScreen('neighborhood')
    } else {
      setCurrentScreen('home')
    }
  }

  const handleCloseNeighborhood = () => {
    setCurrentScreen(previousScreen)
  }

  const handleNeighborhoodConfirm = () => {
    setCurrentScreen(previousScreen === 'onboarding' ? 'home' : previousScreen)
  }

  const handleWritePost = () => {
    setPreviousScreen(currentScreen)
    if (currentScreen === 'home' || currentScreen === 'salesHistory') {
      setCurrentScreen('write')
    } else if (currentScreen === 'community') {
      setCurrentScreen('communityWrite')
    }
  }

  const handleCloseWritePost = () => {
    setCurrentScreen(previousScreen)
  }

  const handleCloseCommunityWritePost = () => {
    setCurrentScreen(previousScreen)
  }

  const handleCommunityWritePostSuccess = (postId) => {
    setSelectedPostId(postId)
    setCurrentScreen('communityPostDetail')
  }

  const handleWritePostSuccess = (itemId) => {
    invalidateItemsCache()
    setSelectedItemId(itemId)
    setCurrentScreen('itemDetail')
  }

  const handleItemClick = (itemId) => {
    /* 상품 디테일 안에서 "다른 판매 물품" 클릭 시에는 previousScreen 유지 → 뒤로가기 시 홈 등으로 정상 복귀 */
    if (currentScreen !== 'itemDetail') {
      setPreviousScreen(currentScreen)
    }
    setSelectedItemId(itemId)
    setCurrentScreen('itemDetail')
  }

  const handleCloseItemDetail = () => {
    setCurrentScreen(previousScreen)
    setSelectedItemId(null)
  }

  const handleNavigate = (screen, postId = null, keyword = null, chatId = null) => {
    if (screen === 'communityPostDetail' && postId) {
      setPreviousScreen(currentScreen)
      setSelectedPostId(postId)
      setCurrentScreen('communityPostDetail')
    } else if (screen === 'neighborhood') {
      setPreviousScreen(currentScreen)
      setCurrentScreen('neighborhood')
    } else if (screen === 'searchResults' && keyword) {
      setSearchKeyword(keyword)
      setCurrentScreen('searchResults')
    } else if (screen === 'chatRoom') {
      // chatId가 두 번째 인자로 전달될 수 있으므로 확인
      const actualChatId = chatId || postId; // postId 자리에 chatId가 올 수 있음
      if (actualChatId) {
        setSelectedChatId(actualChatId)
        setCurrentScreen('chatRoom')
      }
    } else {
      setCurrentScreen(screen)
    }
  }

  const handleCloseCommunityPostDetail = () => {
    setCurrentScreen(previousScreen)
    setSelectedPostId(null)
  }

  const handleSearchClick = () => {
    setSearchOriginScreen(currentScreen)
    setPreviousScreen(currentScreen)
    setCurrentScreen('search')
  }

  const handleCloseSearch = () => {
    setCurrentScreen(previousScreen)
  }

  return (
    <div className="App">
      {currentScreen === 'onboarding' && (
        <Onboarding onStartClick={handleStartClick} onLoginClick={handleLoginClick} />
      )}
      {currentScreen === 'signup' && (
        <SignUp onClose={handleCloseSignUp} onSignUpSuccess={handleSignUpSuccess} />
      )}
      {currentScreen === 'login' && (
        <Login onClose={handleCloseLogin} onLoginSuccess={handleLoginSuccess} />
      )}
      {currentScreen === 'neighborhood' && (
        <Neighborhood onClose={handleCloseNeighborhood} onConfirm={handleNeighborhoodConfirm} />
      )}
      {(currentScreen === 'home' || currentScreen === 'community' || currentScreen === 'chat' || currentScreen === 'profile') && (
        <div className="mobile-container">
          <div className="main-tabs-frame">
            <div className="main-tabs-content">
              {currentScreen === 'home' && (
                <Home
                  embedded
                  onWritePost={handleWritePost}
                  onItemClick={handleItemClick}
                  onNavigate={handleNavigate}
                  onSearch={handleSearchClick}
                  currentScreen={currentScreen}
                />
              )}
              {currentScreen === 'community' && (
                <CommunityLife
                  embedded
                  onNavigate={handleNavigate}
                  onWritePost={handleWritePost}
                  onSearch={handleSearchClick}
                  currentScreen={currentScreen}
                />
              )}
              {currentScreen === 'chat' && (
                <Chat embedded onNavigate={handleNavigate} />
              )}
              {currentScreen === 'profile' && (
                <Profile embedded onNavigate={handleNavigate} currentScreen={currentScreen} />
              )}
            </div>
            <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />
          </div>
        </div>
      )}
      {currentScreen === 'write' && (
        <WritePost onClose={handleCloseWritePost} onSuccess={handleWritePostSuccess} />
      )}
      {currentScreen === 'communityWrite' && (
        <CommunityWritePost 
          onClose={handleCloseCommunityWritePost} 
          onSuccess={handleCommunityWritePostSuccess} 
        />
      )}
      {currentScreen === 'itemDetail' && (
        <ItemDetail 
          itemId={selectedItemId} 
          onClose={handleCloseItemDetail}
          onItemClick={handleItemClick}
          onOpenItemChats={() => setCurrentScreen('itemChatList')}
        />
      )}
      {currentScreen === 'itemChatList' && selectedItemId && (
        <ItemChatList
          itemId={selectedItemId}
          onClose={() => setCurrentScreen('itemDetail')}
          onNavigate={handleNavigate}
        />
      )}
      {currentScreen === 'communityPostDetail' && (
        <CommunityPostDetail 
          postId={selectedPostId} 
          onClose={handleCloseCommunityPostDetail}
        />
      )}
      {currentScreen === 'search' && (
        <Search onClose={handleCloseSearch} onNavigate={handleNavigate} />
      )}
      {currentScreen === 'searchResults' && searchKeyword && (
        <SearchResults 
          keyword={searchKeyword}
          onClose={() => {
            setSearchKeyword(null);
            setPreviousScreen(searchOriginScreen);
            setCurrentScreen('search');
          }}
          onItemClick={handleItemClick}
          onNavigate={handleNavigate}
        />
      )}
      {currentScreen === 'profileDetail' && (
        <ProfileDetail
          onClose={() => setCurrentScreen('profile')}
          onNavigate={handleNavigate}
        />
      )}
      {currentScreen === 'profileEdit' && (
        <ProfileEdit onClose={() => setCurrentScreen('profileDetail')} />
      )}
      {currentScreen === 'activityBadges' && (
        <ActivityBadges onClose={() => setCurrentScreen('profileDetail')} />
      )}
      {currentScreen === 'salesHistory' && (
        <SalesHistory
          onClose={() => setCurrentScreen('profile')}
          onItemClick={handleItemClick}
          onWritePost={handleWritePost}
        />
      )}
      {currentScreen === 'purchaseHistory' && (
        <PurchaseHistory
          onClose={() => setCurrentScreen('profile')}
          onItemClick={handleItemClick}
        />
      )}
      {currentScreen === 'wishlist' && (
        <Wishlist
          onClose={() => setCurrentScreen('profile')}
          onItemClick={handleItemClick}
        />
      )}
      {currentScreen === 'myCommunityActivity' && (
        <MyCommunityActivity
          onClose={() => setCurrentScreen('profile')}
          onPostClick={(postId) => {
            setPreviousScreen('myCommunityActivity');
            setSelectedPostId(postId);
            setCurrentScreen('communityPostDetail');
          }}
          onWriteCommunityPost={() => {
            setPreviousScreen('myCommunityActivity');
            setCurrentScreen('communityWrite');
          }}
          onBrowseCommunity={() => setCurrentScreen('community')}
        />
      )}
      {currentScreen === 'chatRoom' && selectedChatId && (
        <ChatRoom 
          chatId={selectedChatId}
          onClose={() => {
            setSelectedChatId(null);
            setCurrentScreen('chat');
          }}
          onNavigateToAppointment={(appointmentId) => {
            setSelectedAppointmentId(appointmentId ?? null);
            setCurrentScreen('chatAppointment');
          }}
        />
      )}
      {currentScreen === 'chatAppointment' && selectedChatId && (
        <ChatAppointment
          chatId={selectedChatId}
          appointmentId={selectedAppointmentId}
          onClose={() => {
            setSelectedAppointmentId(null);
            setCurrentScreen('chatRoom');
          }}
        />
      )}
    </div>
  )
}

export default App
