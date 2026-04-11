import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-48 h-48 bg-blue-50 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-blue-100">
        <img src="/aila-relax.png" alt="Aila Mascot" className="w-40 object-contain" />
      </div>
      <h1 className="text-5xl font-extrabold text-blue-900 mb-4">
        Meet <span className="text-blue-600">Aila</span>
      </h1>
      <p className="text-xl text-blue-700 max-w-md mb-10">
        Your smart, street-wise travel buddy for navigating Metro Manila. Budget mo, oras mo, diskarte ko.
      </p>
      <div className="flex gap-4">
        <Link to="/login" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">
          Try Aila Now
        </Link>
        <Link to="/register" className="px-8 py-4 bg-blue-50 text-blue-600 font-bold rounded-2xl hover:bg-blue-100 transition-colors border border-blue-200">
          Sign Up
        </Link>
      </div>
    </div>
  )
}