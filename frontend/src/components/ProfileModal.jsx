import { useState, useEffect } from 'react'
import { api } from '../api'

export default function ProfileModal({ profile, userId, onSave, onClose }) {
  const apiObj = api
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ current_role: '', years_experience: '', career_goals: '' })
  const [skills, setSkills] = useState([])
  const [interests, setInterests] = useState([])
  const [status, setStatus] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function mergeUniqueTags(current, incoming) {
    const seen = new Set()
    return [...current, ...incoming].filter(item => {
      const value = item?.trim()
      if (!value) return false
      const key = value.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  useEffect(() => {
    if (profile) {
      setForm({
        current_role: profile.current_role || '',
        years_experience: profile.years_experience?.toString() || '',
        career_goals: profile.career_goals || ''
      })
      setSkills(profile.skills || [])
      setInterests(profile.interests || [])
    } else {
      setForm({ current_role: '', years_experience: '', career_goals: '' })
      setSkills([])
      setInterests([])
    }
  }, [profile])
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [resumeFile, setResumeFile] = useState(null)

  function addTag(val, list, setList, setInput) {
    if (!val.trim() || list.includes(val.trim())) return
    setList([...list, val.trim()]); setInput('')
  }

  async function handleResumeUpload() {
    if (!resumeFile || !userId) return
    setUploading(true)
    setError('')
    setStatus('')
    try {
      const result = await apiObj.uploadResume(userId, resumeFile)
      const mergedSkills = mergeUniqueTags(skills, result.skills || [])
      const mergedInterests = mergeUniqueTags(interests, result.interests || [])
      setSkills(mergedSkills)
      setInterests(mergedInterests)
      setStatus(`Resume processed. ${mergedSkills.length} skills and ${mergedInterests.length} interests filled for your review.`)
    } catch (e) {
      setError('Upload failed: ' + e.message)
    } finally {
      setUploading(false)
      setResumeFile(null)
    }
  }

  const handleSave = async () => {
    setLoading(true); setError(''); setStatus('')
    try {
      const payload = { ...form, years_experience: parseInt(form.years_experience) || 0, skills, interests }
      await apiObj.saveProfile(userId, payload)
      onSave(payload)
    } catch (e) { setError('Failed to save. Please try again.') }
    finally { setLoading(false) }
  }

  const inp = { width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', fontSize: '14px', color: 'var(--text)', outline: 'none', transition: 'all 0.2s' }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px', marginTop: '4px' }
  const tagBox = { display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', minHeight: '80px', alignContent: 'flex-start' }
  const tag = { background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--gold)', padding: '5px 12px', borderRadius: '999px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(var(--bg-rgb), 0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: isMobile ? '0' : '20px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-morphism" style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border)', 
        borderRadius: isMobile ? '0' : '32px', 
        padding: isMobile ? 'calc(48px + env(safe-area-inset-top, 0px)) 20px calc(24px + env(safe-area-inset-bottom, 0px))' : '40px', 
        width: '580px', 
        height: isMobile ? '100%' : 'auto', 
        maxHeight: isMobile ? '100dvh' : '90vh',
        maxWidth: '100%', 
        boxShadow: '0 40px 100px rgba(0,0,0,0.4)', 
        animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
        position: 'relative', 
        overflowY: 'auto' 
      }}>
        
        {/* Progress bar */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '4px', background: 'var(--surface2)', zIndex: 110 }}>
          <div style={{ width: `${(step / 3) * 100}%`, height: '100%', background: 'var(--gold)', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 15px var(--gold-glow)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Setup Step {step} of 3</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? '24px' : '32px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.1 }}>
              {step === 1 ? 'Start with your Resume' : step === 2 ? 'Skills & Expertise' : 'Future Goals'}
            </h2>
          </div>

          <button style={{ background: 'var(--surface2)', border: 'none', color: 'var(--text3)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', position: isMobile ? 'fixed' : 'relative', top: isMobile ? 'calc(12px + env(safe-area-inset-top, 0px))' : 'auto', right: isMobile ? '16px' : 'auto', zIndex: 110 }} onClick={onClose} onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}>×</button>
        </div>

        {error && <div style={{ background: 'var(--surface)', border: '1px solid var(--rust)', color: 'var(--rust)', padding: '12px 16px', borderRadius: '14px', fontSize: '13px', marginBottom: '24px', animation: 'fadeIn 0.3s ease' }}>{error}</div>}
        {status && <div style={{ background: 'var(--surface)', border: '1px solid var(--sage)', color: 'var(--sage)', padding: '12px 16px', borderRadius: '14px', fontSize: '13px', marginBottom: '24px', animation: 'fadeIn 0.3s ease' }}>{status}</div>}

        <div 
          key={step}
          style={{ 
            minHeight: isMobile ? 'auto' : '300px',
            animation: 'fadeUp 0.5s var(--ease-out-expo) both'
          }}
        >
          {step === 1 && (
            <div>
              <div style={{ marginBottom: '32px' }}>
                <div style={{ background: 'var(--surface2)', border: '1px dashed var(--border)', borderRadius: '24px', padding: isMobile ? '24px' : '32px', textAlign: 'center', transition: 'all 0.3s' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '20px', fontWeight: 500 }}>Upload your resume and we\'ll fill the details for you automatically.</div>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                    <input type="file" id="resume-up" accept=".pdf,.docx" style={{ display: 'none' }} onChange={e => setResumeFile(e.target.files[0])} />
                    <label htmlFor="resume-up" style={{ flex: 1, padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all 0.2s' }}>
                      {resumeFile ? resumeFile.name : 'Select PDF or DOCX'}
                    </label>
                    <button 
                      style={{ padding: '14px 28px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 700, fontSize: '13px', opacity: uploading || !resumeFile ? 0.6 : 1, transition: 'all 0.3s var(--ease-out-expo)', cursor: uploading || !resumeFile ? 'default' : 'pointer', boxShadow: '0 8px 20px var(--gold-glow)' }} 
                      onClick={handleResumeUpload} 
                      disabled={uploading || !resumeFile}
                    >
                      {uploading ? 'Analyzing...' : 'Auto-Fill'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={lbl}>Current or Target Role</label>
                  <input 
                    style={inp} 
                    placeholder="e.g. Senior Product Designer" 
                    value={form.current_role} 
                    onChange={e => setForm({...form, current_role: e.target.value})} 
                    onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.background = 'var(--surface2)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface)' }}
                  />
                </div>
                <div>
                  <label style={lbl}>Years of Experience</label>
                  <input 
                    style={inp} 
                    type="number"
                    placeholder="e.g. 5" 
                    value={form.years_experience} 
                    onChange={e => setForm({...form, years_experience: e.target.value})} 
                    onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.background = 'var(--surface2)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface)' }}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <label style={lbl}>Key Skills</label>
              <div style={{ ...tagBox, marginBottom: '24px', transition: 'all 0.3s' }}>
                {skills.map(s => (
                  <span key={s} className="message-entrance" style={{ ...tag, animationDuration: '0.3s' }}>
                    {s}
                    <span style={{ cursor: 'pointer', opacity: 0.6, fontSize: '16px', marginLeft: '4px' }} onClick={() => setSkills(skills.filter(v => v !== s))}>×</span>
                  </span>
                ))}
                <input 
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: 'var(--text)', minWidth: '120px', flex: 1, padding: '4px' }} 
                  placeholder="Type skill & press Enter" 
                  value={skillInput} 
                  onChange={e => setSkillInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && addTag(skillInput, skills, setSkills, setSkillInput)} 
                />
              </div>

              <label style={lbl}>Interests / Industries</label>
              <div style={tagBox}>
                {interests.map(i => (
                  <span key={i} className="message-entrance" style={{ ...tag, color: 'var(--rust)', animationDuration: '0.3s' }}>
                    {i}
                    <span style={{ cursor: 'pointer', opacity: 0.6, fontSize: '16px', marginLeft: '4px' }} onClick={() => setInterests(interests.filter(v => v !== i))}>×</span>
                  </span>
                ))}
                <input 
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: 'var(--text)', minWidth: '120px', flex: 1, padding: '4px' }} 
                  placeholder="Type industry & press Enter" 
                  value={interestInput} 
                  onChange={e => setInterestInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && addTag(interestInput, interests, setInterests, setInterestInput)} 
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label style={lbl}>What are your career goals?</label>
              <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '16px' }}>What kind of role or growth are you aiming for in the next 1-2 years?</p>
              <textarea 
                style={{ ...inp, resize: 'none', lineHeight: 1.6, minHeight: '180px', padding: '20px' }} 
                placeholder="I'm looking to pivot into AI/ML and eventually lead a design team..." 
                value={form.career_goals} 
                onChange={e => setForm({...form, career_goals: e.target.value})} 
                onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.background = 'var(--surface2)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface)' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          {step > 1 ? (
            <button 
              style={{ padding: '12px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', color: 'var(--text2)', fontSize: '14px', fontWeight: 600 }} 
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          ) : (
            <button 
              style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '14px', color: 'var(--text3)', fontSize: '14px' }} 
              onClick={onClose}
            >
              Skip for now
            </button>
          )}

          <button 
            className="premium-gradient"
            style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '14px', color: 'var(--bg)', fontSize: '15px', fontWeight: 700, boxShadow: '0 10px 20px var(--gold-glow)', opacity: loading ? 0.7 : 1 }} 
            onClick={step < 3 ? () => setStep(step + 1) : handleSave} 
            disabled={loading}
          >
            {loading ? 'Finalizing...' : step < 3 ? 'Next Step' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  )
}
