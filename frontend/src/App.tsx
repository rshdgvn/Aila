import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import NewTravel from './pages/NewTravel'
import ActiveJourney from './pages/ActiveJourney'
import Home from "./pages/Home"
import Register from './pages/Register'
import Login from './pages/Login'
import TripDetails from './pages/TripDetails'
import Settings from './pages/Settings'
import SavedPlaces from './pages/SavedPlaces'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <img 
            src="/aila-body-only.png" 
            alt="Loading" 
            className="w-10 h-10 absolute inset-0 m-auto animate-pulse" 
          />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Aila...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/new-travel" element={user ? <NewTravel /> : <Navigate to="/login" />} />
        <Route path="/active-journey" element={user ? <ActiveJourney /> : <Navigate to="/login" />} />
        <Route path="/trip/:id" element={user ? <TripDetails /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/saved-places" element={user ? <SavedPlaces /> : <Navigate to="/login" />} />


        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}