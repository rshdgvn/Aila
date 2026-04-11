import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('aila_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — clear token and reload
api.interceptors.response.use(
  (r: any) => r,
  (err: any) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('aila_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export const authApi = {
  register: (data: { firstName: string; lastName: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', data).then((r: any) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r: any) => r.data),

  me: () => api.get<AuthUser>('/auth/me').then((r: any) => r.data),
}

// ─── Routes ───────────────────────────────────────────────────────────────────
export interface LegResult {
  type: 'WALKING' | 'TRANSIT'
  vehicle_type?: string
  aila_mode?: string
  line?: string
  headsign?: string
  instructions?: string
  origin?: string
  destination?: string
  num_stops?: number
  distance_km: number
  duration_mins: number
  fare: number
  geometry: string
  path?: [number, number][]
}

export interface Route {
  route_index: number
  summary: string
  origin_name: string
  destination_name: string
  grand_total_fare: number
  total_distance_km: number
  total_duration_mins: number
  route_mode?: string
  route_score?: number
  legs: LegResult[]
}

export interface RouteSearchResponse {
  origin_display: string
  destination_display: string
  user_type: string
  route_mode: string
  budget: number | null
  aila_tip: string
  routes: Route[]
  no_results_in_budget: boolean
  error?: string
}

export type RouteMode = 'tipid' | 'mabilis' | 'balanced' | 'komportable'
export type UserType = 'regular' | 'student' | 'senior' | 'pwd'

export const routeApi = {
  search: (params: {
    origin: string
    destination: string
    user_type: UserType
    budget?: number
    route_mode: RouteMode
  }) => api.get<RouteSearchResponse>('/routes', { params }).then((r) => r.data),

  autocomplete: (q: string) =>
    api.get<{ suggestions: { description: string; place_id: string }[] }>('/autocomplete', { params: { q } }).then((r) => r.data),
}

export default api