import { useState, useEffect } from 'react'
import { api } from '../api'

export default function CollegeRecommendationForm({ userId, profile, onComplete, onClose }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    max_budget: '',
    preferred_college_type: 'Any',
    entrance_exams: {},
    preferred_courses: [],
    preferred_locations: []
  })
  const [courseInput, setCourseInput] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [examName, setExamName] = useState('')
  const [examScore, setExamScore] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (profile) {
      setForm({
        max_budget: profile.max_budget || '',
        preferred_college_type: profile.preferred_college_type || 'Any',
        entrance_exams: profile.entrance_exams || {},
        preferred_courses: profile.preferred_courses || [],
        preferred_locations: profile.preferred_locations || []
      })
    }
  }, [profile])

  const addTag = (val, list, setter) => {
    if (!val.trim() || list.includes(val.trim())) return
    setter([...list, val.trim()])
  }

  const addExam = (name = null, score = null) => {
    const n = name || examName.trim()
    const s = score || examScore.trim()
    if (!n || !s) return
    setForm({
      ...form,
      entrance_exams: { ...form.entrance_exams, [n]: s }
    })
    if (!name) setExamName('')
    if (!score) setExamScore('')
  }

  const removeExam = (name) => {
    const newExams = { ...form.entrance_exams }
    delete newExams[name]
    setForm({ ...form, entrance_exams: newExams })
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        max_budget: parseInt(form.max_budget) || 0
      }
      await api.saveProfile(userId, payload)
      onComplete(payload)
    } catch (e) {
      setError('Failed to save preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp = { width: '100%', padding: '14px 18px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '16px', fontSize: '14px', color: 'var(--text)', outline: 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px', marginTop: '6px' }
  const tagBox = { display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '20px', minHeight: '80px', alignContent: 'flex-start' }
  const tag = { background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--gold)', padding: '6px 14px', borderRadius: '999px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
  const quickChip = { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(var(--bg-rgb), 0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? '0' : '24px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-morphism" style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border)', 
        borderRadius: isMobile ? '0' : '40px', 
        padding: isMobile ? 'calc(60px + env(safe-area-inset-top, 0px)) 24px calc(24px + env(safe-area-inset-bottom, 0px))' : '48px', 
        width: '800px', 
        height: isMobile ? '100%' : 'auto', 
        maxHeight: isMobile ? '100dvh' : '90vh',
        maxWidth: '100%', 
        boxShadow: '0 50px 120px rgba(0,0,0,0.5)', 
        animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)', 
        position: 'relative', 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Progress Bar */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '6px', background: 'var(--surface2)', zIndex: 1100 }}>
          <div style={{ width: `${(step / 3) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold), var(--rust))', transition: 'width 0.8s cubic-bezier(0.65, 0, 0.35, 1)', boxShadow: '0 0 20px var(--gold-glow)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>{step === 1 ? '🧬' : step === 2 ? '📍' : '💰'}</span>
              <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2.5px' }}>Discovery Phase {step} / 3</div>
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? '28px' : '42px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.1 }}>
              {step === 1 ? 'Academic Foundations' : step === 2 ? 'Aspiration Details' : 'Strategic Constraints'}
            </h2>
            <p style={{ color: 'var(--text3)', fontSize: '14px', marginTop: '12px', maxWidth: '500px' }}>
              {step === 1 ? 'Provide your entrance exam scores so we can calculate your eligibility for top institutions.' : 
               step === 2 ? 'Define your preferred field of study and the regions where you would like to pursue your education.' : 
               'Set your financial parameters and preferred institution types to narrow down the perfect match.'}
            </p>
          </div>
          <button style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s', fontSize: '20px' }} onClick={onClose} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--rust)'}>×</button>
        </div>

        {error && <div className="message-entrance" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid var(--rust)', color: 'var(--rust)', padding: '14px 20px', borderRadius: '16px', fontSize: '13px', marginBottom: '32px', fontWeight: 500 }}>{error}</div>}

        <div style={{ display: 'flex', gap: '40px', flex: 1, flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ flex: 1 }}>
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div>
                  <label style={lbl}>Entrance Exams & Achievements</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {['NEET UG', 'JEE Main', 'JEE Advanced', 'BITSAT', 'GATE', 'CAT', 'CLAT'].map(ex => (
                      <div key={ex} style={quickChip} onClick={() => setExamName(ex)} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>+ {ex}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <input style={{ ...inp, flex: 2 }} placeholder="Exam Name" value={examName} onChange={e => setExamName(e.target.value)} />
                    <input style={{ ...inp, flex: 1 }} placeholder="Score/Rank" value={examScore} onChange={e => setExamScore(e.target.value)} />
                    <button className="premium-gradient" style={{ padding: '0 24px', color: 'var(--bg)', border: 'none', borderRadius: '16px', fontWeight: 800, cursor: 'pointer' }} onClick={() => addExam()}>Add</button>
                  </div>
                  <div style={tagBox}>
                    {Object.entries(form.entrance_exams).length === 0 && <div style={{ color: 'var(--text3)', fontSize: '13px', fontStyle: 'italic', padding: '10px' }}>No exams added yet...</div>}
                    {Object.entries(form.entrance_exams).map(([name, score]) => (
                      <span key={name} className="message-entrance" style={{ ...tag, background: 'var(--surface2)' }}>
                        <span style={{ opacity: 0.7, fontWeight: 500 }}>{name}:</span> {score}
                        <span style={{ cursor: 'pointer', marginLeft: '6px', fontSize: '16px', color: 'var(--rust)' }} onClick={() => removeExam(name)}>×</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div>
                  <label style={lbl}>Preferred Disciplines</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {['MBBS', 'B.Tech CSE', 'MBA', 'Law', 'Architecture', 'Design', 'Data Science'].map(c => (
                      <div key={c} style={quickChip} onClick={() => addTag(c, form.preferred_courses, (l) => setForm({...form, preferred_courses: l}))}>+ {c}</div>
                    ))}
                  </div>
                  <div style={{ ...tagBox, marginBottom: '20px' }}>
                    {form.preferred_courses.map(c => (
                      <span key={c} className="message-entrance" style={tag}>
                        {c}
                        <span style={{ cursor: 'pointer', marginLeft: '6px', fontSize: '16px' }} onClick={() => setForm({ ...form, preferred_courses: form.preferred_courses.filter(v => v !== c) })}>×</span>
                      </span>
                    ))}
                    <input 
                      style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: 'var(--text)', minWidth: '150px', flex: 1, padding: '8px' }} 
                      placeholder="Type course & press Enter" 
                      value={courseInput} 
                      onChange={e => setCourseInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && addTag(courseInput, form.preferred_courses, (list) => setForm({ ...form, preferred_courses: list }), setCourseInput)} 
                    />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Target Locations</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata'].map(l => (
                      <div key={l} style={quickChip} onClick={() => addTag(l, form.preferred_locations, (list) => setForm({...form, preferred_locations: list}))}>+ {l}</div>
                    ))}
                  </div>
                  <div style={{ ...tagBox, background: 'rgba(var(--sage-rgb), 0.05)' }}>
                    {form.preferred_locations.map(l => (
                      <span key={l} className="message-entrance" style={{ ...tag, color: 'var(--sage)', borderColor: 'var(--sage)' }}>
                        {l}
                        <span style={{ cursor: 'pointer', marginLeft: '6px', fontSize: '16px' }} onClick={() => setForm({ ...form, preferred_locations: form.preferred_locations.filter(v => v !== l) })}>×</span>
                      </span>
                    ))}
                    <input 
                      style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: 'var(--text)', minWidth: '150px', flex: 1, padding: '8px' }} 
                      placeholder="Type location & press Enter" 
                      value={locationInput} 
                      onChange={e => setLocationInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && addTag(locationInput, form.preferred_locations, (list) => setForm({ ...form, preferred_locations: list }), setLocationInput)} 
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <label style={lbl}>Maximum Annual Investment (INR)</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {['50,000', '1,00,000', '2,00,000', '5,00,000', '10,00,000'].map(b => (
                      <div key={b} style={quickChip} onClick={() => setForm({...form, max_budget: b.replace(/,/g, '')})}>₹ {b}</div>
                    ))}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', fontWeight: 700 }}>₹</span>
                    <input 
                      style={{ ...inp, paddingLeft: '40px' }} 
                      type="number" 
                      placeholder="e.g. 500000" 
                      value={form.max_budget} 
                      onChange={e => setForm({ ...form, max_budget: e.target.value })} 
                    />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Institution Classification</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['Any', 'Government', 'Private'].map(t => (
                      <button
                        key={t}
                        onClick={() => setForm({ ...form, preferred_college_type: t })}
                        style={{
                          flex: 1,
                          padding: '16px',
                          borderRadius: '16px',
                          border: '1px solid',
                          borderColor: form.preferred_college_type === t ? 'var(--gold)' : 'var(--border)',
                          background: form.preferred_college_type === t ? 'var(--gold-glow)' : 'var(--surface2)',
                          color: form.preferred_college_type === t ? 'var(--gold)' : 'var(--text2)',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '12px', textAlign: 'center', fontStyle: 'italic' }}>
                    {form.preferred_college_type === 'Government' ? 'Focusing on high-repute, low-fee public institutions.' : 
                     form.preferred_college_type === 'Private' ? 'Focusing on modern infrastructure and industry-aligned private universities.' : 
                     'Exploring a diverse range of educational opportunities.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Info Card */}
          {!isMobile && (
            <div style={{ width: '240px', background: 'var(--surface2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Summary</div>
                <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>Building your profile...</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text3)' }}>Exams:</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{Object.keys(form.entrance_exams).length}</span>
                </div>
                <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text3)' }}>Courses:</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{form.preferred_courses.length}</span>
                </div>
                <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text3)' }}>Locations:</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{form.preferred_locations.length}</span>
                </div>
                <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text3)' }}>Budget:</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{form.max_budget ? `₹${parseInt(form.max_budget).toLocaleString()}` : 'Not set'}</span>
                </div>
              </div>

              <div style={{ marginTop: 'auto', background: 'var(--surface)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border2)' }}>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>💡</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: 1.4 }}>
                  {step === 1 ? 'Add both your rank and percentile if available for better accuracy.' : 
                   step === 2 ? 'Choosing multiple locations increases your chances of finding a great match.' : 
                   'Consider government colleges if you have a tight budget.'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '20px', marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
          {step > 1 ? (
            <button style={{ padding: '14px 32px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '18px', color: 'var(--text)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setStep(step - 1)}>Back</button>
          ) : (
            <button style={{ padding: '14px 32px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '18px', color: 'var(--text3)', fontWeight: 600, cursor: 'pointer' }} onClick={onClose}>Cancel</button>
          )}
          <button 
            className="premium-gradient"
            style={{ flex: 1, padding: '14px', border: 'none', borderRadius: '18px', color: 'var(--bg)', fontWeight: 800, fontSize: '16px', cursor: 'pointer', boxShadow: '0 15px 35px var(--gold-glow)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', opacity: loading ? 0.7 : 1 }} 
            onClick={step < 3 ? () => setStep(step + 1) : handleSave} 
            disabled={loading}
          >
            {loading ? 'Analyzing Profile...' : step < 3 ? 'Continue Discovery' : 'Generate Recommendations'}
          </button>
        </div>
      </div>
    </div>
  )
}
