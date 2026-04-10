import { Link } from "react-router-dom";

export default function MapPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-green-100 text-green-900">
      <h1 className="text-4xl font-bold mb-4">Sakai Map View</h1>
      <p className="mb-4">The Leaflet map will be rendered here.</p>
      
      <Link to="/" className="text-blue-600 hover:underline">
        &larr; Back to Home
      </Link>
    </div>
  );
}