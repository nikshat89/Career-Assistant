import { useState, useEffect } from 'react'

export default function Sidebar({ user, profile, sessions, activeSessionId, darkMode, toggleTheme, onNewSession, onSelectSession, onEditProfile, onEditCollege, onEditApiKey, highlightCloudSettings, onDeleteSession, onRenameSession, onLogout, isOpen, onClose }) {
  const [hoveredId, setHoveredId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ... (rest of the logic remains)
  const completionScore = () => {
    if (!profile) return 0;
    const fields = [
      profile.current_role,
      profile.years_experience,
      profile.education,
      profile.location,
      profile.career_goals,
      profile.skills?.length > 0,
      profile.interests?.length > 0
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const progress = completionScore();
  
  // Dynamic context levels based on completion
  const getContextStatus = () => {
    if (progress === 0) return { label: 'Awaiting Data', color: 'var(--text3)', level: 'Zero' };
    if (progress < 30) return { label: 'Calibrating...', color: 'var(--gold)', level: 'Low' };
    if (progress < 70) return { label: 'Contextual', color: 'var(--gold)', level: 'Partial' };
    if (progress < 100) return { label: 'High Precision', color: 'var(--sage)', level: 'Deep' };
    return { label: 'Full Intelligence', color: 'var(--sage)', level: 'Maximum' };
  };

  const status = getContextStatus();

  function formatDate(iso) {
    const d = new Date(iso), now = new Date(), diff = now - d
    if (diff < 86400000) return 'Today'
    if (diff < 172800000) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <aside 
      aria-label="Application Sidebar"
      style={{ 
        width: 'var(--sidebar-width)', 
        minWidth: 'var(--sidebar-width)', 
        background: 'var(--surface)', 
        borderRight: '1px solid var(--border)', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        position: isMobile ? 'fixed' : 'relative', 
        left: isMobile ? (isOpen ? 0 : '-100%') : 0,
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 50,
        boxShadow: isMobile && isOpen ? '20px 0 50px rgba(0,0,0,0.5)' : 'none'
      }}
    >
      <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={toggleTheme}
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{ 
            background: 'var(--surface2)', 
            border: '1px solid var(--border)', 
            color: 'var(--text2)', 
            cursor: 'pointer',
            fontSize: '16px',
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--gold)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {isMobile && (
          <button 
            onClick={onClose}
            aria-label="Close Sidebar"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text2)', 
              fontSize: '24px',
              padding: '8px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        )}
      </div>
      <div style={{ padding:'32px 24px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'4px' }}>
          <div className="premium-gradient" style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'var(--bg)', 
            boxShadow: '0 12px 24px rgba(99,102,241,0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Glossy overlay */}
            <div style={{
              position: 'absolute',
              top: '-20%',
              left: '-20%',
              width: '140%',
              height: '140%',
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)',
              pointerEvents: 'none'
            }}></div>

            {/* Creative North Star Compass Logo */}
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" opacity="0.3" />
              <path d="M12 2L12 22" opacity="0.5" />
              <path d="M2 12L22 12" opacity="0.5" />
              <path d="M12 7l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" fill="white" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontFamily:"'Cormorant Garamond',serif", 
              fontSize:'24px', 
              fontWeight: 800, 
              color:'var(--text)', 
              letterSpacing: '-0.5px',
              lineHeight: 1
            }}>Pathfinder</span>
            <span style={{ 
              fontSize:'10px', 
              letterSpacing:'1.5px', 
              textTransform:'uppercase', 
              color:'var(--gold)', 
              fontWeight: 800, 
              opacity: 0.9,
              marginTop: '4px'
            }}>AI Counsellor</span>
          </div>
        </div>
      </div>

      <div style={{ padding:'24px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'16px' }}>
          <h3 style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--text3)', fontWeight: 700, margin: 0 }}>AI Intelligence Core</h3>
          <div style={{ fontSize:'10px', color: status.color, fontWeight: 800 }}>{progress}%</div>
        </div>

        <button 
          onClick={onEditProfile}
          className="glass-morphism profile-btn"
          aria-label={`Edit Profile. Current completeness: ${progress} percent.`}
          style={{ 
            width: '100%',
            textAlign: 'left',
            borderRadius:'24px', 
            padding:'20px', 
            cursor:'pointer', 
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.02), rgba(0,0,0,0.1))',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Circular Gauge Background */}
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }} aria-hidden="true">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={status.color} strokeWidth="8" strokeDasharray={`${(progress / 100) * 251.2} 251.2`} strokeLinecap="round" transform="rotate(-90 50 50)" />
            </svg>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: status.color }}>
                {progress === 100 ? '✦' : '⚙'}
              </div>
              <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '14px', height: '14px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: status.color, animation: progress < 100 ? 'pulse 2s infinite' : 'none' }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize:'15px', fontWeight: 700, color:'var(--text)', marginBottom:'2px' }}>{user?.name?.split(' ')[0] || 'User'}</div>
              <div style={{ fontSize:'11px', color: status.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {status.label}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5, opacity: 0.9 }}>
            {progress === 100 ? 'Full profile intelligence unlocked.' : 
             progress < 30 ? 'Add roles & skills to sharpen AI.' :
             progress < 70 ? 'Ready for tailored career advice.' : 
             'High precision active for planning.'}
          </div>

          {/* Quick Tip */}
          {progress < 100 && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--gold)' }} aria-hidden="true">💡</span>
              <span>Tip: {!profile?.career_goals ? 'Add goals for +20%' : !profile?.skills?.length ? 'Add skills for +20%' : 'Finish to maximize accuracy'}</span>
            </div>
          )}
        </button>

        <button 
          onClick={onEditCollege}
          className="glass-morphism"
          style={{ 
            width: '100%',
            marginTop: '12px',
            borderRadius:'16px', 
            padding:'14px', 
            cursor:'pointer', 
            transition: 'all 0.3s', 
            border: '1px solid var(--border)',
            background: 'var(--surface2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--text)'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--surface)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface2)' }}
        >
          <span style={{ fontSize: '18px' }}>🎓</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>College Recommendation</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Find your ideal institution</div>
          </div>
        </button>
      </div>

      <nav style={{ flex:1, padding:'20px 24px', overflow:'hidden', display:'flex', flexDirection:'column' }} aria-label="Session Navigation">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'12px' }}>
          <h3 style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--text3)', fontWeight: 700, margin: 0 }}>Conversations</h3>
          <div style={{ fontSize: '10px', color: 'var(--text3)' }} aria-label={`${sessions.length} sessions total`}>{sessions.length}</div>
        </div>
        
        <button 
          className="premium-gradient"
          aria-label="Start New Session"
          style={{ width:'100%', padding:'12px', border:'none', borderRadius:'14px', color:'var(--bg)', fontSize:'13px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'20px', boxShadow: '0 8px 20px rgba(99,102,241,0.2)', transition: 'all 0.3s', cursor: 'pointer' }} 
          onClick={onNewSession}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: '18px' }} aria-hidden="true">+</span> New Session
        </button>

        <div style={{ flex:1, overflowY:'auto', paddingRight: '4px' }} className="custom-scroll" role="list">
          {sessions.length === 0 && (
            <div style={{ fontSize:'12px', color:'var(--text3)', textAlign:'center', padding:'40px 0', opacity: 0.6 }}>
              No history yet
            </div>
          )}
          {sessions.map((sess, i) => (
            <button key={sess.id}
              role="listitem"
              className="message-entrance"
              aria-current={sess.id===activeSessionId ? "true" : "false"}
              aria-label={`Select session: ${sess.title}`}
              style={{ 
                width: '100%',
                textAlign: 'left',
                padding:'14px 16px', 
                borderRadius:'16px', 
                cursor:'pointer', 
                marginBottom:'8px', 
                border:'1px solid transparent', 
                display:'flex', 
                alignItems:'center', 
                justifyContent:'space-between', 
                transition: 'all 0.3s var(--ease-out-expo)',
                background: sess.id===activeSessionId ? 'var(--gold-glow)' : 'transparent', 
                borderColor: sess.id===activeSessionId ? 'var(--gold)' : 'transparent',
                animationDelay: `${Math.min(i * 0.03, 0.2)}s`,
                transform: sess.id===activeSessionId ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (sess.id !== activeSessionId) {
                  e.currentTarget.style.background = 'var(--surface2)';
                  e.currentTarget.style.borderColor = 'var(--border2)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (sess.id !== activeSessionId) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
              onClick={() => onSelectSession(sess.id)}>
              <div style={{ flex:1, minWidth:0 }}>
                {editingId === sess.id ? (
                  <input
                    autoFocus
                    aria-label="Rename session"
                    style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--gold)', borderRadius:'10px', color:'var(--text)', fontSize:'14px', padding:'6px 10px', outline:'none', boxShadow: '0 0 15px var(--gold-glow)' }}
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        onRenameSession(sess.id, editTitle)
                        setEditingId(null)
                      } else if (e.key === 'Escape') {
                        setEditingId(null)
                      }
                    }}
                    onBlur={() => {
                      onRenameSession(sess.id, editTitle)
                      setEditingId(null)
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <div style={{ fontSize:'14px', color: sess.id===activeSessionId ? 'var(--text)' : 'var(--text2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight: sess.id===activeSessionId ? 700 : 500, transition: 'color 0.3s' }}>{sess.title}</div>
                    <div style={{ fontSize:'11px', color:'var(--text3)', marginTop: '4px', fontWeight: 600, opacity: 0.7 }}>{formatDate(sess.updated_at)}</div>
                  </>
                )}
              </div>
              {(hoveredId === sess.id || sess.id === activeSessionId) && editingId !== sess.id && (
                <div style={{ display:'flex', gap:'8px', animation: 'fadeIn 0.3s var(--ease-out-expo)' }}>
                  <button aria-label="Rename session" title="Rename" style={{ background:'var(--border)', border:'none', color:'var(--text2)', fontSize:'12px', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onClick={e => { e.stopPropagation(); setEditingId(sess.id); setEditTitle(sess.title) }}>✎</button>
                  <button aria-label="Delete session" title="Delete" style={{ background:'rgba(244,63,94,0.1)', border:'none', color:'var(--rust)', fontSize:'14px', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onClick={e => { e.stopPropagation(); onDeleteSession(sess.id) }}>×</button>
                </div>
              )}
            </button>
          ))}
        </div>
      </nav>

      <div style={{ padding:'20px 24px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:'12px' }}>
        <div style={{ width:'40px', height:'40px', background:'linear-gradient(135deg,var(--gold),var(--rust))', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:'var(--bg)', flexShrink:0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} aria-hidden="true">{initials}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'14px', color:'var(--text)', fontWeight: 600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name || 'Guest'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sage)', animation: 'pulse 2s infinite' }} aria-hidden="true" />
            <span style={{ fontSize:'11px', color:'var(--sage)', fontWeight: 600 }}>Active Now</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {user && (
            <button 
              style={{ 
                background: highlightCloudSettings ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)', 
                border: highlightCloudSettings ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)', 
                color: highlightCloudSettings ? 'var(--gold)' : 'var(--text2)', 
                width: '32px',
                height: '32px',
                borderRadius:'10px', 
                fontSize:'16px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition:'all 0.2s',
                cursor: 'pointer',
                animation: highlightCloudSettings ? 'pulse-gold 2s infinite' : 'none',
                boxShadow: highlightCloudSettings ? '0 0 15px var(--gold-glow)' : 'none'
              }} 
              aria-label="Cloud Settings"
              title="Cloud Settings"
              onClick={onEditApiKey}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'var(--gold)' }}
              onMouseLeave={e => { 
                e.currentTarget.style.background = highlightCloudSettings ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)'; 
                e.currentTarget.style.color = highlightCloudSettings ? 'var(--gold)' : 'var(--text2)'; 
                e.currentTarget.style.borderColor = highlightCloudSettings ? 'var(--gold)' : 'rgba(255,255,255,0.08)'; 
              }}
            >
              ☁
            </button>
          )}
          {user && (
            <button 
              style={{ 
                background:'rgba(255,255,255,0.03)', 
                border:'1px solid rgba(255,255,255,0.08)', 
                color:'var(--text2)', 
                width: '32px',
                height: '32px',
                borderRadius:'10px', 
                fontSize:'16px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition:'all 0.2s',
                cursor: 'pointer'
              }} 
              aria-label="Log out"
              title="Log out"
              onClick={onLogout}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = 'var(--rust)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            >
              ⎋
            </button>
          )}
        </div>
      </div>
      <div style={{ padding: isMobile ? '0 24px calc(16px + env(safe-area-inset-bottom, 0px))' : '0 24px 16px', fontSize: '10px', color: 'var(--text3)', opacity: 0.5, textAlign: 'center' }}>
        MIT Licensed • © 2026 Pathfinder
      </div>
    </aside>
  )
}
