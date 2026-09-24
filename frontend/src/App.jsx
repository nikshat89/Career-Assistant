import { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import AuthPage from './components/AuthPage'
import ProfileModal from './components/ProfileModal'
import ApiKeyModal from './components/ApiKeyModal'
import CollegeRecommendationForm from './components/CollegeRecommendationForm'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [showProfile, setShowProfile] = useState(false)
  const [showCollegeForm, setShowCollegeForm] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [selectedModel, setSelectedModel] = useState('off')
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') !== 'light')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userName = localStorage.getItem('userName')
    const userEmail = localStorage.getItem('userEmail')
    const savedSessionId = localStorage.getItem('activeSessionId')
    
    if (userId && userName) {
      api.getUser(userId).then(fullUser => {
        setUser(fullUser)
      }).catch(() => {
        setUser({ id: userId, name: userName })
      })
      loadProfile(userId)
      loadSessions(userId).then(sessionsData => {
        if (savedSessionId && sessionsData) {
          const exists = sessionsData.some(s => s.id === savedSessionId)
          if (exists) {
            handleSelectSession(savedSessionId)
          }
        }
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light-mode')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.add('light-mode')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const toggleTheme = () => setDarkMode(!darkMode)

  async function loadSessions(userId) {
    try { 
      const data = await api.getSessions(userId)
      setSessions(data)
      return data
    } catch (e) {
      return null
    }
  }

  const refreshSessions = useCallback(() => {
    if (user) loadSessions(user.id)
  }, [user])

  async function loadProfile(userId) {
    try { const data = await api.getProfile(userId); setProfile(data) } catch (e) {}
  }

  async function handleAuth(userData) {
    setUser(userData)
    await Promise.all([loadSessions(userData.id), loadProfile(userData.id)])
    setShowProfile(true)
  }

  async function handleNewSession() {
    if (!user) return
    try {
      const session = await api.createSession(user.id)
      setSessions(prev => [session, ...prev])
      setActiveSession(session)
      setMessages([])
      setRefreshKey(k => k + 1)
      localStorage.setItem('activeSessionId', session.id)
    } catch (e) {}
  }

  async function handleSelectSession(sessionId) {
    try {
      const session = await api.getSession(sessionId)
      setActiveSession(session)
      setMessages(session.messages || [])
      localStorage.setItem('activeSessionId', sessionId)
    } catch (e) {}
  }

  async function handleRenameSession(sessionId, newTitle) {
    try {
      const updated = await api.updateSession(sessionId, newTitle)
      setSessions(prev => prev.map(s => s.id === sessionId ? updated : s))
      if (activeSession?.id === sessionId) setActiveSession(updated)
    } catch (e) {}
  }

  async function handleDeleteSession(sessionId) {
    try {
      await api.deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (activeSession?.id === sessionId) { 
        setActiveSession(null)
        setMessages([])
        localStorage.removeItem('activeSessionId')
      }
    } catch (e) {}
  }

  function handleLogout() {
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('activeSessionId')
    setUser(null)
    setSessions([])
    setActiveSession(null)
    setMessages([])
    setProfile(null)
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div 
      className="fadeIn"
      style={{ 
        display: 'flex', 
        height: isMobile ? '100dvh' : '100vh', 
        overflow: 'hidden', 
        background: 'var(--bg)', 
        position: 'relative',
        animationDuration: '1s'
      }}
    >
      {!user ? (
        <AuthPage onAuth={handleAuth} darkMode={darkMode} toggleTheme={toggleTheme} />
      ) : (
        <>
          {showProfile && <ProfileModal profile={profile} userId={user.id} onSave={p => { setProfile(p); setShowProfile(false) }} onClose={() => setShowProfile(false)} />}
          {showApiKey && <ApiKeyModal userId={user.id} onClose={() => setShowApiKey(false)} onSuccess={() => setUser({ ...user, has_api_key: true })} />}
          {showCollegeForm && (
            <CollegeRecommendationForm 
              userId={user.id} 
              profile={profile}
              onComplete={p => { 
                setProfile({ ...profile, ...p }); 
                setShowCollegeForm(false);
                // Removed automatic handleNewSession call
              }} 
              onClose={() => setShowCollegeForm(false)} 
            />
          )}
          
          {/* Mobile Backdrop */}
          {sidebarOpen && (
            <div 
              className="mobile-only"
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 40,
                animation: 'fadeIn 0.2s ease-out'
              }}
            />
          )}

          <Sidebar 
            user={user} 
            profile={profile} 
            sessions={sessions} 
            activeSessionId={activeSession?.id}
            darkMode={darkMode}
            toggleTheme={toggleTheme}
            onNewSession={handleNewSession} 
            onSelectSession={s => { handleSelectSession(s); setSidebarOpen(false); }}
            onEditProfile={() => setShowProfile(true)} 
            onEditCollege={() => setShowCollegeForm(true)}
            onEditApiKey={() => setShowApiKey(true)}
            highlightCloudSettings={(selectedModel === 'openrouter' || selectedModel === 'foundry') && !user?.has_api_key}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onLogout={handleLogout}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <ChatArea 
            key={refreshKey} 
            user={user} 
            session={activeSession} 
            messages={messages} 
            setMessages={setMessages}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            onEditApiKey={() => setShowApiKey(true)}
            onSessionsRefresh={refreshSessions} 
            onRenameSession={handleRenameSession}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        </>
      )}
    </div>
  )
}
