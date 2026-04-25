import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import polyline from "@mapbox/polyline";
import {
  ArrowLeft,
  Share2,
  MapPin,
  Activity,
  CircleDot,
  Car,
  Bus,
  Footprints,
  Navigation,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { type Trip } from "../config/api";

// --- MAP IMPORTS ---
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import { latLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";

import { originIcon, destIcon } from "../config/utils";

function MapFitter({ routeCoords }: { routeCoords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (routeCoords.length > 0) {
      // Dynamic padding: smaller padding on mobile so the route isn't squished
      const paddingParams: [number, number] =
        window.innerWidth < 768 ? [20, 20] : [50, 50];
      map.fitBounds(latLngBounds(routeCoords), { padding: paddingParams });
    }
  }, [routeCoords, map]);
  return null;
}

export default function TripDetails() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [trip] = useState<Trip | null>(location.state?.trip || null);

  useEffect(() => {
    if (!document.getElementById("raleway-sora-font")) {
      const link = document.createElement("link");
      link.id = "raleway-sora-font";
      link.href =
        "https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (!trip) navigate("/");
  }, [trip, navigate]);

  if (!trip) return null;

  // BROUGHT BACK the split(',') to show only the specific short name!
  const formatLocationName = (address: string) => {
    if (!address) return "Unknown Location";
    return address.split(",")[0].trim();
  };

  // --- MATH & METRICS ---
  const distance = trip.distance_km || 1;
  const duration = trip.duration_mins || 1;
  const avgSpeed = ((distance / duration) * 60).toFixed(1);
  const estSteps = Math.round(distance * 1312).toLocaleString();

  const tripMode = trip.mode?.toLowerCase() || "driving";

  // Choose the right Lucide icon based on mode
  const ModeIcon =
    tripMode === "walking" || tripMode === "bicycling"
      ? Footprints
      : tripMode === "transit"
        ? Bus
        : Car;

  // --- AILA'S STORY: PUNCHY, FACTUAL, NO EMOJIS ---
  const generateAilaStory = () => {
    if (tripMode === "walking" || tripMode === "bicycling") {
      return `Powered through ${estSteps} steps over ${distance}km. A solid, uninterrupted ${duration}-minute effort.`;
    }
    if (tripMode === "transit") {
      return `A ${distance}km cross-city transit completed in ${duration} minutes. Navigated with absolute precision.`;
    }
    return `Covered ${distance}km in ${duration} minutes. Maintained a steady pace of ${avgSpeed} km/h throughout the route.`;
  };

  const startCoord: [number, number] =
    (trip as any).origin_lat && (trip as any).origin_lng
      ? [(trip as any).origin_lat, (trip as any).origin_lng]
      : [14.5995, 120.9842];

  const endCoord: [number, number] =
    (trip as any).dest_lat && (trip as any).dest_lng
      ? [(trip as any).dest_lat, (trip as any).dest_lng]
      : [14.605, 120.989];

  const decodedPath = (trip as any).route_polyline
    ? polyline
        .decode((trip as any).route_polyline)
        .map((p: any) => [p[0], p[1]] as [number, number])
    : trip.path || [];

  const routeCoords: [number, number][] =
    decodedPath.length > 0 ? decodedPath : [startCoord, endCoord];

  return (
    <div
      className="h-[100svh] w-full flex flex-col bg-[#f0f4ff] text-[#0d1f5c] overflow-hidden"
      style={{ fontFamily: '"Raleway", sans-serif' }}
    >
      {/* ── TOP NAVBAR ── */}
      <div className="shrink-0 z-50 bg-white/90 backdrop-blur-xl border-b border-indigo-100 px-4 md:px-8 py-3.5 flex items-center justify-between w-full">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-[#0d1f5c] font-extrabold hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft size={18} className="mr-1.5" strokeWidth={2.5} /> Back
        </button>

        <div className="flex items-center gap-2">
          <img
            src="/aila-icon.png"
            alt="Aila"
            className="w-6 h-6 object-contain"
          />
          <span
            style={{ fontFamily: '"Sora", sans-serif' }}
            className="font-extrabold text-lg tracking-tight text-[#0d1f5c]"
          >
            Aila.
          </span>
        </div>

        <button className="p-2.5 text-slate-400 hover:text-[#0d1f5c] hover:bg-indigo-50 rounded-xl transition-colors">
          <Share2 size={20} />
        </button>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* 🗺️ MAP AREA - Increased height on mobile to 50% for a wider view */}
        <div className="flex-1 relative z-0 h-[50%] md:h-full bg-slate-100">
          {/* UPDATED: Compact floating card securely anchored to the left */}
          <div className="absolute top-3 left-3 z-[400] w-[65%] max-w-[260px] md:max-w-sm pointer-events-none flex flex-col gap-3">
            <div className="bg-white/95 backdrop-blur-xl p-3 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-indigo-50 pointer-events-auto">
              <p className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Activity size={10} strokeWidth={3} /> Route Analyzed
              </p>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-4 h-4 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <CircleDot size={8} className="text-indigo-600" />
                  </div>
                  {/* truncate forces long names onto one line to save space */}
                  <span
                    style={{ fontFamily: '"Sora", sans-serif' }}
                    className="text-[12px] font-bold text-[#0d1f5c] truncate w-full"
                  >
                    {formatLocationName(trip.origin)}
                  </span>
                </div>

                <div className="ml-2 w-px h-3 border-l-2 border-dashed border-indigo-200"></div>

                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-4 h-4 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                    <MapPin size={8} className="text-rose-600" />
                  </div>
                  <span
                    style={{ fontFamily: '"Sora", sans-serif' }}
                    className="text-[12px] font-bold text-[#0d1f5c] truncate w-full"
                  >
                    {formatLocationName(trip.destination)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <MapContainer
            center={startCoord}
            zoom={14}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap"
            />
            {routeCoords.length > 0 && <MapFitter routeCoords={routeCoords} />}
            {routeCoords.length > 0 && (
              <Polyline
                positions={routeCoords}
                color="#4f46e5"
                weight={5}
                lineCap="round"
                lineJoin="round"
              />
            )}
            <Marker position={startCoord} icon={originIcon} />
            <Marker position={endCoord} icon={destIcon} />
          </MapContainer>
        </div>

        {/* 📊 AILA STATS & STORY PANEL - Adjusted to 50% height on mobile */}
        <div className="shrink-0 h-[50%] md:h-full md:w-[420px] bg-white border-t md:border-t-0 md:border-l border-indigo-100 shadow-[0_-10px_40px_rgba(13,31,92,0.05)] z-10 flex flex-col relative rounded-t-[2rem] md:rounded-none overflow-hidden">
          <div className="w-full flex justify-center py-3 md:hidden absolute top-0 left-0 z-20">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 md:px-8 pt-8 md:pt-10 pb-6 custom-scrollbar flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0d1f5c] text-white flex items-center justify-center shadow-md shadow-indigo-900/20 shrink-0">
                  <span
                    style={{ fontFamily: '"Sora", sans-serif' }}
                    className="font-extrabold text-lg"
                  >
                    {user?.firstName?.charAt(0) || "U"}
                  </span>
                </div>
                <div>
                  <h2
                    style={{ fontFamily: '"Sora", sans-serif' }}
                    className="font-bold text-[15px] leading-tight text-[#0d1f5c]"
                  >
                    {user?.firstName}'s Trip
                  </h2>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
                    {trip.created_at
                      ? new Date(trip.created_at).toLocaleDateString()
                      : "Recent Journey"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9ff] text-[#0d1f5c] rounded-lg border border-indigo-100">
                <ModeIcon size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {trip.mode}
                </span>
              </div>
            </div>

            {/* Clean Big Stats */}
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                  Distance
                </p>
                <p
                  style={{ fontFamily: '"Sora", sans-serif' }}
                  className="text-5xl font-black text-[#0d1f5c] leading-none tracking-tight"
                >
                  {distance}
                  <span className="text-xl font-bold text-slate-400 ml-1 tracking-normal">
                    km
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                  Time
                </p>
                <p
                  style={{ fontFamily: '"Sora", sans-serif' }}
                  className="text-4xl font-black text-[#0d1f5c] leading-none tracking-tight"
                >
                  {duration}
                  <span className="text-lg font-bold text-slate-400 ml-1 tracking-normal">
                    min
                  </span>
                </p>
              </div>
            </div>

            {/* 🔥 AILA'S STORY */}
            <div className="flex flex-col mb-8">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Journey Summary
                </span>
              </div>

              <div className="bg-[#0d1f5c] rounded-[24px] p-5 md:p-6 text-white shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 md:mb-5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <ModeIcon size={14} className="text-white" />
                  </div>

                  <div className="flex items-center gap-2 border border-white/20 px-2.5 py-1.5 rounded-lg bg-white/5">
                    <img
                      src="/aila-icon.png"
                      alt="Aila"
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                      Aila Trip
                    </span>
                  </div>
                </div>

                <h3
                  style={{ fontFamily: '"Sora", sans-serif' }}
                  className="text-[16px] md:text-[18px] font-bold leading-[1.5] text-white"
                >
                  {generateAilaStory()}
                </h3>
              </div>
            </div>

            {/* ── ACTION BUTTONS ── */}
            <div className="flex items-center gap-3 mt-auto">
              <button
                onClick={() => navigate("/new-travel")}
                className="flex-1 flex items-center justify-center gap-2 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-extrabold text-[13px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                <Navigation size={18} strokeWidth={2.5} />
                Navigate Again
              </button>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `,
        }}
      />
    </div>
  );
}
