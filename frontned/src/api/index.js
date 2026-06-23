import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — but NOT on the login/register routes themselves,
// and use React Router navigation instead of a full page reload.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute = err.config?.url?.includes('/auth/login') || err.config?.url?.includes('/auth/register')
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.clear()
      // Soft redirect — don't nuke React state with a full reload
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── AUTH ──────────────────────────────────────────────
export const login    = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)

// ── VENUES ───────────────────────────────────────────
export const getVenues = () => api.get('/venues')

// ── QUEUES ───────────────────────────────────────────
export const getQueues = (venueId) => api.get(`/queues/${venueId}`)

// ── TOKENS ───────────────────────────────────────────
export const joinQueue  = (queue_id) => api.post('/tokens/join', { queue_id })
export const getMyToken = ()          => api.get('/tokens/my')
export const getHistory = ()          => api.get('/tokens/history')
export const nextToken  = (queue_id) => api.post('/tokens/next', { queue_id })

export default api