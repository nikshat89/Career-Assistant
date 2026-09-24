import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'
import { api } from '../api'

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'inherit',
  suppressErrorWidget: true // Stop Mermaid from injecting global error "bombs"
})

function Mermaid({ chart }) {
  const ref = useRef(null), [error, setError] = useState(false)
  useEffect(() => {
    let isMounted = true
    if (ref.current && chart) {
      const id = 'mermaid-' + Math.random().toString(36).substr(2, 9)
      mermaid.render(id, chart).then(({ svg }) => {
        if (svg.toLowerCase().includes('syntax error') || svg.includes('error-text')) {
          throw new Error('Mermaid returned an error SVG')
        }
        if (isMounted && ref.current) {
          ref.current.innerHTML = svg
          setError(false)
        }
      }).catch(err => {
        console.error('Mermaid render error:', err)
        if (isMounted) setError(true)
        // Aggressively remove any error elements mermaid might have added to body
        const errorWidget = document.getElementById('mermaid-error-overlay')
        if (errorWidget) errorWidget.remove()
      })
    }
    return () => { isMounted = false }
  }, [chart])

  if (error) return (
    <div style={{ margin: '12px 0', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text3)', fontSize: '12px', textAlign: 'center' }}>
      <span style={{ opacity: 0.6 }}>[Diagram format error - The AI used an invalid chart syntax]</span>
    </div>
  )

  return <div ref={ref} style={{ display: 'flex', justifyContent: 'center', margin: '20px 0', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px', overflowX: 'auto' }} />
}

function normalizeMarkdown(text) {
  if (!text) return ''
  
  // Fix cases where AI forgets newlines around code blocks or puts them on the same line
  let normalized = text
    .replace(/([^\n])(```)/g, '$1\n$2')
    .replace(/(```)([^\n\s])/g, '$1\n$2')

  // Only add newlines before headers and lists if they don't have them
  return normalized
    .replace(/^### (.*$)/gm, '\n### $1')
    .replace(/^## (.*$)/gm, '\n## $1')
    .replace(/^# (.*$)/gm, '\n# $1')
    .replace(/^(\d+\. )/gm, '\n$1')
    .replace(/^([-*] )/gm, '\n$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const markdownComponents = {
  p: ({ children }) => <p style={{ margin: '0 0 12px', lineHeight: 1.7, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: '8px 0 16px 24px', padding: 0, display: 'grid', gap: '8px' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '8px 0 16px 24px', padding: 0, display: 'grid', gap: '8px' }}>{children}</ol>,
  li: ({ children }) => <li style={{ lineHeight: 1.6, overflowWrap: 'anywhere', wordBreak: 'break-word', marginBottom: '4px' }}>{children}</li>,
  h1: ({ children }) => <h1 style={{ fontSize: '22px', margin: '24px 0 12px', lineHeight: 1.3, fontWeight: 700 }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: '19px', margin: '20px 0 10px', lineHeight: 1.35, fontWeight: 700 }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '17px', margin: '16px 0 8px', lineHeight: 1.4, fontWeight: 700 }}>{children}</h3>,
  strong: ({ children }) => <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{children}</strong>,
  em: ({ children }) => <em style={{ color: 'var(--text2)', fontStyle: 'italic' }}>{children}</em>,
  code: ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || ''), lang = match ? match[1] : ''
    if (lang === 'mermaid') return <Mermaid chart={String(children).replace(/\n$/, '')} />
    
    if (inline) {
      return <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: '4px', fontSize: '13px', fontFamily: "'Fira Code', monospace", color: 'var(--gold)' }} {...props}>{children}</code>
    }

    return (
      <div style={{ margin: '16px 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#0d0d0d' }}>
        {lang && (
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{lang}</span>
          </div>
        )}
        <pre style={{ margin: 0, padding: '16px', overflowX: 'auto', background: 'transparent' }}>
          <code style={{ fontSize: '13px', fontFamily: "'Fira Code', monospace", lineHeight: 1.5, color: '#e6e6e6', background: 'transparent', padding: 0, border: 'none' }} {...props}>{children}</code>
        </pre>
      </div>
    )
  },
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--gold)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>{children}</a>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border2)', margin: '20px 0' }} />,
  table: ({ children }) => <div style={{ overflowX: 'auto', margin: '16px 0', borderRadius: '12px', border: '1px solid var(--border2)' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table></div>,
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children, index }) => <tr style={{ backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>{children}</tr>,
  th: ({ children }) => <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border2)', fontSize: '13px', background: 'rgba(255,255,255,0.03)' }}>{children}</th>,
  td: ({ children }) => <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>{children}</td>,
}

