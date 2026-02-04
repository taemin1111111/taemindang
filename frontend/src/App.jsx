import { useState } from 'react'
import Onboarding from './components/Onboarding'
import SignUp from './components/SignUp'
import Login from './components/Login'
import Neighborhood from './components/Neighborhood'
import Home from './components/Home'
import WritePost from './components/WritePost'
import ItemDetail from './components/ItemDetail'
import './App.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState('onboarding')
  const [selectedItemId, setSelectedItemId] = useState(null)

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
      setCurrentScreen('neighborhood')
    } else {
      // 동네가 있으면 홈 화면으로 이동
      setCurrentScreen('home')
    }
  }

  const handleCloseNeighborhood = () => {
    setCurrentScreen('onboarding')
  }

  const handleNeighborhoodConfirm = () => {
    setCurrentScreen('home')
  }

  const handleWritePost = () => {
    setCurrentScreen('write')
  }

  const handleCloseWritePost = () => {
    setCurrentScreen('home')
  }

  const handleWritePostSuccess = (itemId) => {
    setSelectedItemId(itemId)
    setCurrentScreen('itemDetail')
  }

  const handleItemClick = (itemId) => {
    setSelectedItemId(itemId)
    setCurrentScreen('itemDetail')
  }

  const handleCloseItemDetail = () => {
    setCurrentScreen('home')
    setSelectedItemId(null)
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
      {currentScreen === 'home' && (
        <Home onWritePost={handleWritePost} onItemClick={handleItemClick} />
      )}
      {currentScreen === 'write' && (
        <WritePost onClose={handleCloseWritePost} onSuccess={handleWritePostSuccess} />
      )}
      {currentScreen === 'itemDetail' && (
        <ItemDetail 
          itemId={selectedItemId} 
          onClose={handleCloseItemDetail}
          onItemClick={handleItemClick}
        />
      )}
    </div>
  )
}

export default App
