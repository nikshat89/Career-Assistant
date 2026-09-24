// MIT License • Copyright (c) 2026 Pathfinder

import { useState, useEffect } from 'react'
import { api } from '../api'

export default function ApiKeyModal({ userId, onClose, onSuccess }) {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setStatus({ type: 'error', message: 'Please enter a valid API key.' })
      return
    }

    setLoading(true)
    setStatus({ type: '', message: '' })
    try {
      const res = await api.saveApiKey(userId, apiKey)
      setStatus({ type: 'success', message: res.message })
      setApiKey('')
      if (onSuccess) onSuccess()
    } catch (e) {
      setStatus({ type: 'error', message: 'Failed to save API key. ' + e.message })
    } finally {
      setLoading(false)
    }
  }

  const sectionStyle = {
    marginBottom: '24px',
    padding: '20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.05)'
  }

  const titleStyle = {
    fontSize: '14px',
    color: 'var(--gold)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(var(--bg-rgb), 0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: isMobile ? '0' : '20px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-morphism" style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border)', 
        borderRadius: isMobile ? '0' : '32px', 
        padding: isMobile ? 'calc(48px + env(safe-area-inset-top, 0px)) 24px calc(24px + env(safe-area-inset-bottom, 0px))' : '40px', 
        width: '640px', 
        height: isMobile ? '100%' : 'auto', 
        maxHeight: isMobile ? '100dvh' : '90vh',
        maxWidth: '100%', 
        boxShadow: '0 50px 100px rgba(0,0,0,0.5)', 
        animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)', 
        position: 'relative', 
        overflowY: 'auto' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Connectivity Settings</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? '28px' : '36px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.1 }}>
              Cloud Model (OpenRouter)
            </h2>
          </div>
          <button style={{ background: 'var(--surface2)', border: 'none', color: 'var(--text3)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', position: isMobile ? 'fixed' : 'relative', top: isMobile ? 'calc(12px + env(safe-area-inset-top, 0px))' : 'auto', right: isMobile ? '16px' : 'auto', zIndex: 210 }} onClick={onClose}>×</button>
        </div>

        {/* Security Section */}
        <div style={sectionStyle}>
          <div style={titleStyle}>
            <span style={{ fontSize: '18px' }}>🔒</span> Security & Privacy
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
            Your privacy is our highest priority. When you provide an API key:
          </p>
          <ul style={{ fontSize: '13px', color: 'var(--text3)', lineHeight: 1.7, marginTop: '12px', paddingLeft: '20px' }}>
            <li>It is <strong>encrypted</strong> using AES-256-CBC before being stored in our database.</li>
            <li>The decryption happens only in memory during an active request to OpenRouter.</li>
            <li>We <strong>never log</strong> your key or use it for any purpose other than your specific career advice requests.</li>
            <li>Your key stays 100% private to your account.</li>
          </ul>
        </div>

        {/* How to get a key */}
        <div style={sectionStyle}>
          <div style={titleStyle}>
            <span style={{ fontSize: '18px' }}>🔑</span> How to get your API Key
          </div>
          <ol style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.8, paddingLeft: '20px', margin: 0 }}>
            <li>Visit <a href="https://openrouter.ai/" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', fontWeight: 700 }}>OpenRouter.ai</a> and sign in.</li>
            <li>Click on <strong>"Keys"</strong> in the left sidebar or under your profile settings.</li>
            <li>Click the <strong>"Create Key"</strong> button.</li>
            <li>Give your key a name (e.g., "Career AI") and click <strong>"Create"</strong>.</li>
            <li>Copy the generated key immediately (it starts with <code>sk-or-v1-...</code>).</li>
          </ol>
        </div>

        {/* Input Section */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>
            Enter your OpenRouter API Key
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type="password"
              style={{ width: '100%', padding: '16px 20px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '18px', fontSize: '15px', color: 'var(--text)', outline: 'none', transition: 'all 0.2s', fontFamily: 'monospace' }} 
              placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx" 
              value={apiKey} 
              onChange={e => setApiKey(e.target.value)} 
            />
          </div>
          
          {status.message && (
            <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', background: status.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: status.type === 'success' ? '#10b981' : '#ef4444', border: `1px solid ${status.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <span>{status.type === 'success' ? '✓' : '⚠'}</span>
              {status.message}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            style={{ flex: 1, padding: '16px', border: '1px solid var(--border)', borderRadius: '18px', color: 'var(--text2)', background: 'transparent', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }} 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="premium-gradient"
            style={{ flex: 2, padding: '16px', border: 'none', borderRadius: '18px', color: 'var(--bg)', fontSize: '15px', fontWeight: 700, boxShadow: '0 10px 30px rgba(99,102,241,0.3)', opacity: loading ? 0.7 : 1, cursor: loading ? 'default' : 'pointer' }} 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving Secretly...' : 'Save & Encrypt Key'}
          </button>
        </div>
        
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text3)', marginTop: '24px', opacity: 0.6 }}>
          By saving your key, you enable Cloud & Reasoning models for advanced career guidance.
        </p>
      </div>
    </div>
  )
}
