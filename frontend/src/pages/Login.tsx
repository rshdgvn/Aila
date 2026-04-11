import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api'
import type { AuthUser } from '../api'

interface LoginProps {
  onAuthSuccess: (token: string, user: AuthUser) => void
}

export default function Login({ onAuthSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ email, password })
      onAuthSuccess(res.token, res.user)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-100 w-full max-w-md border border-blue-100">
        <div className="flex justify-center mb-6">
          <img src="/aila-body-only.png" alt="Aila Mascot" className="w-24 h-24 object-contain bg-blue-50 rounded-full" />
        </div>
        <h2 className="text-3xl font-bold text-center text-blue-900 mb-8">Welcome back!</h2>
        
        {error && <div className="bg-blue-100 text-blue-800 p-3 rounded-xl mb-4 text-sm text-center border border-blue-200">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full p-4 rounded-xl border border-blue-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-blue-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-4 rounded-xl border border-blue-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-blue-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-blue-600">
          Don't have an account? <Link to="/register" className="font-bold underline hover:text-blue-800">Sign up here</Link>
        </p>
      </div>
    </div>
  )
}