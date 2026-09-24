const BASE = '/api/v1'
async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}
export const api = {
  createUser: (name, email, password) => req('/profile/users', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  loginUser: (email, password) => req('/profile/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  saveProfile: (userId, profile) => req(`/profile/users/${userId}/profile`, { method: 'PUT', body: JSON.stringify(profile) }),
  saveApiKey: (userId, apiKey) => req(`/profile/users/${userId}/api-key`, { method: 'PUT', body: JSON.stringify({ openrouter_api_key: apiKey }) }),
  getUser: (userId) => req(`/profile/users/${userId}`),
  getProfile: (userId) => req(`/profile/users/${userId}/profile`),
  getUserByEmail: (email) => req(`/profile/users/by-email/${email}`),
  getSessions: (userId) => req(`/sessions/user/${userId}`),
  createSession: (userId, title = 'Career Counselling Session') => req('/sessions/', { method: 'POST', body: JSON.stringify({ user_id: userId, title }) }),
  updateSession: (sessionId, title) => req(`/sessions/${sessionId}`, { method: 'PUT', body: JSON.stringify({ title }) }),
  getSession: (sessionId) => req(`/sessions/${sessionId}`),
  deleteSession: (sessionId) => req(`/sessions/${sessionId}`, { method: 'DELETE' }),
  sendMessage: async (sessionId, userId, message, stream=false, useHf=false, useLm=false, signal=null) => {
    const params = new URLSearchParams({ 
      stream: stream ? 'true' : 'false',
      use_hf: useHf ? 'true' : 'false',
      use_lm: useLm ? 'true' : 'false'
    })
    const res = await fetch(BASE + '/chat/?' + params, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, user_id: userId, message }),
      signal
    })
    if (res.ok) {
      if (stream) {
        return res
      } else {
        const data = await res.json()
        return data
      }
    } else {
      const err = await res.json()
      throw new Error(err.detail || 'Request failed')
    }
  },
  sendFoundryReasoning: async (sessionId, userId, message, signal=null) => {
    const res = await fetch(BASE + '/foundry/reason', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, user_id: userId, message }),
      signal
    })
    if (res.ok) {
      return res
    } else {
      const err = await res.json()
      throw new Error(err.detail || 'Request failed')
    }
  },
  uploadResume: (userId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return fetch(BASE + `/profile/users/${userId}/resume`, { method: 'POST', body: formData })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.detail || 'Request failed') })
        }
        return res.json()
      })
  },
}
