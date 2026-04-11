import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type User, authApi } from '../config/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('aila_token')
    if (!token) {
      setLoading(false)
      return
    }

    authApi.me()
      .then(setUser)
      .catch(() => localStorage.removeItem('aila_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = (token: string, userData: User) => {
    localStorage.setItem('aila_token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('aila_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}