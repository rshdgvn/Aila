import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100 text-gray-800">
      <h1 className="text-5xl font-bold mb-4 text-blue-600">Sakai</h1>
      <p className="text-xl mb-8">Smart Commute Planning, Powered by AI.</p>
      
      <Link 
        to="/map" 
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
      >
        Open Map
      </Link>
    </div>
  );
}