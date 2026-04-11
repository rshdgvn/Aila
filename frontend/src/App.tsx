import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import type { AuthUser } from './api'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api'

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('aila_token')
    
    if (!token) {
      setLoading(false)
      return
    }

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.email) {
          setUser(data)
        } else {
          localStorage.removeItem('aila_token')
        }
      })
      .catch(() => localStorage.removeItem('aila_token'))
      .finally(() => setLoading(false))
  }, [])

  const handleAuthSuccess = (token: string, userData: AuthUser) => {
    localStorage.setItem('aila_token', token)
    setUser(userData)
    navigate('/dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('aila_token')
    setUser(null)
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-blue-900 font-sans selection:bg-blue-200">
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  )
}