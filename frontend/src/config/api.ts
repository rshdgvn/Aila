import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aila_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('aila_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
}

export interface Trip {
  id?: number
  origin: string
  destination: string
  mode: string
  distance_km: number
  duration_mins: number
  total_fare: number
  created_at?: string
  status?: string
}

export const authApi = {
  register: (data: any) => api.post('/auth/register', data).then(r => r.data),
  login: (data: any) => api.post('/auth/login', data).then(r => r.data),
  me: () => api.get<User>('/auth/me').then(r => r.data),
}

export const tripsApi = {
  create: (data: any) => api.post('/trips', data),
  getAll: () => api.get('/trips'),
  updateStatus: (tripId: number, status: string) => api.put(`/trips/${tripId}/status`, { status }),
}

export const routesApi = {
  getRoutes: (
    origin: string, 
    destination: string, 
    mode: string, 
    passenger_type: string = 'regular',
    gas_price: number = 60.0, 
    fuel_efficiency: number = 10.0
  ) => 
    api.get('/routes', { 
      params: { 
        origin, 
        destination, 
        mode, 
        passenger_type, 
        gas_price, 
        fuel_efficiency 
      } 
    }).then(r => r.data),

  autocomplete: (q: string) => 
    api.get('/autocomplete', { params: { q } }).then(r => r.data)
}

export const ailaApi = {
  chat: (data: { text: string; current_step: number; total_steps: number }) => 
    api.post('/aila/chat', data),
}