const SUGGESTIONS = [
  { icon: '🚀', text: 'How do I start a career in AI?', title: 'Career Path' },
  { icon: '📄', text: 'Review my resume and suggest fixes.', title: 'Resume Help' },
  { icon: '💼', text: 'Prepare me for a Senior Role interview.', title: 'Interview' },
  { icon: '🛠️', text: 'What skills are most in-demand today?', title: 'Skill Analysis' }
]

function ChatArea({ user, session, messages, setMessages, onSessionsRefresh, onRenameSession, onToggleSidebar, onEditApiKey, selectedModel, setSelectedModel }) {
  const [input, setInput] = useState(''), [isTyping, setIsTyping] = useState(false), [refreshKey, setRefreshKey] = useState(0)
  const [reasoningSteps, setReasoningSteps] = useState([])
  const [currentReasoningStatus, setCurrentReasoningStatus] = useState(null)
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false)
  const lastAsstRef = useRef(null)
, abortControllerRef = useRef(null), endRef = useRef(null), taRef = useRef(null)
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2), [isMobile, setIsMobile] = useState(window.innerWidth <= 1024)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024)
    window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isModelActive = selectedModel !== 'off', modelColor = selectedModel === 'openrouter' ? 'var(--gold)' : selectedModel === 'lmstudio' ? 'var(--rust)' : selectedModel === 'foundry' ? '#6366f1' : 'var(--text3)', modelGlow = selectedModel === 'openrouter' ? 'rgba(99,102,241,0.15)' : selectedModel === 'lmstudio' ? 'rgba(244,63,94,0.15)' : selectedModel === 'foundry' ? 'rgba(99,102,241,0.25)' : 'transparent', modelBg = selectedModel === 'openrouter' ? 'rgba(99,102,241,0.1)' : selectedModel === 'lmstudio' ? 'rgba(244,63,94,0.1)' : selectedModel === 'foundry' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)', modelBorder = selectedModel === 'openrouter' ? 'rgba(99,102,241,0.3)' : selectedModel === 'lmstudio' ? 'rgba(244,63,94,0.3)' : selectedModel === 'foundry' ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.05)'

  useEffect(() => {
    if ((selectedModel === 'openrouter' || selectedModel === 'foundry') && !user?.has_api_key) {
      setShowApiKeyPrompt(true)
    } else {
      setShowApiKeyPrompt(false)
    }
  }, [selectedModel, user?.has_api_key])

  useEffect(() => { return () => { if (abortControllerRef.current) abortControllerRef.current.abort() } }, [session?.id])
  
  const scrollToBottom = (behavior = 'smooth') => {
    endRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => { 
    if (isTyping) {
      scrollToBottom('smooth')
    }
  }, [messages, isTyping])

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollToBottom(!isAtBottom)
  }

  function stopGeneration() { if (abortControllerRef.current) { abortControllerRef.current.abort(); setIsTyping(false) } }
  function resize() { const t = taRef.current; if (!t) return; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 140) + 'px' }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || isTyping || !session || selectedModel === 'off') { if (selectedModel === 'off') alert('Please select a model first'); return }
    setInput(''); if (taRef.current) taRef.current.style.height = 'auto'
    const userMsg = { role:'user', content:msg, created_at: new Date().toISOString(), id:'tmp-'+Date.now() }
    setMessages(prev => [...prev, userMsg]); setIsTyping(true)
    const abortController = new AbortController(); abortControllerRef.current = abortController
    try {
      if (selectedModel === 'foundry') {
        const streamRes = await api.sendFoundryReasoning(session.id, user.id, msg, abortController.signal)
        const asstMsg = { role:'assistant', content:'', created_at: new Date().toISOString(), id:'tmp-asst-'+Date.now() }
        setMessages(prev => [...prev, asstMsg]); lastAsstRef.current = asstMsg.id
        setReasoningSteps([])
        
        const reader = streamRes.body.getReader(), decoder = new TextDecoder()
        let fullReply = '', buffer = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            buffer += decoder.decode(value || new Uint8Array(), {stream: !done})
            const lines = buffer.split('\n'); buffer = lines.pop() || ''
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6); if (data === '[DONE]') break
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.status === 'completed_step') {
                    setReasoningSteps(prev => [...prev, parsed])
                    setCurrentReasoningStatus(null)
                  } else if (parsed.status) {
                    setCurrentReasoningStatus(parsed)
                  } else if (typeof parsed === 'string') {
                    fullReply += parsed
                    setMessages(prev => prev.map(m => m.id === asstMsg.id ? { ...m, content: fullReply } : m))
                  }
                } catch (e) { 
                  // Fallback for non-JSON or malformed chunks
                  if (data !== '') {
                    fullReply += data
                    setMessages(prev => prev.map(m => m.id === asstMsg.id ? { ...m, content: fullReply } : m))
                  }
                }
              }
            }
            if (done) break
          }
        } finally { reader.releaseLock(); setCurrentReasoningStatus(null) }
      } else {
        const useHf = false, useLm = selectedModel === 'lmstudio'
        const streamRes = await api.sendMessage(session.id, user.id, msg, true, useHf, useLm, abortController.signal)
        const asstMsg = { role:'assistant', content:'', created_at: new Date().toISOString(), id:'tmp-asst-'+Date.now() }
        setMessages(prev => [...prev, asstMsg]); lastAsstRef.current = asstMsg.id
        const reader = streamRes.body.getReader(), decoder = new TextDecoder()
        let fullReply = '', buffer = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            buffer += decoder.decode(value || new Uint8Array(), {stream: !done})
            const lines = buffer.split('\n'); buffer = lines.pop() || ''
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6); if (data === '[DONE]') break
                let delta = data; try { const parsed = JSON.parse(data); if (typeof parsed === 'string') delta = parsed } catch (e) { if (data === '') delta = '\n' }
                if (delta !== '') { fullReply += delta; setMessages(prev => prev.map(m => m.id === asstMsg.id ? { ...m, content: fullReply } : m)) }
              }
            }
            if (done) break
          }
        } finally { reader.releaseLock() }
      }
    } catch(e) {
      if (e.name !== 'AbortError') setMessages(prev => prev.slice(0, -1).concat({ role:'assistant', content: 'Error: ' + e.message, created_at: new Date().toISOString(), id:'err-'+Date.now() }))
    } finally { 
      try { const off = await api.getSession(session.id); if (off?.messages) setMessages(off.messages) } catch (e) {}
      onSessionsRefresh(); setIsTyping(false); lastAsstRef.current = null; abortControllerRef.current = null
    }
  }

  const h = new Date().getHours(), greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  useEffect(() => { if (!isTyping && lastAsstRef.current && (selectedModel === 'openrouter' || selectedModel === 'lmstudio')) setRefreshKey(Date.now()) }, [isTyping, selectedModel])

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', height: isMobile ? '100dvh' : '100vh', overflow:'hidden', background: 'var(--bg)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: 'radial-gradient(circle at top right, var(--gold-glow), transparent 40%), radial-gradient(circle at bottom left, rgba(244,63,94,0.03), transparent 40%)', pointerEvents: 'none', opacity: 0.5, zIndex: 0 }}></div>
      <div className="glass-morphism" style={{ padding: isMobile ? 'calc(12px + env(safe-area-inset-top, 0px)) 16px 12px' : '20px 32px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, zIndex: 10, gap: '12px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px', minWidth: 0, flex: 1 }}>
          {isMobile && <button onClick={onToggleSidebar} aria-label="Toggle Sidebar" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', fontSize: '20px', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>☰</button>}
          <div style={{ width: isMobile ? '36px' : '44px', height: isMobile ? '36px' : '44px', borderRadius: '12px', background: modelBg, border: `1px solid ${modelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.5s', boxShadow: isModelActive ? `0 0 20px ${modelGlow}` : 'none', animation: isModelActive ? 'float 4s ease-in-out infinite' : 'none', flexShrink: 0 }}>
            <div style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px', position: 'relative', opacity: isModelActive ? 1 : 0.4 }}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="6" width="20" height="14" rx="5" stroke={isModelActive ? modelColor : 'var(--text3)'} strokeWidth="2" />
                <path d="M7 11V13" stroke={isModelActive ? modelColor : 'var(--text3)'} strokeWidth="2" strokeLinecap="round" />
                <path d="M17 11V13" stroke={isModelActive ? modelColor : 'var(--text3)'} strokeWidth="2" strokeLinecap="round" />
                <path d="M10 16C10 16 11 17 12 17C13 17 14 16 14 16" stroke={isModelActive ? modelColor : 'var(--text3)'} strokeWidth="1.5" strokeLinecap="round" />
                {isModelActive && <circle cx="12" cy="3" r="1.5" fill={modelColor} style={{ animation: 'pulse 1s infinite' }} />}
              </svg>
            </div>
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', background: isModelActive ? (selectedModel === 'openrouter' ? 'var(--sage)' : modelColor) : 'var(--text3)', border: '2px solid var(--bg)', animation: isModelActive ? 'pulse 2s infinite' : 'none' }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? '16px' : '22px', fontWeight:700, color:'var(--text)', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session ? session.title : greeting + ', ' + (user?.name?.split(' ')[0]||'')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop:'2px' }}>
              <div style={{ fontSize:'9px', color: isModelActive ? modelColor : 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{isModelActive ? `${selectedModel === 'openrouter' ? 'Cloud' : 'Local'} AI Active` : 'AI Sleeping'}</div>
              {isTyping && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: modelColor, animation: 'pulse 1s infinite', flexShrink: 0 }} />}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', flexShrink: 0 }}>
          <div className="glass-morphism" style={{ display:'flex', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '2px', gap: '2px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              {value:'off',label:'Off',color:'var(--text3)'},
              {value:'openrouter',label:'Cloud',color:'var(--gold)'},
              {value:'lmstudio',label:'Local',color:'var(--rust)'},
              {value:'foundry',label:'Reasoning',color:'#6366f1'}
            ].map((opt) => (
              <button key={opt.value} aria-pressed={selectedModel === opt.value} style={{ padding: isMobile ? '6px 8px' : '8px 14px', background: selectedModel === opt.value ? (opt.value === 'off' ? 'rgba(255,255,255,0.05)' : opt.color + '20') : 'transparent', border: 'none', color: selectedModel === opt.value ? opt.color : 'var(--text3)', borderRadius: '10px', fontSize: isMobile ? '9px' : '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', textTransform: 'uppercase', letterSpacing: '0.5px' }} onClick={() => setSelectedModel(opt.value)}>{opt.label}</button>
            ))}
          </div>
        </div>
      </div>
      <div 
        onScroll={handleScroll}
        style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding: isMobile ? '20px 16px' : '32px', display:'flex', flexDirection:'column', gap: isMobile ? '16px' : '24px', position: 'relative', zIndex: 1 }}
      >
        {showApiKeyPrompt && (
          <div style={{ position: 'sticky', top: 0, zIndex: 100, marginBottom: '16px', animation: 'fadeDown 0.4s ease-out' }}>
            <div className="glass-morphism" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '16px 20px', borderRadius: '16px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '24px' }}>☁️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>API Key Required</div>
                <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500, lineHeight: 1.4 }}>
                  To use {selectedModel === 'foundry' ? 'Reasoning' : 'Cloud'} mode, please provide your OpenRouter API key in <span onClick={onEditApiKey} style={{ color: 'var(--gold)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Cloud Settings</span>.
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Reasoning Flow Visualization */}
        {(reasoningSteps.length > 0 || currentReasoningStatus) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', marginLeft: '4px', opacity: 0.8 }}>
              Reasoning Engine Activity
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
              {reasoningSteps.map((step, idx) => (
                <div key={idx} className="glass-morphism" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.5s ease-out' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#10b981', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 900 }}>✓</div>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>{step.agent} Done</div>
                </div>
              ))}
            </div>

            {currentReasoningStatus && (
              <div className="glass-morphism step-card-3d" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '20px 24px', borderRadius: '20px', backdropFilter: 'blur(16px)', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <div className="spin" style={{ width: '24px', height: '24px', border: '3px solid rgba(99, 102, 241, 0.1)', borderTopColor: '#6366f1', borderRadius: '50%' }}></div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>⚡</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {currentReasoningStatus.status} {currentReasoningStatus.step ? `• Step ${currentReasoningStatus.step}` : ''}
                    </div>
                    <div style={{ fontSize: '15px', color: 'var(--text)', fontWeight: 600, marginTop: '2px' }}>
                      {currentReasoningStatus.agent ? <span style={{ color: '#818cf8' }}>{currentReasoningStatus.agent} is </span> : ''}
                      {currentReasoningStatus.message.toLowerCase()}...
                    </div>
                  </div>
                </div>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: 'linear-gradient(to bottom, #6366f1, #8b5cf6)', borderRadius: '20px 0 0 20px' }}></div>
              </div>
            )}
          </div>
        )}
        {!session || messages.length === 0 ? 
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding: isMobile ? '20px' : '40px 20px', animation:'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <div style={{ width: isMobile ? '100px' : '120px', height: isMobile ? '100px' : '120px', position: 'relative', marginBottom: isMobile ? '24px' : '40px', animation: 'float 5s ease-in-out infinite' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '180%', height: '180%', background: `radial-gradient(circle, ${modelGlow} 0%, transparent 70%)`, zIndex: -1 }}></div>
              <div style={{ width: '100%', height: '100%', background: isModelActive ? `linear-gradient(145deg, ${modelColor}, ${selectedModel === 'openrouter' ? '#4f46e5' : '#e11d48'})` : 'linear-gradient(145deg, var(--surface2), var(--surface))', borderRadius: '40px', boxShadow: isModelActive ? `0 30px 60px rgba(0,0,0,0.3), inset -8px -8px 20px rgba(0,0,0,0.2), inset 8px 8px 20px rgba(255,255,255,0.3)` : '0 10px 30px rgba(0,0,0,0.1), inset -4px -4px 10px rgba(0,0,0,0.2), inset 4px 4px 10px rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.5s' }}>
                <div style={{ width: '70%', height: '35%', background: '#1a1b26', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '10px', height: '10px', background: isModelActive ? '#fff' : 'var(--text3)', borderRadius: '50%', boxShadow: isModelActive ? '0 0 15px #fff' : 'none', animation: isModelActive ? 'pulse 2s infinite' : 'none' }}></div>
                  <div style={{ width: '10px', height: '10px', background: isModelActive ? '#fff' : 'var(--text3)', borderRadius: '50%', boxShadow: isModelActive ? '0 0 15px #fff' : 'none', animation: isModelActive ? 'pulse 2s infinite' : 'none' }}></div>
                </div>
                <div style={{ width: '30%', height: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '2px' }}></div>
              </div>
              <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '25px', background: `linear-gradient(to top, ${modelColor}, transparent)`, borderRadius: '2px' }}>
                <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', width: '12px', height: '12px', background: modelColor, borderRadius: '50%', boxShadow: isModelActive ? `0 0 20px ${modelColor}` : 'none', animation: isModelActive ? 'pulse 1s infinite' : 'none' }}></div>
              </div>
            </div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'36px', fontWeight:700, color:'var(--text)', lineHeight:1.1, marginBottom:'16px' }}>Ready to shape your future?</h2>
            
            {/* Quick Suggestions */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', maxWidth: '600px', width: '100%', marginTop: '20px' }}>
              {SUGGESTIONS.map((s, idx) => (
                <button 
                  key={idx}
                  onClick={() => send(s.text)}
                  disabled={!session || selectedModel === 'off'}
                  className="glass-morphism"
                  style={{ 
                    padding: '16px', 
                    borderRadius: '16px', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid rgba(255,255,255,0.05)', 
                    textAlign: 'left', 
                    cursor: (!session || selectedModel === 'off') ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    opacity: (!session || selectedModel === 'off') ? 0.5 : 1
                  }}
                  onMouseEnter={e => {
                    if (session && selectedModel !== 'off') {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'var(--gold)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (session && selectedModel !== 'off') {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{s.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 500 }}>{s.text}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        : 
          <>
            {messages.map((msg, i) => (
              <div 
                key={msg.id||i} 
                className="message-entrance"
                style={{ 
                  display:'flex', 
                  gap:'16px', 
                  alignItems:'flex-start', 
                  justifyContent: msg.role==='user' ? 'flex-end' : 'flex-start',
                  animationDelay: `${Math.min(i * 0.05, 0.3)}s` 
                }}
              >
                {msg.role==='assistant' && (
                  <div className="premium-gradient" style={{ width:'40px', height:'40px', borderRadius:'14px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--bg)', boxShadow: '0 8px 20px rgba(99,102,241,0.2)', marginTop: '4px', transition: 'all 0.4s var(--ease-out-expo)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="15" x2="8" y2="15.01" /><line x1="16" y1="15" x2="16" y2="15.01" /></svg>
                  </div>
                )}
                <div style={{ display:'flex', flexDirection:'column', gap:'8px', maxWidth:'80%', position: 'relative' }}>
                  <div className="message-bubble" style={{ padding:'18px 24px', borderRadius:'24px', fontSize:'16px', lineHeight:1.7, position: 'relative', overflowWrap: 'anywhere', wordBreak: 'break-word', transition: 'all 0.4s var(--ease-out-expo)', ...(msg.role==='user' ? { borderBottomRightRadius:'4px', background:'linear-gradient(135deg, var(--gold), var(--gold-dim))', color:'#fff', fontWeight: 500, boxShadow: '0 12px 30px rgba(99,102,241,0.2)' } : { borderBottomLeftRadius:'4px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }) }}>
                    {msg.role==='assistant' ? (
                      <>
                        {isTyping && msg.id === lastAsstRef.current && (selectedModel === 'openrouter' || selectedModel === 'lmstudio') ? (
                          <div key={'raw-' + msg.id} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontFamily: 'inherit', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                            {msg.content}<span style={{ display: 'inline-block', width: '3px', height: '18px', background: 'var(--gold)', marginLeft: '4px', verticalAlign: 'middle', animation: 'pulse 0.8s infinite' }} />
                          </div>
                        ) : (
                          <ReactMarkdown key={'md-' + msg.id + msg.content.slice(-10)} remarkPlugins={[remarkGfm]} components={markdownComponents}>{normalizeMarkdown(msg.content)}</ReactMarkdown>
                        )}
                        {/* Copy Button */}
                        <button 
                          onClick={() => handleCopy(msg.id, msg.content)}
                          aria-label="Copy Response"
                          style={{ 
                            position: 'absolute', 
                            top: '12px', 
                            right: '12px', 
                            background: 'rgba(255,255,255,0.08)', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: '10px', 
                            color: copiedId === msg.id ? 'var(--sage)' : 'var(--text3)', 
                            fontSize: '11px', 
                            padding: '6px 12px', 
                            cursor: 'pointer',
                            opacity: 0,
                            transform: 'translateY(-4px)',
                            transition: 'all 0.3s var(--ease-out-expo)'
                          }}
                          className="copy-btn"
                        >
                          {copiedId === msg.id ? '✓ Copied' : 'Copy'}
                        </button>
                      </>
                    ) : msg.content}
                  </div>
                  <div style={{ fontSize:'10px', color:'var(--text3)', padding:'0 12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', textAlign: msg.role==='user' ? 'right' : 'left', opacity: 0.8 }}>{new Date(msg.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                {msg.role==='user' && <div style={{ width:'40px', height:'40px', borderRadius:'14px', flexShrink:0, background:'var(--surface2)', border: '1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:800, color:'var(--gold)', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.4s var(--ease-out-expo)' }}>{initials}</div>}
              </div>
            ))}
          </>
        }
        <div ref={endRef} />
      </div>
      
      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <button 
          onClick={() => scrollToBottom()}
          aria-label="Scroll to bottom"
          style={{ 
            position: 'absolute', 
            bottom: '100px', 
            right: '24px', 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: 'var(--surface)', 
            border: '1px solid var(--border)', 
            color: 'var(--gold)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer', 
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 20,
            animation: 'fadeUp 0.3s ease'
          }}
        >
          ↓
        </button>
      )}

      <div style={{ padding: isMobile ? '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))' : '24px 32px 32px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap: isMobile ? '8px' : '12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'18px', padding: isMobile ? '6px 10px' : '10px 14px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', transition: 'all 0.3s', position: 'relative' }}>
          <textarea 
            ref={taRef} 
            aria-label="Message Input"
            style={{ flex:1, border:'none', outline:'none', background:'transparent', color:'var(--text)', fontSize:'15px', lineHeight:1.6, resize:'none', minHeight:'24px', maxHeight:'140px', padding: '6px 4px', scrollbarWidth: 'none' }} 
            placeholder={selectedModel === 'off' ? 'Choose a model above to begin...' : (session ? 'Describe your career challenge...' : 'Start a new session to chat...')} 
            value={input} 
            onChange={e => { setInput(e.target.value); resize() }} 
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); if (!isTyping) send() } }} 
            disabled={!session || selectedModel === 'off'} 
            rows={1} 
          />
          {isTyping ? (
            <button aria-label="Stop Generation" style={{ width:'40px', height:'40px', flexShrink:0, border:'1px solid var(--rust)', borderRadius:'14px', color:'var(--rust)', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition: 'all 0.3s', cursor: 'pointer' }} onClick={stopGeneration}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></button>
          ) : (
            <button className="premium-gradient" aria-label="Send Message" style={{ width:'40px', height:'40px', flexShrink:0, border:'none', borderRadius:'14px', color:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 5px 15px rgba(99,102,241,0.2)', transition: 'all 0.3s', opacity: (!input.trim()||isTyping||!session||selectedModel === 'off')?0.4:1, cursor: (!input.trim()||isTyping||!session||selectedModel === 'off')?'default':'pointer' }} onClick={() => send()} disabled={!input.trim()||isTyping||!session||selectedModel === 'off'}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
          )}
        </div>
        <div style={{ fontSize:'11px', color:'var(--text3)', textAlign:'center', marginTop:'12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>Shift + Enter for new line • Personalised by your profile • MIT Licensed</div>
      </div>
    </div>
  )
}
export default ChatArea
