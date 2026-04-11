import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi, type AuthUser } from '../api'

interface RegisterProps {
  onAuthSuccess: (token: string, user: AuthUser) => void
}

export default function Register({ onAuthSuccess }: RegisterProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.register({ firstName, lastName, email, password })
      onAuthSuccess(res.token, res.user)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-100 w-full max-w-md border border-blue-100">
        <h2 className="text-3xl font-bold text-center text-blue-900 mb-2">Join Aila</h2>
        <p className="text-center text-blue-600 mb-8">Your smart travel buddy awaits!</p>
        
        {error && <div className="bg-blue-100 text-blue-800 p-3 rounded-xl mb-4 text-sm text-center border border-blue-200">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="First Name"
              className="w-1/2 p-4 rounded-xl border border-blue-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-blue-900"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              className="w-1/2 p-4 rounded-xl border border-blue-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-blue-900"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
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
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-blue-600">
          Already have an account? <Link to="/login" className="font-bold underline hover:text-blue-800">Log in</Link>
        </p>
      </div>
    </div>
  )
}