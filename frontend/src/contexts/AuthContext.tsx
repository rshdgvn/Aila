import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, type AuthUser } from '../api'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('aila_token')
    if (!token) { setLoading(false); return }

    authApi.me()
      .then(setUser)
      .catch(() => localStorage.removeItem('aila_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback((token: string, userData: AuthUser) => {
    localStorage.setItem('aila_token', token)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('aila_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}